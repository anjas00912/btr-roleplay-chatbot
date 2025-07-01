const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPlayer, updatePlayer } = require('../database');
const { checkAndResetDailyStats } = require('../daily-reset');
const { getWeatherInfo, getWeatherEffects, getWeatherMood } = require('../game_logic/weather');
const { getCurrentJST } = require('../utils/time');
const { getCharactersAtLocation } = require('../game_logic/schedules');
const SituationDirector = require('../game_logic/situationDirector');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('act')
        .setDescription('Lakukan aksi di lokasi saat ini - tanpa argumen untuk menu, dengan argumen untuk aksi bebas')
        .addStringOption(option =>
            option.setName('deskripsi_aksi')
                .setDescription('(Opsional) Jelaskan aksi kustom yang ingin kamu lakukan')
                .setRequired(false)
        ),

    async execute(interaction) {
        const discordId = interaction.user.id;
        const customAction = interaction.options.getString('deskripsi_aksi');

        try {
            // FASE 4.9: Logika percabangan untuk sistem aksi ganda
            if (customAction) {
                // Jika pemain memberikan deskripsi, jalankan alur Aksi Bebas
                return await this.executeCustomAction(interaction, customAction);
            } else {
                // Jika tidak ada deskripsi, jalankan alur Aksi Terstruktur yang sudah ada
                return await this.executeStructuredAction(interaction);
            }
        } catch (error) {
            console.error('[ACT] Error executing action command:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Error Aksi')
                .setDescription('Terjadi kesalahan saat memproses aksi. Silakan coba lagi.')
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed] });
            }
        }
    },

    /**
     * FASE 4.9: Alur Aksi Terstruktur (logika yang sudah ada)
     */
    async executeStructuredAction(interaction) {
        const discordId = interaction.user.id;

        try {
            // Defer reply untuk operasi yang mungkin lama
            await interaction.deferReply();

            // Step 1: Validasi Pemain dan Reset Harian
            console.log(`[ACT] Validating player ${discordId} for dynamic actions`);
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

                return await interaction.editReply({ embeds: [embed] });
            }

            // Cek dan lakukan reset harian jika diperlukan
            console.log(`[ACT] Checking daily reset...`);
            const resetResult = await checkAndResetDailyStats(discordId, interaction);

            // Update player object dengan data terbaru setelah reset
            if (resetResult.player) {
                player = resetResult.player;
            }

            // Validasi minimum AP (setidaknya 1 AP untuk melihat pilihan)
            if (!player.action_points || player.action_points < 1) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('😴 Tidak Ada Action Points')
                    .setDescription('Kamu membutuhkan setidaknya 1 AP untuk melihat pilihan aksi yang tersedia.')
                    .addFields(
                        { name: '⚡ AP Tersedia', value: (player.action_points || 0).toString(), inline: true },
                        { name: '💡 Tips', value: 'Tunggu reset harian untuk mendapatkan AP baru.', inline: false }
                    )
                    .setTimestamp();

                // Karena sudah deferReply di awal, selalu gunakan editReply
                return await interaction.editReply({ embeds: [embed] });
            }

            console.log(`[ACT] Player validated. AP: ${player.action_points}`);

            // Step 2: Kumpulkan Konteks Situasi
            const situationContext = await this.buildSituationContext(player);
            console.log(`[ACT] Situation context built for location: ${situationContext.location}`);

            // Step 3: Panggil LLM untuk Generate Action Choices (API Call #1)
            console.log(`[ACT] Calling Situation Director LLM...`);

            // Defer reply karena LLM call bisa memakan waktu
            if (!resetResult.isNewDay) {
                await interaction.deferReply();
            }

            const actionChoices = await this.generateActionChoices(player, situationContext);

            if (!actionChoices || actionChoices.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('🤖 Error Generating Actions')
                    .setDescription('Maaf, tidak dapat menghasilkan pilihan aksi saat ini. Silakan coba lagi.')
                    .setTimestamp();

                if (resetResult.isNewDay) {
                    return await interaction.followUp({ embeds: [embed], ephemeral: true });
                } else {
                    return await interaction.editReply({ embeds: [embed] });
                }
            }

            // Step 4: Tampilkan Pilihan Aksi dengan Buttons
            await this.displayActionChoices(interaction, player, situationContext, actionChoices, resetResult.isNewDay);

            console.log(`[ACT] Dynamic action choices displayed successfully`);

        } catch (error) {
            console.error('[ACT] Error in execute:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Error')
                .setDescription('Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.')
                .setTimestamp();

            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (replyError) {
                console.error('[ACT] Error sending error response:', replyError);
            }
        }
    },
    /**
     * Build comprehensive situation context for LLM
     */
    async buildSituationContext(player) {
        const currentTime = getCurrentJST();
        const weatherInfo = getWeatherInfo(player.current_weather);

        // Determine current location based on origin story and time
        const currentLocation = this.determineCurrentLocation(player, currentTime);

        // Get characters at current location
        const charactersAtLocation = getCharactersAtLocation(currentLocation, currentTime);

        return {
            player_id: player.discord_id,
            location: currentLocation,
            time: {
                day: currentTime.dayName,
                time_string: currentTime.timeString,
                period: currentTime.period,
                hour: currentTime.hour
            },
            weather: {
                name: player.current_weather,
                mood: getWeatherMood(weatherInfo),
                effects: getWeatherEffects(weatherInfo)
            },
            characters_present: charactersAtLocation,
            player_stats: {
                action_points: player.action_points,
                bocchi_trust: player.bocchi_trust || 0,
                bocchi_comfort: player.bocchi_comfort || 0,
                bocchi_affection: player.bocchi_affection || 0,
                nijika_trust: player.nijika_trust || 0,
                nijika_comfort: player.nijika_comfort || 0,
                nijika_affection: player.nijika_affection || 0,
                ryo_trust: player.ryo_trust || 0,
                ryo_comfort: player.ryo_comfort || 0,
                ryo_affection: player.ryo_affection || 0,
                kita_trust: player.kita_trust || 0,
                kita_comfort: player.kita_comfort || 0,
                kita_affection: player.kita_affection || 0
            },
            origin_story: player.origin_story
        };
    },

    /**
     * Determine current location based on player data and time
     */
    determineCurrentLocation(player, currentTime) {
        // Simple logic - can be enhanced later
        const hour = currentTime.hour;

        if (player.origin_story === 'pekerja_starry') {
            if (hour >= 16 && hour <= 22) {
                return 'STARRY';
            }
        } else if (player.origin_story === 'siswa_pindahan') {
            if (hour >= 8 && hour <= 15) {
                return 'School';
            }
        }

        // Default location
        return 'Shimokitazawa_Street';
    },

    /**
     * FASE 4.9: Alur Aksi Bebas (aksi kustom pemain)
     */
    async executeCustomAction(interaction, customAction) {
        const discordId = interaction.user.id;

        try {
            // Defer reply untuk operasi yang mungkin lama
            await interaction.deferReply();

            console.log(`[ACT] Processing custom action: "${customAction}" for ${discordId}`);

            // 1. Validasi Pemain dan Reset Harian
            let player = await getPlayer(discordId);

            if (!player) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Belum Memulai Hidup')
                    .setDescription('Kamu belum memulai hidup dalam dunia Bocchi the Rock!')
                    .addFields({
                        name: '🚀 Cara Memulai',
                        value: 'Gunakan command `/start` untuk memulai petualangan Anda!',
                        inline: false
                    })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Cek dan lakukan reset harian jika diperlukan
            const resetResult = await checkAndResetDailyStats(discordId);
            if (resetResult.player) {
                player = resetResult.player;
            }

            // 2. FASE 3.1: Validasi energi minimum (aksi bebas membutuhkan setidaknya 5 energi)
            const currentEnergy = player.energy || 100;
            if (currentEnergy < 5) {
                // FASE 3.1: Update untuk sistem energi
                const { getEnergyZone } = require('../database');
                const currentEnergy = player.energy || 100;
                const energyZone = getEnergyZone(currentEnergy);

                const embed = new EmbedBuilder()
                    .setColor(energyZone.color)
                    .setTitle(`${energyZone.emoji} Energi Rendah`)
                    .setDescription('Energimu sangat rendah untuk aksi bebas. Aksi bebas membutuhkan setidaknya 5 energi.')
                    .addFields(
                        { name: '⚡ Energi Saat Ini', value: `${currentEnergy}/100`, inline: true },
                        { name: '🎯 Zona Energi', value: energyZone.name, inline: true },
                        { name: '💡 Saran', value: 'Gunakan aksi pemulihan energi atau tunggu reset harian.', inline: false }
                    )
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // 3. Build konteks situasi
            const situationContext = await this.buildSituationContext(player);

            // 4. Panggil LLM dengan Prompt Penilaian Aksi Bebas
            const customActionResult = await this.evaluateCustomAction(player, situationContext, customAction);

            // 5. Apply stat changes ke database
            if (customActionResult.stat_changes && Object.keys(customActionResult.stat_changes).length > 0) {
                await updatePlayer(discordId, customActionResult.stat_changes);
                console.log(`[ACT] Custom action stat changes applied:`, customActionResult.stat_changes);
            }

            // 6. Kirim hasil narasi
            await this.sendCustomActionResult(interaction, customActionResult, customAction);

            console.log(`[ACT] Custom action "${customAction}" completed for ${discordId}`);

        } catch (error) {
            console.error('[ACT] Error executing custom action:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Error Aksi Bebas')
                .setDescription('Terjadi kesalahan saat memproses aksi bebas. Silakan coba lagi.')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    /**
     * FASE 4.9: Evaluasi aksi kustom dengan LLM Game Master
     */
    async evaluateCustomAction(player, situationContext, customAction) {
        try {
            const prompt = this.buildCustomActionPrompt(player, situationContext, customAction);
            console.log(`[ACT] Custom action evaluation prompt built, length: ${prompt.length} characters`);

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const llmResponse = response.text();

            console.log(`[ACT] Custom action evaluation response received: ${llmResponse.substring(0, 100)}...`);

            // Parse respons JSON
            const cleanResponse = llmResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsedResponse = JSON.parse(cleanResponse);

            // Validasi struktur respons
            if (!parsedResponse.narration || !parsedResponse.stat_changes) {
                throw new Error('Invalid LLM response structure for custom action');
            }

            return parsedResponse;

        } catch (error) {
            console.error('[ACT] Error evaluating custom action:', error);

            // Fallback response untuk aksi bebas
            return {
                narration: `Kamu mencoba untuk ${customAction}. Meskipun niatmu baik, situasinya tidak memungkinkan untuk melakukan hal tersebut saat ini. Mungkin kamu bisa mencoba pendekatan yang berbeda atau menunggu momen yang lebih tepat.`,
                stat_changes: {
                    action_points: -1
                }
            };
        }
    },

    /**
     * FASE 4.9: Build prompt untuk evaluasi aksi kustom
     */
    buildCustomActionPrompt(player, situationContext, customAction) {
        const currentTime = getCurrentJST();
        const weatherInfo = getWeatherInfo(player.current_weather || 'Cerah');

        return `Anda adalah seorang Game Master yang sangat teliti dan realistis. Pemain ingin mencoba melakukan sebuah aksi kustom. Tugas Anda adalah menilai kelayakan aksi ini, menentukan hasilnya, dan menarasikannya secara realistis berdasarkan konteks yang ada.

KONTEKS SITUASI:
- Pemain: ${player.origin_story} dengan ${player.action_points} AP
- Lokasi: ${situationContext.location}
- Waktu JST: ${currentTime.dayName}, ${currentTime.timeString}
- Cuaca: ${weatherInfo.condition} (${weatherInfo.mood})

KARAKTER DI LOKASI:
${situationContext.characters_present.map(char =>
    `- ${char.name}: ${char.activity} (${char.availability})`
).join('\n')}

STATUS HUBUNGAN PEMAIN:
- Bocchi: Trust ${player.bocchi_trust || 0}, Comfort ${player.bocchi_comfort || 0}, Affection ${player.bocchi_affection || 0}
- Nijika: Trust ${player.nijika_trust || 0}, Comfort ${player.nijika_comfort || 0}, Affection ${player.nijika_affection || 0}
- Ryo: Trust ${player.ryo_trust || 0}, Comfort ${player.ryo_comfort || 0}, Affection ${player.ryo_affection || 0}
- Kita: Trust ${player.kita_trust || 0}, Comfort ${player.kita_comfort || 0}, Affection ${player.kita_affection || 0}

AKSI KUSTOM YANG DICOBA PEMAIN: "${customAction}"

TUGAS EVALUASI:
1. Kelayakan (Feasibility): Apakah aksi ini mungkin dilakukan secara fisik dan logis dalam konteks saat ini?
2. Kesesuaian Sosial (Social Appropriateness): Berdasarkan kepribadian karakter target dan level relationship saat ini, bagaimana kemungkinan reaksinya?
3. Risiko vs Reward: Aksi berani/intim memiliki potensi reward tinggi tapi risiko gagal juga tinggi

TUGAS NARASI:
1. Narasikan Upaya Pemain: Jelaskan bagaimana pemain mencoba melakukan aksi tersebut
2. Narasikan Hasil & Reaksi Karakter: Deskripsikan hasil dari aksi tersebut. Apakah berhasil? Bagaimana reaksi karakter? Hasil HARUS bergantung pada stat relasi dan kepribadian karakter
3. Tentukan Perubahan Stat: Keluarkan perubahan stat yang logis. Aksi yang berhasil meningkatkan stat, aksi yang gagal menurunkannya

PANDUAN STAT CHANGES:
- Action Points: Selalu -1 hingga -3 tergantung kompleksitas aksi
- Aksi berhasil: +1 hingga +5 untuk stat yang relevan
- Aksi gagal: -1 hingga -3 untuk stat yang relevan
- Aksi sangat berani yang berhasil: hingga +7 untuk stat yang relevan
- Aksi sangat berani yang gagal: hingga -5 untuk stat yang relevan

KEPRIBADIAN KARAKTER:
- Bocchi: Sangat pemalu, mudah panik, tapi menghargai kebaikan genuine
- Nijika: Friendly, supportive, mudah menerima gesture positif
- Ryo: Cool, mysterious, butuh effort lebih untuk impress
- Kita: Outgoing, confident, appreciate bold moves

FORMAT RESPONS JSON:
{
    "narration": "Narasi detail tentang upaya pemain dan hasil/reaksi karakter (minimal 100 kata)",
    "stat_changes": {
        "action_points": -1,
        "character_trust": 0,
        "character_comfort": 0,
        "character_affection": 0
    }
}`;
    },

    /**
     * FASE 4.9: Kirim hasil aksi kustom ke pemain
     */
    async sendCustomActionResult(interaction, result, customAction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🎭 Aksi Bebas')
            .setDescription(`**Aksi:** ${customAction}\n\n${result.narration}`)
            .setFooter({ text: 'Aksi Bebas • Risiko tinggi, reward tinggi!' })
            .setTimestamp();

        // Tambahkan field stat changes jika ada
        if (result.stat_changes && Object.keys(result.stat_changes).length > 0) {
            const statChanges = Object.entries(result.stat_changes)
                .filter(([key, value]) => value !== 0)
                .map(([key, value]) => {
                    const sign = value > 0 ? '+' : '';
                    return `${key.replace(/_/g, ' ')}: ${sign}${value}`;
                })
                .join(' | ');

            if (statChanges) {
                embed.addFields({
                    name: '📊 Perubahan Status',
                    value: statChanges,
                    inline: false
                });
            }
        }

        embed.addFields({
            name: '💡 Tips',
            value: 'Gunakan `/act` tanpa argumen untuk melihat aksi terstruktur yang lebih aman, atau terus bereksperimen dengan aksi bebas!',
            inline: false
        });

        await interaction.editReply({ embeds: [embed] });
    },

    /**
     * Generate action choices using Situation Director LLM (API Call #1)
     */
    async generateActionChoices(player, situationContext) {
        try {
            const prompt = this.buildSituationDirectorPrompt(situationContext);
            console.log(`[ACT] Situation Director prompt built, length: ${prompt.length} characters`);

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const llmResponse = response.text();

            console.log(`[ACT] Situation Director response received: ${llmResponse.substring(0, 100)}...`);

            // Parse JSON response
            const cleanResponse = llmResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const actionChoices = JSON.parse(cleanResponse);

            // Validate response structure
            if (!Array.isArray(actionChoices) || actionChoices.length === 0) {
                throw new Error('Invalid action choices format');
            }

            // Validate each action choice
            for (const action of actionChoices) {
                if (!action.id || !action.label || !action.ap_cost) {
                    throw new Error('Invalid action choice structure');
                }
            }

            console.log(`[ACT] Generated ${actionChoices.length} action choices successfully`);
            return actionChoices;

        } catch (error) {
            console.error('[ACT] Error generating action choices:', error);
            return null;
        }
    },

    /**
     * Build advanced Situation Director prompt using the sophisticated system
     */
    buildSituationDirectorPrompt(context) {
        return SituationDirector.buildAdvancedPrompt(context);
    },
    /**
     * Display action choices with dynamic buttons
     */
    async displayActionChoices(interaction, player, situationContext, actionChoices, isFollowUp = false) {
        // FASE 3.1: Get energy zone info
        const { getEnergyZone } = require('../database');
        const currentEnergy = situationContext.player_stats.energy || 100;
        const energyZone = getEnergyZone(currentEnergy);

        // Create embed with situation context (Fase 4.8: Fokus pada aksi lokal)
        const embed = new EmbedBuilder()
            .setColor(energyZone.color)
            .setTitle(`🎭 Pilihan Aksi Tersedia ${energyZone.emoji}`)
            .setDescription(`**${situationContext.time.day}, ${situationContext.time.time_string} JST**\n\nKamu berada di **${situationContext.location}**. Cuaca ${situationContext.weather.name} menciptakan suasana ${situationContext.weather.mood}.\n\n${energyZone.zone === 'critical' ? '⚠️ **Energi sangat rendah! Aksi berisiko gagal.**' : energyZone.zone === 'tired' ? '😴 **Sedikit lelah, performa menurun.**' : '💪 **Energi optimal, performa terbaik!**'}\n\nPilih aksi yang ingin kamu lakukan di lokasi ini:`)
            .addFields(
                { name: '📍 Lokasi', value: situationContext.location, inline: true },
                { name: '⚡ Energi', value: `${situationContext.player_stats.energy || 100}/100`, inline: true },
                { name: '🌤️ Cuaca', value: situationContext.weather.name, inline: true }
            );

        // Add characters present if any
        if (situationContext.characters_present.length > 0) {
            const charactersText = situationContext.characters_present
                .map(char => `• ${char.name} (${char.availability})`)
                .join('\n');
            embed.addFields({ name: '👥 Karakter di Sekitar', value: charactersText, inline: false });
        }

        // Create action buttons (max 5 buttons per row, max 25 total)
        const actionRows = [];
        const maxButtons = Math.min(actionChoices.length, 25);

        for (let i = 0; i < maxButtons; i += 5) {
            const row = new ActionRowBuilder();
            const buttonsInRow = Math.min(5, maxButtons - i);

            for (let j = 0; j < buttonsInRow; j++) {
                const actionIndex = i + j;
                const action = actionChoices[actionIndex];

                // Check if player has enough AP
                const hasEnoughAP = situationContext.player_stats.action_points >= action.ap_cost;

                const button = new ButtonBuilder()
                    .setCustomId(`dynamic_action_${action.id}_${player.discord_id}`)
                    .setLabel(`${action.label} (${action.ap_cost} AP)`)
                    .setStyle(hasEnoughAP ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(!hasEnoughAP);

                row.addComponents(button);
            }

            actionRows.push(row);
        }

        embed.setFooter({ text: 'Pilih aksi dengan menekan tombol. Gunakan /go untuk berpindah lokasi.' })
            .setTimestamp();

        // Send the message with buttons
        if (isFollowUp) {
            await interaction.followUp({ embeds: [embed], components: actionRows });
        } else {
            await interaction.editReply({ embeds: [embed], components: actionRows });
        }

        // Store action choices in a temporary cache for button handling
        // This is a simple approach - in production, consider using a proper cache/database
        global.actionChoicesCache = global.actionChoicesCache || {};
        global.actionChoicesCache[player.discord_id] = {
            choices: actionChoices,
            context: situationContext,
            timestamp: Date.now()
        };
    },

    /**
     * FASE 3.1: Check if action is energy recovery type
     */
    isEnergyRecoveryAction(actionText) {
        const recoveryKeywords = [
            'istirahat', 'tidur', 'beristirahat', 'rileks', 'relaksasi',
            'minum', 'kopi', 'teh', 'makan', 'snack', 'makanan',
            'duduk', 'berbaring', 'santai', 'tenang', 'meditasi',
            'napas', 'bernafas', 'healing', 'recovery', 'pulih'
        ];

        const lowerAction = actionText.toLowerCase();
        return recoveryKeywords.some(keyword => lowerAction.includes(keyword));
    },

    /**
     * FASE 3.1: Execute energy recovery action with special handling
     */
    async executeEnergyRecoveryAction(player, situationContext, chosenAction) {
        const recoveryAmount = this.calculateEnergyRecovery(chosenAction, situationContext.location);
        const currentEnergy = player.energy || 100;
        const newEnergy = Math.min(100, currentEnergy + recoveryAmount);

        const recoveryNarration = this.generateEnergyRecoveryNarration(
            chosenAction,
            situationContext,
            recoveryAmount,
            currentEnergy,
            newEnergy
        );

        return {
            narration: recoveryNarration,
            stat_changes: {
                energy: recoveryAmount
            }
        };
    },

    /**
     * FASE 3.1: Calculate energy recovery amount based on action and location
     */
    calculateEnergyRecovery(actionText, location) {
        let baseRecovery = 10; // Default recovery

        // Action-based recovery
        if (actionText.toLowerCase().includes('tidur')) {
            baseRecovery = 40;
        } else if (actionText.toLowerCase().includes('istirahat')) {
            baseRecovery = 25;
        } else if (actionText.toLowerCase().includes('minum') || actionText.toLowerCase().includes('kopi')) {
            baseRecovery = 15;
        } else if (actionText.toLowerCase().includes('makan')) {
            baseRecovery = 20;
        } else if (actionText.toLowerCase().includes('santai') || actionText.toLowerCase().includes('rileks')) {
            baseRecovery = 15;
        }

        // Location-based modifier
        if (location.includes('Rumah') || location.includes('Home')) {
            baseRecovery += 5; // Bonus for being at home
        } else if (location.includes('Taman') || location.includes('Park')) {
            baseRecovery += 3; // Bonus for peaceful location
        }

        return baseRecovery;
    },

    /**
     * FASE 3.1: Generate narration for energy recovery actions
     */
    generateEnergyRecoveryNarration(actionText, situationContext, recoveryAmount, oldEnergy, newEnergy) {
        const { getEnergyZone } = require('../database');
        const oldZone = getEnergyZone(oldEnergy);
        const newZone = getEnergyZone(newEnergy);

        let narration = `Kamu memutuskan untuk ${actionText.toLowerCase()}. `;

        // Context-based narration
        if (actionText.toLowerCase().includes('tidur')) {
            narration += `Kamu mencari tempat yang nyaman dan berbaring. Mata mulai terasa berat, dan dalam beberapa menit kamu sudah tertidur pulas. `;
        } else if (actionText.toLowerCase().includes('minum')) {
            narration += `Kamu menyesap minuman dengan perlahan, merasakan kehangatan yang menyebar di tubuhmu. `;
        } else if (actionText.toLowerCase().includes('makan')) {
            narration += `Kamu menikmati makanan dengan tenang, merasakan energi kembali mengalir ke tubuhmu. `;
        } else {
            narration += `Kamu meluangkan waktu untuk beristirahat dan memulihkan tenaga. `;
        }

        // Energy zone transition
        if (oldZone.zone !== newZone.zone) {
            if (oldZone.zone === 'critical' && newZone.zone === 'tired') {
                narration += `Kamu merasa jauh lebih baik sekarang. Meski masih sedikit lelah, setidaknya kamu tidak lagi merasa akan pingsan. `;
            } else if (oldZone.zone === 'tired' && newZone.zone === 'optimal') {
                narration += `Energimu kembali penuh! Kamu merasa segar dan siap untuk menghadapi tantangan apa pun. `;
            } else {
                narration += `Kamu merasa lebih berenergi dari sebelumnya. `;
            }
        } else {
            narration += `Kamu merasa sedikit lebih segar. `;
        }

        narration += `Energi: ${oldEnergy}/100 → ${newEnergy}/100 (+${recoveryAmount})`;

        return narration;
    },

    /**
     * FASE 3.1: Apply energy zone effects to stat changes
     */
    applyEnergyEffects(statChanges, energyZone) {
        const modifiedStats = { ...statChanges };

        // Apply energy multiplier to relationship stats (not energy itself)
        Object.keys(modifiedStats).forEach(key => {
            if (key !== 'energy' && key !== 'action_points') {
                if (typeof modifiedStats[key] === 'number') {
                    modifiedStats[key] = Math.round(modifiedStats[key] * energyZone.statMultiplier);
                }
            }
        });

        // Handle critical energy failure chance
        if (energyZone.zone === 'critical' && Math.random() < energyZone.failureChance) {
            // Action failed due to low energy
            Object.keys(modifiedStats).forEach(key => {
                if (key !== 'energy' && key !== 'action_points') {
                    if (typeof modifiedStats[key] === 'number' && modifiedStats[key] > 0) {
                        modifiedStats[key] = -Math.abs(modifiedStats[key]); // Convert positive to negative
                    }
                }
            });
            modifiedStats._energyFailure = true; // Flag for narrative
        }

        return modifiedStats;
    },
    /**
     * Execute chosen action with narrative LLM (API Call #2)
     */
    async executeChosenAction(player, situationContext, chosenAction) {
        try {
            // FASE 3.1: Check if this is an energy recovery action
            const isEnergyRecovery = this.isEnergyRecoveryAction(chosenAction);

            if (isEnergyRecovery) {
                return await this.executeEnergyRecoveryAction(player, situationContext, chosenAction);
            }

            const prompt = this.buildNarrativePrompt(situationContext, chosenAction);
            console.log(`[ACT] Narrative prompt built, length: ${prompt.length} characters`);

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const llmResponse = response.text();

            console.log(`[ACT] Narrative response received: ${llmResponse.substring(0, 100)}...`);

            // Parse JSON response
            const cleanResponse = llmResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const narrativeResult = JSON.parse(cleanResponse);

            // Validate response structure
            if (!narrativeResult.narration || !narrativeResult.stat_changes) {
                throw new Error('Invalid narrative response structure');
            }

            // FASE 3.1: Apply energy zone effects to stat changes
            const { getEnergyZone } = require('../database');
            const energyZone = getEnergyZone(player.energy || 100);
            narrativeResult.stat_changes = this.applyEnergyEffects(narrativeResult.stat_changes, energyZone);

            console.log(`[ACT] Narrative execution successful`);
            return narrativeResult;

        } catch (error) {
            console.error('[ACT] Error executing chosen action:', error);
            return null;
        }
    },

    /**
     * Build narrative prompt for executing chosen action
     */
    buildNarrativePrompt(context, chosenAction) {
        return `Anda adalah seorang Game Master untuk game "Bocchi the Rock!". Pemain telah memilih untuk melakukan aksi berikut. Lanjutkan ceritanya.

KONTEKS SITUASI:
- Lokasi: ${context.location}
- Waktu: ${context.time.day}, ${context.time.time_string} JST (${context.time.period})
- Cuaca: ${context.weather.name} (${context.weather.mood})
- Origin Story: ${context.origin_story}

KARAKTER YANG HADIR:
${context.characters_present.length > 0 ? context.characters_present.map(char => `- ${char.name} (${char.availability})`).join('\n') : '- Tidak ada karakter khusus di lokasi ini'}

RELATIONSHIP STATUS:
- Bocchi: Trust ${context.player_stats.bocchi_trust}, Comfort ${context.player_stats.bocchi_comfort}, Affection ${context.player_stats.bocchi_affection}
- Nijika: Trust ${context.player_stats.nijika_trust}, Comfort ${context.player_stats.nijika_comfort}, Affection ${context.player_stats.nijika_affection}
- Ryo: Trust ${context.player_stats.ryo_trust}, Comfort ${context.player_stats.ryo_comfort}, Affection ${context.player_stats.ryo_affection}
- Kita: Trust ${context.player_stats.kita_trust}, Comfort ${context.player_stats.kita_comfort}, Affection ${context.player_stats.kita_affection}

AKSI YANG DIPILIH:
- ID: ${chosenAction.id}
- Nama: ${chosenAction.label}
- Biaya AP: ${chosenAction.ap_cost}

ATURAN STAT CHANGES:
1. Poin relasi (Trust, Comfort, Affection) HANYA diberikan jika ada interaksi langsung (dialog atau tindakan bersama) dengan karakter tersebut
2. Aksi solo hanya memengaruhi stat pribadi pemain (tidak ada perubahan relasi kecuali ada interaksi)
3. Perubahan stat harus logis: -3 hingga +3 untuk interaksi signifikan, -1 hingga +1 untuk interaksi ringan
4. Action points SELALU berkurang sesuai biaya aksi: -${chosenAction.ap_cost}

Tugas Anda: Narasikan apa yang terjadi, deskripsikan reaksi NPC (jika ada interaksi), tentukan perubahan stat yang logis, dan keluarkan hasilnya dalam format JSON standar.

FORMAT OUTPUT:
{
  "narration": "Narasi detail tentang apa yang terjadi saat pemain melakukan aksi ini. Minimal 100 kata, fokus pada pengalaman pemain dan reaksi lingkungan/karakter.",
  "stat_changes": {
    "action_points": -${chosenAction.ap_cost},
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
    "kita_affection": 0
  }
}`;
    },

    /**
     * Helper function untuk validasi field database
     */
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

    /**
     * Helper function untuk update player stats dengan relative values
     */
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

    /**
     * Helper function untuk format perubahan stats
     */
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
    }
};
