const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPlayer, updatePlayer } = require('../database');
const { checkAndResetDailyStats, hasEnoughAP, createInsufficientAPEmbed } = require('../daily-reset');
const { getWeatherInfo, getWeatherByLocation, getWeatherEffects, getWeatherMood } = require('../game_logic/weather');
const { isActionPossible, getSuggestions } = require('../utils/validator');
const { buildDetailedSituationContext } = require('../utils/context-builder');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Definisi aksi dengan biaya AP dan karakteristik masing-masing
const ACTIONS = {
    'latihan_gitar': {
        name: 'Latihan Gitar Sendiri',
        apCost: 3,
        description: 'Berlatih gitar sendirian untuk meningkatkan skill musik',
        focusStats: ['bocchi_trust', 'bocchi_comfort'],
        skillType: 'music',
        location: 'private'
    },
    'bekerja_starry': {
        name: 'Bekerja di STARRY',
        apCost: 4,
        description: 'Bekerja part-time di live house STARRY',
        focusStats: ['nijika_trust', 'nijika_comfort', 'ryo_trust', 'kita_trust'],
        skillType: 'social',
        location: 'starry'
    },
    'menulis_lagu': {
        name: 'Menulis Lagu',
        apCost: 2,
        description: 'Menulis lirik atau komposisi lagu baru',
        focusStats: ['bocchi_affection', 'kita_affection'],
        skillType: 'creative',
        location: 'private'
    },
    'jalan_shimokitazawa': {
        name: 'Jalan-jalan di Shimokitazawa',
        apCost: 1,
        description: 'Berjalan-jalan santai di sekitar Shimokitazawa',
        focusStats: ['nijika_comfort', 'ryo_comfort', 'kita_comfort'],
        skillType: 'exploration',
        location: 'street'
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('act')
        .setDescription('Lakukan aksi terstruktur dalam dunia Bocchi the Rock!')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Pilih aksi yang ingin dilakukan')
                .setRequired(true)
                .addChoices(
                    { name: 'Latihan Gitar Sendiri', value: 'latihan_gitar' },
                    { name: 'Bekerja di STARRY', value: 'bekerja_starry' },
                    { name: 'Menulis Lagu', value: 'menulis_lagu' },
                    { name: 'Jalan-jalan di Shimokitazawa', value: 'jalan_shimokitazawa' }
                )
        ),
    
    async execute(interaction) {
        const discordId = interaction.user.id;
        const actionKey = interaction.options.getString('action');
        const actionData = ACTIONS[actionKey];
        
        if (!actionData) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ Aksi Tidak Valid')
                .setDescription('Aksi yang dipilih tidak tersedia.')
                .setTimestamp();
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        try {
            // a. Validasi Pemain dan Reset Harian (sama seperti /say)
            console.log(`[ACT] Validasi pemain ${discordId} untuk aksi ${actionData.name}`);
            let player = await getPlayer(discordId);
            
            if (!player) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Belum Memulai Hidup')
                    .setDescription('Kamu belum memulai hidup dalam dunia Bocchi the Rock!')
                    .addFields({
                        name: '🚀 Cara Memulai',
                        value: 'Gunakan command `/start_life` untuk memulai petualangan Anda!',
                        inline: false
                    })
                    .setTimestamp();
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Cek dan lakukan reset harian jika diperlukan
            console.log(`[ACT] Checking daily reset...`);
            const resetResult = await checkAndResetDailyStats(discordId, interaction);
            
            // Update player object dengan data terbaru setelah reset
            if (resetResult.player) {
                player = resetResult.player;
            }
            
            // Validasi Action Points setelah reset
            if (!hasEnoughAP(player, actionData.apCost)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('😴 Action Points Tidak Cukup')
                    .setDescription(`Kamu membutuhkan ${actionData.apCost} AP untuk "${actionData.name}", tapi hanya memiliki ${player.action_points || 0} AP.`)
                    .addFields(
                        { name: '⚡ AP Dibutuhkan', value: actionData.apCost.toString(), inline: true },
                        { name: '⚡ AP Tersedia', value: (player.action_points || 0).toString(), inline: true },
                        { name: '💡 Tips', value: 'Pilih aksi yang membutuhkan AP lebih sedikit atau tunggu reset harian.', inline: false }
                    )
                    .setTimestamp();
                
                // Jika sudah ada notifikasi reset harian, kirim sebagai followUp
                if (resetResult.isNewDay) {
                    return await interaction.followUp({ embeds: [embed], ephemeral: true });
                } else {
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }
            
            console.log(`[ACT] Player validated. AP: ${player.action_points}, Required: ${actionData.apCost}`);

            // b. Validasi Aksi dengan Sistem Jadwal Dunia
            console.log(`[ACT] Memvalidasi aksi ${actionKey}...`);

            // Validasi apakah aksi memungkinkan berdasarkan waktu dan jadwal
            const validation = isActionPossible(actionKey, null, discordId);
            console.log(`[ACT] Hasil validasi: ${validation.possible ? 'VALID' : 'INVALID'}`);

            if (!validation.possible) {
                // Aksi tidak memungkinkan - jangan panggil LLM, langsung beri feedback
                console.log(`[ACT] Aksi ditolak: ${validation.reason}`);

                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Aksi Tidak Memungkinkan')
                    .setDescription(validation.reason)
                    .addFields({
                        name: '💡 Saran',
                        value: this.buildActionSuggestionText(actionKey),
                        inline: false
                    })
                    .addFields({
                        name: '🕐 Waktu Saat Ini',
                        value: validation.context?.currentTime || 'Tidak diketahui',
                        inline: true
                    })
                    .addFields({
                        name: '⚡ AP yang Akan Dikembalikan',
                        value: `${actionData.apCost} AP (aksi dibatalkan)`,
                        inline: true
                    })
                    .setTimestamp();

                // Jika sudah ada notifikasi reset harian, kirim sebagai followUp
                if (resetResult.isNewDay) {
                    return await interaction.followUp({ embeds: [embed], ephemeral: true });
                } else {
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }

            // c. Bentuk Prompt Spesifik untuk Aksi (hanya jika validasi berhasil)
            const prompt = this.buildActionPrompt(player, actionData, validation.context);
            console.log(`[ACT] Action prompt built, length: ${prompt.length} characters`);
            
            // Defer reply karena LLM call bisa memakan waktu
            if (!resetResult.isNewDay) {
                await interaction.deferReply();
            }
            
            // c. Panggil LLM API
            console.log(`[ACT] Calling Gemini API for action: ${actionData.name}`);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const llmResponse = response.text();
            
            console.log(`[ACT] LLM response received: ${llmResponse.substring(0, 100)}...`);
            
            // d. Proses Respons LLM (sama seperti /say)
            let parsedResponse;
            try {
                const cleanResponse = llmResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                parsedResponse = JSON.parse(cleanResponse);
                
                if (!parsedResponse.narration || !parsedResponse.stat_changes) {
                    throw new Error('Struktur respons LLM tidak valid');
                }
                
                console.log(`[ACT] Response successfully parsed`);
            } catch (parseError) {
                console.error(`[ACT] Error parsing LLM response:`, parseError);
                console.error(`[ACT] Raw response:`, llmResponse);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('🤖 Error AI')
                    .setDescription('Maaf, terjadi kesalahan dalam memproses respons AI. Silakan coba lagi.')
                    .setTimestamp();
                
                if (resetResult.isNewDay) {
                    return await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    return await interaction.editReply({ embeds: [errorEmbed] });
                }
            }
            
            // e. Perbarui Database
            console.log(`[ACT] Updating database with stat_changes:`, parsedResponse.stat_changes);
            
            const updates = {};
            for (const [key, value] of Object.entries(parsedResponse.stat_changes)) {
                if (this.isValidDatabaseField(key)) {
                    updates[key] = value;
                } else {
                    console.warn(`[ACT] Invalid field ignored: ${key}`);
                }
            }
            
            // Pastikan AP dikurangi sesuai biaya aksi
            updates.action_points = -actionData.apCost;
            
            if (Object.keys(updates).length > 0) {
                await this.updatePlayerStats(discordId, updates);
                console.log(`[ACT] Database successfully updated`);
            }
            
            // f. Balas ke Pemain
            const embed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setTitle(`🎭 ${actionData.name}`)
                .setDescription(parsedResponse.narration)
                .addFields({
                    name: '🎯 Aksi yang Dilakukan:',
                    value: actionData.description,
                    inline: false
                });
            
            // Tambahkan informasi perubahan stats jika ada
            if (Object.keys(updates).length > 0) {
                const statsText = this.formatStatChanges(updates);
                embed.addFields({
                    name: '📊 Perubahan Status:',
                    value: statsText,
                    inline: false
                });
            }
            
            embed.setFooter({ 
                text: `AP tersisa: ${(player.action_points || 0) - actionData.apCost} | Biaya aksi: ${actionData.apCost} AP` 
            })
            .setTimestamp();
            
            // Kirim reply sesuai dengan kondisi reset harian
            if (resetResult.isNewDay) {
                await interaction.followUp({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            console.log(`[ACT] Action completed for player ${discordId}: ${actionData.name}`);
            
        } catch (error) {
            console.error('Error dalam command act:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Error')
                .setDescription('Terjadi kesalahan saat memproses aksi. Silakan coba lagi.')
                .setTimestamp();
            
            // Handle error reply berdasarkan kondisi interaction
            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else if (interaction.replied) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    // Helper function untuk membangun prompt spesifik untuk aksi
    buildActionPrompt(player, actionData) {
        // Ekstrak informasi cuaca dari database
        const currentWeatherName = player.current_weather ? player.current_weather.split(' - ')[0] : 'Cerah';
        const weatherInfo = getWeatherInfo(currentWeatherName);
        const weatherMood = getWeatherMood(currentWeatherName);
        const weatherEffects = getWeatherEffects(currentWeatherName);
        const locationWeather = getWeatherByLocation(currentWeatherName, actionData.location);

        // Instruksi sistem spesifik untuk aksi
        const systemInstructions = `
Kamu adalah Game Master untuk game simulasi berbasis teks "Bocchi the Rock!".

KONTEKS AKSI:
Pemain memilih aksi terstruktur "${actionData.name}" yang membutuhkan ${actionData.apCost} Action Points.
Ini BUKAN dialog interaktif - pemain melakukan aktivitas sendiri.

FOKUS NARASI:
- Deskripsi detail tentang aktivitas yang dilakukan
- Narasi internal pemain (pikiran, perasaan, refleksi)
- Kemajuan atau tantangan yang dihadapi
- Dampak cuaca dan lingkungan pada aktivitas
- Tidak ada dialog dengan karakter lain (kecuali jika relevan dengan aksi)

JENIS AKSI: ${actionData.skillType ? actionData.skillType.toUpperCase() : 'UNKNOWN'}
LOKASI: ${actionData.location ? actionData.location.toUpperCase() : 'UNKNOWN'}
STATS FOKUS: ${actionData.focusStats.join(', ')}

ATURAN SPESIFIK BERDASARKAN AKSI:

${this.getActionSpecificRules(actionData)}

SISTEM CUACA SAAT INI:
- Cuaca: ${currentWeatherName} (${weatherMood})
- Deskripsi: ${weatherInfo ? weatherInfo.description : 'Cuaca normal'}
- Efek: ${JSON.stringify(weatherEffects)}
- Kondisi lokasi: ${locationWeather}

ATURAN RESPONS:
- Berikan narasi yang immersive dan fokus pada aktivitas
- Perubahan stats harus logis berdasarkan aksi dan cuaca
- Action points SELALU berkurang -${actionData.apCost} per aksi
- Maksimal perubahan stats per aksi: ±3 poin untuk stats fokus, ±1 untuk stats lain
- Cuaca mempengaruhi mood dan efektivitas aksi
- Respons dalam format JSON yang valid
`;

        // Status pemain saat ini
        const playerStatus = {
            action_points: player.action_points || 0,
            origin_story: player.origin_story || 'unknown',
            current_weather: player.current_weather || 'tidak diketahui',
            relationships: {
                bocchi: {
                    trust: player.bocchi_trust || 0,
                    comfort: player.bocchi_comfort || 0,
                    affection: player.bocchi_affection || 0
                },
                nijika: {
                    trust: player.nijika_trust || 0,
                    comfort: player.nijika_comfort || 0,
                    affection: player.nijika_affection || 0
                },
                ryo: {
                    trust: player.ryo_trust || 0,
                    comfort: player.ryo_comfort || 0,
                    affection: player.ryo_affection || 0
                },
                kita: {
                    trust: player.kita_trust || 0,
                    comfort: player.kita_comfort || 0,
                    affection: player.kita_affection || 0
                }
            }
        };

        // Konteks situasi untuk aksi
        const actionContext = {
            aksi: actionData.name,
            biaya_ap: actionData.apCost,
            tipe_skill: actionData.skillType,
            lokasi: actionData.location,
            stats_fokus: actionData.focusStats,
            cuaca: currentWeatherName,
            cuaca_mood: weatherMood,
            cuaca_efek_lokasi: locationWeather
        };

        const fullPrompt = `${systemInstructions}

Status Pemain: ${JSON.stringify(playerStatus, null, 2)}

Konteks Aksi: ${JSON.stringify(actionContext, null, 2)}

INSTRUKSI RESPONS:
Berikan respons dalam format JSON yang VALID dengan struktur berikut:
{
  "narration": "Narasi detail tentang aktivitas yang dilakukan pemain. Fokus pada deskripsi internal, kemajuan, tantangan, dan dampak cuaca. Minimal 100 kata.",
  "stat_changes": {
    "action_points": -${actionData.apCost},
    "bocchi_trust": 0,
    "bocchi_comfort": 0,
    "bocchi_affection": 0,
    "nijika_trust": 0,
    "nijika_comfort": 0,
    "nijika_affection": 0,
    "ryo_trust": 0,
    "ryo_comfort": 0,
    "ryo_affection": 0,
    "kita_trust": 0,
    "kita_comfort": 0,
    "kita_affection": 0,
    "current_weather": null
  }
}

PENTING:
- Fokus perubahan pada stats yang relevan dengan aksi (${actionData.focusStats.join(', ')})
- Action points SELALU -${actionData.apCost}
- Pertimbangkan efek cuaca pada hasil aksi
- Narasi harus menggambarkan aktivitas solo, bukan interaksi sosial
- JSON harus valid tanpa trailing comma atau syntax error`;

        return fullPrompt;
    },

    // Helper function untuk mendapatkan aturan spesifik berdasarkan jenis aksi
    getActionSpecificRules(actionData) {
        switch (actionData.skillType) {
            case 'music':
                return `
LATIHAN GITAR SENDIRI:
- Fokus pada peningkatan skill musik dan kepercayaan diri
- Kemungkinan frustasi atau breakthrough dalam bermain
- Refleksi tentang musik dan band Kessoku
- Pengaruh cuaca pada mood latihan
- Kemajuan teknik atau emosional dalam bermusik
- Possible stats: bocchi_trust +1-3, bocchi_comfort +1-2`;

            case 'social':
                return `
BEKERJA DI STARRY:
- Interaksi dengan staff dan pengunjung live house
- Belajar tentang industri musik dari dalam
- Kemungkinan bertemu member Kessoku Band
- Pengalaman kerja yang membangun kepercayaan diri
- Observasi pertunjukan band lain
- Possible stats: nijika_trust +1-2, ryo_trust +1-2, kita_trust +1-2, comfort stats +1`;

            case 'creative':
                return `
MENULIS LAGU:
- Proses kreatif menulis lirik atau komposisi
- Inspirasi dari pengalaman sehari-hari
- Tantangan mengekspresikan perasaan dalam musik
- Kemungkinan writer's block atau eureka moment
- Refleksi tentang tema dan pesan lagu
- Possible stats: bocchi_affection +1-3, kita_affection +1-2, comfort stats +1`;

            case 'exploration':
                return `
JALAN-JALAN DI SHIMOKITAZAWA:
- Eksplorasi area sekitar dengan santai
- Observasi kehidupan sehari-hari di Shimokitazawa
- Kemungkinan menemukan tempat atau hal menarik
- Relaksasi dan refreshing mental
- Interaksi ringan dengan lingkungan
- Possible stats: comfort stats +1-2 untuk semua karakter, trust +1 random`;

            default:
                return `
AKSI UMUM:
- Fokus pada pengembangan diri
- Dampak positif pada hubungan dengan karakter
- Pertimbangkan efek cuaca dan lokasi`;
        }
    },

    // Helper function untuk validasi field database (sama seperti di say.js)
    isValidDatabaseField(fieldName) {
        const validFields = [
            'action_points',
            'current_weather',
            'bocchi_trust', 'bocchi_comfort', 'bocchi_affection',
            'nijika_trust', 'nijika_comfort', 'nijika_affection',
            'ryo_trust', 'ryo_comfort', 'ryo_affection',
            'kita_trust', 'kita_comfort', 'kita_affection'
        ];
        return validFields.includes(fieldName);
    },

    // Helper function untuk update player stats dengan relative values (sama seperti di say.js)
    async updatePlayerStats(discordId, updates) {
        const { db } = require('../database');

        return new Promise((resolve, reject) => {
            const updateClauses = [];
            const values = [];

            for (const [field, value] of Object.entries(updates)) {
                if (field === 'current_weather') {
                    if (value && value !== 'null' && value !== null) {
                        updateClauses.push(`${field} = ?`);
                        values.push(value);
                    }
                } else {
                    if (typeof value === 'number' && value !== 0) {
                        updateClauses.push(`${field} = ${field} + ?`);
                        values.push(value);
                    }
                }
            }

            if (updateClauses.length === 0) {
                return resolve(0);
            }

            const query = `UPDATE players SET ${updateClauses.join(', ')} WHERE discord_id = ?`;
            values.push(discordId);

            console.log(`[ACT] SQL Query: ${query}`);
            console.log(`[ACT] Values: ${JSON.stringify(values)}`);

            db.run(query, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },

    // Helper function untuk format perubahan stats (sama seperti di say.js)
    formatStatChanges(updates) {
        const changes = [];

        for (const [field, value] of Object.entries(updates)) {
            if (field === 'action_points' && value !== 0) {
                changes.push(`⚡ Action Points: ${value > 0 ? '+' : ''}${value}`);
            } else if (field === 'current_weather' && value && value !== 'null') {
                changes.push(`🌤️ Cuaca: ${value}`);
            } else if (field.includes('_') && value !== 0) {
                const [character, statType] = field.split('_');
                const characterEmoji = {
                    'bocchi': '🎸',
                    'nijika': '🥁',
                    'ryo': '🎸',
                    'kita': '🎤'
                };
                const statName = statType.charAt(0).toUpperCase() + statType.slice(1);
                changes.push(`${characterEmoji[character]} ${character.charAt(0).toUpperCase() + character.slice(1)} ${statName}: ${value > 0 ? '+' : ''}${value}`);
            }
        }

        return changes.length > 0 ? changes.join('\n') : 'Tidak ada perubahan';
    },

    // Helper function untuk membuat teks saran aksi
    buildActionSuggestionText(actionKey) {
        const suggestions = getSuggestions(actionKey, null);
        return `**${suggestions.tips}**\n\n**Waktu yang disarankan:**\n${suggestions.suggestedTimes.join('\n')}`;
    },

    // Update buildActionPrompt untuk menggunakan konteks waktu yang detail
    buildActionPrompt(player, actionData, validationContext = null) {
        // Bangun konteks situasi yang sangat detail untuk aksi terstruktur
        const situationContext = buildDetailedSituationContext(player, actionData.name.toLowerCase().replace(/\s+/g, '_'), null, validationContext);

        // Dapatkan informasi cuaca untuk efek gameplay
        const weatherInfo = getWeatherInfo(player.current_weather);
        const weatherEffects = getWeatherEffects(weatherInfo);

        // Bangun prompt dengan konteks yang kaya
        let prompt = `SISTEM AKSI TERSTRUKTUR "BOCCHI THE ROCK!":
Pemain melakukan aksi terstruktur "${actionData.name}" yang membutuhkan ${actionData.apCost} Action Points.
Ini adalah aktivitas solo yang fokus pada pengembangan diri dan skill.

${situationContext}

INFORMASI PEMAIN:
- Origin Story: ${player.origin_story}
- Action Points: ${player.action_points}/10

DETAIL AKSI:
- Nama: ${actionData.name}
- Deskripsi: ${actionData.description}
- Biaya AP: ${actionData.apCost}
- Skill Type: ${actionData.skillType}
- Lokasi Type: ${actionData.location}
- Focus Stats: ${actionData.focusStats.join(', ')}

EFEK CUACA PADA GAMEPLAY:
${Object.entries(weatherEffects).map(([key, value]) => `- ${key}: ${value > 0 ? '+' : ''}${value}%`).join('\n')}

${this.getActionSpecificRules(actionData)}

INSTRUKSI NARASI:
1. Gunakan konteks waktu JST dan atmosphere untuk menciptakan narasi yang immersive
2. Fokus pada pengalaman internal pemain (pikiran, perasaan, refleksi)
3. Deskripsikan detail aktivitas dengan suasana waktu dan cuaca
4. Jelaskan kemajuan, tantangan, atau insight yang didapat
5. Integrasikan efek cuaca dan waktu pada mood dan efektivitas aktivitas
6. Buat narasi yang terasa personal dan meaningful

ATURAN STATISTIK:
- action_points: Selalu -${actionData.apCost} (biaya aksi)
- Focus stats (${actionData.focusStats.join(', ')}): -2 hingga +3
- Gunakan efek cuaca sebagai modifier
- Berikan bonus untuk optimality tinggi atau kondisi ideal
- Sesuaikan dengan mood dan atmosphere waktu

FORMAT RESPONS (JSON):
{
    "narration": "Narasi detail dan immersive tentang aktivitas dengan konteks waktu...",
    "stat_changes": {
        "action_points": -${actionData.apCost},
        "bocchi_trust": 0,
        "nijika_comfort": 0
    }
}`;

        return prompt;
    }
};
