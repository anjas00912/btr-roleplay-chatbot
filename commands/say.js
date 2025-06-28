const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPlayer, updatePlayer } = require('../database');
const { checkAndResetDailyStats, hasEnoughAP, createInsufficientAPEmbed } = require('../daily-reset');
const { getWeatherInfo, getWeatherByLocation, getWeatherEffects, getWeatherMood } = require('../game_logic/weather');
const { isActionPossible, getSuggestions } = require('../utils/validator');
const { buildDetailedSituationContext } = require('../utils/context-builder');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Berinteraksi dalam dunia Bocchi the Rock!')
        .addStringOption(option =>
            option.setName('dialog')
                .setDescription('Apa yang ingin kamu katakan dalam game?')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const discordId = interaction.user.id;
        const dialog = interaction.options.getString('dialog');
        
        try {
            // a. Validasi Pemain dan Reset Harian
            console.log(`[SAY] Validasi pemain ${discordId}`);
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
            console.log(`[SAY] Checking daily reset...`);
            const resetResult = await checkAndResetDailyStats(discordId, interaction);

            // Update player object dengan data terbaru setelah reset
            if (resetResult.player) {
                player = resetResult.player;
            }

            // Validasi Action Points setelah reset
            if (!hasEnoughAP(player, 1)) {
                const embed = createInsufficientAPEmbed(player.action_points || 0);

                // Jika sudah ada notifikasi reset harian, kirim sebagai followUp
                if (resetResult.isNewDay) {
                    return await interaction.followUp({ embeds: [embed], ephemeral: true });
                } else {
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }

            // b. Ambil Status Saat Ini (sudah didapat dan diupdate dari reset check)
            console.log(`[SAY] Status pemain: AP=${player.action_points}, Origin=${player.origin_story}, Weather=${player.current_weather}`);

            // c. Validasi Aksi dengan Sistem Jadwal Dunia
            console.log(`[SAY] Memvalidasi aksi bicara...`);

            // Ekstrak target dari dialog (sederhana: cari nama karakter dalam dialog)
            const target = this.extractTargetFromDialog(dialog);
            console.log(`[SAY] Target yang terdeteksi: ${target || 'tidak spesifik'}`);

            // Validasi apakah aksi memungkinkan
            const validation = isActionPossible('say', target, discordId);
            console.log(`[SAY] Hasil validasi: ${validation.possible ? 'VALID' : 'INVALID'}`);

            if (!validation.possible) {
                // Aksi tidak memungkinkan - jangan panggil LLM, langsung beri feedback
                console.log(`[SAY] Aksi ditolak: ${validation.reason}`);

                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Aksi Tidak Memungkinkan')
                    .setDescription(validation.reason)
                    .addFields({
                        name: '💡 Saran',
                        value: this.buildSuggestionText(target),
                        inline: false
                    })
                    .addFields({
                        name: '🕐 Waktu Saat Ini',
                        value: validation.context?.currentTime || 'Tidak diketahui',
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

            // d. Bentuk Prompt untuk LLM (hanya jika validasi berhasil)
            const prompt = this.buildLLMPrompt(player, dialog, validation.context);
            console.log(`[SAY] Prompt dibuat, panjang: ${prompt.length} karakter`);

            // Defer reply karena LLM call bisa memakan waktu
            // Jika sudah ada notifikasi reset harian, tidak perlu defer lagi
            if (!resetResult.isNewDay) {
                await interaction.deferReply();
            }
            
            // d. Panggil LLM API
            console.log(`[SAY] Memanggil Gemini API...`);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const llmResponse = response.text();
            
            console.log(`[SAY] Respons LLM diterima: ${llmResponse.substring(0, 100)}...`);
            
            // e. Proses Respons LLM
            let parsedResponse;
            try {
                // Bersihkan respons dari markdown code blocks jika ada
                const cleanResponse = llmResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                parsedResponse = JSON.parse(cleanResponse);
                
                // Validasi struktur respons
                if (!parsedResponse.narration || !parsedResponse.stat_changes) {
                    throw new Error('Struktur respons LLM tidak valid');
                }
                
                console.log(`[SAY] Respons berhasil di-parse`);
            } catch (parseError) {
                console.error(`[SAY] Error parsing LLM response:`, parseError);
                console.error(`[SAY] Raw response:`, llmResponse);
                
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
            
            // f. Perbarui Database
            console.log(`[SAY] Memperbarui database dengan stat_changes:`, parsedResponse.stat_changes);
            
            const updates = {};
            for (const [key, value] of Object.entries(parsedResponse.stat_changes)) {
                // Pastikan key adalah field yang valid di database
                if (this.isValidDatabaseField(key)) {
                    updates[key] = value;
                } else {
                    console.warn(`[SAY] Field tidak valid diabaikan: ${key}`);
                }
            }
            
            if (Object.keys(updates).length > 0) {
                await this.updatePlayerStats(discordId, updates);
                console.log(`[SAY] Database berhasil diperbarui`);
            }
            
            // g. Balas ke Pemain
            const embed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setTitle('🎭 Interaksi dalam Game')
                .setDescription(parsedResponse.narration)
                .addFields({
                    name: '💬 Kamu berkata:',
                    value: `"${dialog}"`,
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
            
            embed.setFooter({ text: `Action Points tersisa: ${(player.action_points || 0) + (updates.action_points || 0)}` })
                .setTimestamp();

            // Kirim reply sesuai dengan kondisi reset harian
            if (resetResult.isNewDay) {
                await interaction.followUp({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
            console.log(`[SAY] Interaksi selesai untuk pemain ${discordId}`);
            
        } catch (error) {
            console.error('Error dalam command say:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Error')
                .setDescription('Terjadi kesalahan saat memproses interaksi. Silakan coba lagi.')
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

    // Helper function untuk membangun prompt LLM yang komprehensif
    buildLLMPrompt(player, dialog) {
        // Ekstrak informasi cuaca dari database
        const currentWeatherName = player.current_weather ? player.current_weather.split(' - ')[0] : 'Cerah';
        const weatherInfo = getWeatherInfo(currentWeatherName);
        const weatherMood = getWeatherMood(currentWeatherName);
        const weatherEffects = getWeatherEffects(currentWeatherName);

        // i. Instruksi Master (Sistem)
        const systemInstructions = `
Kamu adalah Game Master untuk game simulasi berbasis teks "Bocchi the Rock!".

ATURAN MAIN:
- Pemain berinteraksi dengan karakter dari anime Bocchi the Rock
- Setiap interaksi menggunakan 1 Action Point
- Hubungan dengan karakter diukur dalam Trust, Comfort, dan Affection (0-100 masing-masing)
- Cuaca sangat mempengaruhi mood dan interaksi
- Respons harus realistis sesuai kepribadian karakter dan kondisi cuaca

SISTEM CUACA DINAMIS:
- Cerah (35%): Mood cheerful, bonus trust +10%, comfort +10%, energy tinggi
- Cerah Berawan (25%): Mood pleasant, bonus trust +5%, comfort +5%, energy normal
- Mendung (15%): Mood melancholic, bonus affection +10%, comfort -5%, energy rendah
- Hujan Ringan (12%): Mood romantic, bonus affection +15%, comfort +10%, energy calm
- Hujan Deras (8%): Mood intimate, bonus affection +20%, trust +10%, energy cozy
- Berangin (3%): Mood dramatic, bonus trust +5%, comfort -10%, energy dynamic
- Dingin (1.5%): Mood cozy, bonus comfort +15%, affection +10%, energy rendah
- Badai (0.5%): Mood intense, bonus affection +25%, trust +15%, energy tinggi

KEPRIBADIAN KARAKTER:
- Bocchi (Hitori Gotoh): Sangat pemalu, introvert, mudah panik, tapi berbakat musik. Sulit didekati tapi loyal jika sudah percaya.
  * Cuaca cerah: Sedikit lebih berani keluar
  * Cuaca hujan: Lebih nyaman di dalam, mood introspektif
  * Cuaca dingin: Cenderung menghindar, butuh kehangatan
- Nijika (Ijichi Nijika): Ceria, ramah, drummer band. Mudah bergaul dan supportif. Suka membantu orang lain.
  * Cuaca cerah: Extra energik dan ceria
  * Cuaca mendung: Tetap optimis, berusaha menghibur
  * Cuaca hujan: Menikmati suara hujan untuk ritme drum
- Ryo (Yamada Ryo): Cool, tenang, bassist. Sedikit bicara tapi perhatian. Suka hal-hal yang unik.
  * Cuaca apapun: Tetap cool, tapi cuaca dramatis membuatnya lebih ekspresif
  * Cuaca dingin: Lebih pendiam dari biasanya
  * Cuaca badai: Menunjukkan sisi yang lebih intens
- Kita (Ikuyo Kita): Energik, optimis, vokalis. Kadang naif tapi semangat tinggi. Suka hal-hal cute.
  * Cuaca cerah: Super energik dan excited
  * Cuaca hujan: Sedikit down tapi tetap berusaha positif
  * Cuaca romantis: Menjadi lebih dreamy dan imaginatif

ATURAN RESPONS:
- Berikan narasi yang immersive dan sesuai konteks cuaca
- Perubahan stats harus logis berdasarkan interaksi DAN efek cuaca
- Action points selalu berkurang -1 per interaksi
- Maksimal perubahan stats per interaksi: ±5 poin (sudah termasuk bonus cuaca)
- Cuaca harus mempengaruhi mood dan dialog karakter
- Respons dalam format JSON yang valid
`;

        // ii. Konteks Status Pemain dengan Informasi Cuaca Detail
        const playerStatus = {
            action_points: player.action_points || 0,
            origin_story: player.origin_story || 'unknown',
            current_weather: player.current_weather || 'tidak diketahui',
            last_played_date: player.last_played_date || 'tidak diketahui',
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

        // Konteks Situasi dengan Detail Cuaca
        const situationContext = {
            cuaca: currentWeatherName,
            cuaca_deskripsi: weatherInfo ? weatherInfo.description : 'Cuaca normal',
            cuaca_mood: weatherMood,
            cuaca_efek: weatherEffects,
            lokasi: 'Shimokitazawa',
            lokasi_spesifik: 'STARRY Live House',
            waktu: 'Sore hari',
            suasana_umum: weatherInfo ? `Suasana ${weatherMood} karena cuaca ${currentWeatherName.toLowerCase()}` : 'Suasana normal'
        };

        // iii. Input Pemain dengan Konteks Situasi
        const fullPrompt = `${systemInstructions}

Status Saat Ini: ${JSON.stringify(playerStatus, null, 2)}

Konteks Situasi: ${JSON.stringify(situationContext, null, 2)}

Input Pemain: "${dialog}"

INSTRUKSI RESPONS:
Berikan respons dalam format JSON yang VALID dengan struktur berikut:
{
  "narration": "Narasi cerita yang menggambarkan apa yang terjadi setelah pemain berkata/melakukan sesuatu. Buat immersive dan sesuai kepribadian karakter yang terlibat.",
  "stat_changes": {
    "action_points": -1,
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
    "current_weather": "cuaca_baru_jika_berubah_atau_null"
  }
}

PENTING:
- Hanya ubah stats yang relevan dengan interaksi
- Jangan ubah stats yang tidak terlibat (biarkan 0)
- Perubahan maksimal ±5 per stat per interaksi
- Action points SELALU -1
- Cuaca hanya berubah jika ada alasan naratif yang kuat
- Pastikan JSON valid tanpa trailing comma atau syntax error`;

        return fullPrompt;
    },

    // Helper function untuk validasi field database
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

    // Helper function untuk update player stats dengan relative values
    async updatePlayerStats(discordId, updates) {
        const { db } = require('../database');

        return new Promise((resolve, reject) => {
            // Build dynamic SQL query untuk relative updates
            const updateClauses = [];
            const values = [];

            for (const [field, value] of Object.entries(updates)) {
                if (field === 'current_weather') {
                    // Weather adalah absolute update
                    if (value && value !== 'null' && value !== null) {
                        updateClauses.push(`${field} = ?`);
                        values.push(value);
                    }
                } else {
                    // Numeric fields adalah relative updates
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

            console.log(`[SAY] SQL Query: ${query}`);
            console.log(`[SAY] Values: ${JSON.stringify(values)}`);

            db.run(query, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },

    // Helper function untuk format perubahan stats
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

    // Helper function untuk mengekstrak target dari dialog
    extractTargetFromDialog(dialog) {
        const characters = ['Bocchi', 'Nijika', 'Ryo', 'Kita', 'Kikuri'];
        const lowerDialog = dialog.toLowerCase();

        // Cari nama karakter dalam dialog
        for (const character of characters) {
            if (lowerDialog.includes(character.toLowerCase())) {
                return character;
            }
        }

        // Jika tidak ada karakter spesifik, return null (general interaction)
        return null;
    },

    // Helper function untuk membuat teks saran
    buildSuggestionText(target) {
        if (!target) {
            return 'Gunakan `/status` untuk melihat jadwal karakter dan lokasi saat ini.';
        }

        const suggestions = getSuggestions('say', target);
        return `**Waktu terbaik untuk bicara dengan ${target}:**\n${suggestions.suggestedTimes.join('\n')}\n\n💡 ${suggestions.tips}`;
    },

    // Update buildLLMPrompt untuk menggunakan konteks waktu yang detail
    buildLLMPrompt(player, dialog, validationContext = null) {
        // Ekstrak target dari dialog
        const target = this.extractTargetFromDialog(dialog);

        // Bangun konteks situasi yang sangat detail
        const situationContext = buildDetailedSituationContext(player, 'say', target, validationContext);

        // Dapatkan informasi cuaca untuk efek gameplay
        const weatherInfo = getWeatherInfo(player.current_weather);
        const weatherEffects = getWeatherEffects(weatherInfo);

        // Bangun prompt dengan konteks yang kaya
        let prompt = `SISTEM ROLEPLAY "BOCCHI THE ROCK!":
Kamu adalah AI yang menjalankan dunia game roleplay immersive. Pemain berinteraksi melalui dialog dalam dunia yang hidup dan dinamis.

${situationContext}

INFORMASI PEMAIN:
- Origin Story: ${player.origin_story}
- Action Points: ${player.action_points}/10

EFEK CUACA PADA GAMEPLAY:
${Object.entries(weatherEffects).map(([key, value]) => `- ${key}: ${value > 0 ? '+' : ''}${value}%`).join('\n')}

DIALOG PEMAIN: "${dialog}"

INSTRUKSI NARASI:
1. Gunakan konteks waktu dan situasi untuk menciptakan narasi yang sangat immersive
2. Deskripsikan suasana, atmosphere, dan detail visual yang sesuai dengan waktu JST
3. Jika berinteraksi dengan karakter, sesuaikan dengan mood dan availability mereka
4. Integrasikan efek cuaca pada mood dan interaksi
5. Buat narasi yang terasa hidup dan realistis sesuai dengan waktu dan tempat

ATURAN STATISTIK:
- action_points: Selalu -1 (biaya interaksi)
- Karakter stats: -3 hingga +3 berdasarkan kualitas interaksi
- Gunakan efek cuaca sebagai modifier (positif/negatif)
- Availability 'limited' = bonus stats lebih kecil
- Availability 'available' = bonus stats normal/tinggi
- Sesuaikan dengan mood karakter dan suasana waktu

FORMAT RESPONS (JSON):
{
    "narration": "Narasi detail yang immersive dengan konteks waktu dan situasi...",
    "stat_changes": {
        "action_points": -1,
        "bocchi_trust": 0,
        "nijika_comfort": 0
    }
}`;

        return prompt;
    }
};
