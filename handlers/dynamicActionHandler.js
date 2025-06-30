// Dynamic Action Handler - Menangani button interactions untuk sistem aksi dinamis
// Mengimplementasikan API Call #2 untuk eksekusi aksi yang dipilih

const { EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPlayer } = require('../database');
const { checkAndResetDailyStats } = require('../daily-reset');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Handle dynamic action button interactions
 * @param {Object} interaction - Discord button interaction
 * @returns {boolean} - Whether the interaction was handled
 */
async function handleDynamicActionButton(interaction) {
    const customId = interaction.customId;
    
    if (!customId.startsWith('dynamic_action_')) {
        return false;
    }
    
    console.log(`[DYNAMIC_ACTION] Button pressed: ${customId} by ${interaction.user.id}`);
    
    try {
        await interaction.deferUpdate();
        
        // Parse button data: dynamic_action_{actionId}_{playerId}
        const parts = customId.split('_');
        if (parts.length < 4) {
            throw new Error('Invalid button format');
        }
        
        const actionId = parts.slice(2, -1).join('_'); // Handle action IDs with underscores
        const playerId = parts[parts.length - 1];
        
        // Verify player ownership
        if (playerId !== interaction.user.id) {
            await interaction.followUp({
                content: '❌ Kamu tidak dapat menggunakan tombol aksi orang lain.',
                ephemeral: true
            });
            return true;
        }
        
        // Get cached action choices
        const cachedData = global.actionChoicesCache?.[playerId];
        if (!cachedData) {
            await interaction.followUp({
                content: '❌ Data aksi telah kedaluwarsa. Silakan gunakan `/act` lagi.',
                ephemeral: true
            });
            return true;
        }
        
        // Check cache expiry (5 minutes)
        const cacheAge = Date.now() - cachedData.timestamp;
        if (cacheAge > 5 * 60 * 1000) {
            delete global.actionChoicesCache[playerId];
            await interaction.followUp({
                content: '❌ Data aksi telah kedaluwarsa. Silakan gunakan `/act` lagi.',
                ephemeral: true
            });
            return true;
        }
        
        // Find the chosen action
        const chosenAction = cachedData.choices.find(action => action.id === actionId);
        if (!chosenAction) {
            await interaction.followUp({
                content: '❌ Aksi yang dipilih tidak valid.',
                ephemeral: true
            });
            return true;
        }
        
        // Get current player data
        let player = await getPlayer(playerId);
        if (!player) {
            await interaction.followUp({
                content: '❌ Data pemain tidak ditemukan.',
                ephemeral: true
            });
            return true;
        }
        
        // Check for daily reset
        const resetResult = await checkAndResetDailyStats(playerId, interaction);
        if (resetResult.player) {
            player = resetResult.player;
        }
        
        // Verify player still has enough AP
        if (player.action_points < chosenAction.ap_cost) {
            await interaction.followUp({
                content: `❌ AP tidak cukup. Kamu membutuhkan ${chosenAction.ap_cost} AP tapi hanya memiliki ${player.action_points} AP.`,
                ephemeral: true
            });
            return true;
        }
        
        // Execute the chosen action (API Call #2)
        console.log(`[DYNAMIC_ACTION] Executing action: ${chosenAction.label} (${chosenAction.ap_cost} AP)`);
        
        const narrativeResult = await executeChosenAction(player, cachedData.context, chosenAction);
        
        if (!narrativeResult) {
            await interaction.followUp({
                content: '❌ Terjadi kesalahan saat mengeksekusi aksi. Silakan coba lagi.',
                ephemeral: true
            });
            return true;
        }
        
        // Update database with stat changes
        console.log(`[DYNAMIC_ACTION] Updating database with stat_changes:`, narrativeResult.stat_changes);
        
        const updates = {};
        for (const [key, value] of Object.entries(narrativeResult.stat_changes)) {
            if (isValidDatabaseField(key)) {
                updates[key] = value;
            } else {
                console.warn(`[DYNAMIC_ACTION] Invalid field ignored: ${key}`);
            }
        }
        
        let updatedPlayer = player;
        if (Object.keys(updates).length > 0) {
            await updatePlayerStats(playerId, updates);
            console.log(`[DYNAMIC_ACTION] Database successfully updated`);

            // Get updated player data for spontaneous interaction system
            try {
                const { getPlayer } = require('../database');
                updatedPlayer = await getPlayer(playerId);
                console.log(`[DYNAMIC_ACTION] Retrieved updated player data for spontaneous interactions`);
            } catch (error) {
                console.warn(`[DYNAMIC_ACTION] Could not retrieve updated player data, using original:`, error.message);
                updatedPlayer = player;
            }
        }
        
        // Create result embed
        const embed = new EmbedBuilder()
            .setColor('#4ecdc4')
            .setTitle(`🎭 ${chosenAction.label}`)
            .setDescription(narrativeResult.narration)
            .addFields({
                name: '🎯 Aksi yang Dilakukan:',
                value: `${chosenAction.label} (${chosenAction.ap_cost} AP)`,
                inline: false
            });
        
        // Add stat changes if any
        if (Object.keys(updates).length > 0) {
            const statsText = formatStatChanges(updates);
            embed.addFields({
                name: '📊 Perubahan Status:',
                value: statsText,
                inline: false
            });
        }
        
        embed.setFooter({ 
            text: `AP tersisa: ${(player.action_points || 0) - chosenAction.ap_cost} | Gunakan /act untuk aksi selanjutnya` 
        })
        .setTimestamp();
        
        // Send result and remove buttons from original message
        await interaction.editReply({ embeds: [embed], components: [] });

        // Clean up cache
        delete global.actionChoicesCache[playerId];

        console.log(`[DYNAMIC_ACTION] Action completed successfully for player ${playerId}: ${chosenAction.label}`);

        // FASE 4.6: Cek kemungkinan interaksi spontan setelah aksi selesai
        console.log(`[SPONTANEOUS] Checking for spontaneous interactions...`);
        try {
            const { checkForSpontaneousInteraction } = require('../game_logic/interaction_trigger');
            await checkForSpontaneousInteraction(
                interaction,
                cachedData.context.location,
                cachedData.context.characters_present,
                updatedPlayer
            );
        } catch (error) {
            console.error('[SPONTANEOUS] Error checking spontaneous interaction:', error);
            // Jangan gagalkan aksi utama jika ada error di sistem spontan
        }

        return true;
        
    } catch (error) {
        console.error('[DYNAMIC_ACTION] Error handling dynamic action button:', error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Terjadi kesalahan saat memproses aksi. Silakan coba lagi.',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: '❌ Terjadi kesalahan saat memproses aksi. Silakan coba lagi.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('[DYNAMIC_ACTION] Error sending error response:', replyError);
        }
        
        return true;
    }
}

/**
 * Execute chosen action with narrative LLM (API Call #2)
 */
async function executeChosenAction(player, situationContext, chosenAction) {
    try {
        const prompt = buildNarrativePrompt(situationContext, chosenAction);
        console.log(`[DYNAMIC_ACTION] Narrative prompt built, length: ${prompt.length} characters`);
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const llmResponse = response.text();
        
        console.log(`[DYNAMIC_ACTION] Narrative response received: ${llmResponse.substring(0, 100)}...`);
        
        // Parse JSON response
        const cleanResponse = llmResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const narrativeResult = JSON.parse(cleanResponse);
        
        // Validate response structure
        if (!narrativeResult.narration || !narrativeResult.stat_changes) {
            throw new Error('Invalid narrative response structure');
        }
        
        console.log(`[DYNAMIC_ACTION] Narrative execution successful`);
        return narrativeResult;
        
    } catch (error) {
        console.error('[DYNAMIC_ACTION] Error executing chosen action:', error);
        return null;
    }
}

/**
 * Build narrative prompt for executing chosen action
 */
function buildNarrativePrompt(context, chosenAction) {
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

ATURAN STAT CHANGES KETAT:
1. ⚠️ PENTING: Poin relasi (Trust, Comfort, Affection) HANYA diberikan jika ada interaksi langsung (dialog atau tindakan bersama) dengan karakter tersebut
2. Aksi solo (latihan sendiri, menulis lagu sendiri, jalan-jalan tanpa bertemu karakter) = TIDAK ADA perubahan relasi
3. Hanya berinteraksi dengan satu karakter = HANYA stats karakter tersebut yang berubah
4. Interaksi grup = Multiple character stats bisa berubah sesuai keterlibatan masing-masing
5. Perubahan stat harus logis: -3 hingga +3 untuk interaksi signifikan, -1 hingga +1 untuk interaksi ringan
6. Action points SELALU berkurang sesuai biaya aksi: -${chosenAction.ap_cost}
7. Tidak ada "bonus relasi" untuk aksi yang tidak melibatkan karakter secara langsung

CONTOH PENERAPAN:
- "Latihan gitar sendiri" = HANYA action_points yang berubah, TIDAK ADA perubahan relasi
- "Ngobrol dengan Bocchi" = bocchi_trust/comfort/affection bisa berubah, yang lain tetap 0
- "Bermain musik bersama band" = Semua member band stats bisa berubah sesuai keterlibatan

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
}

/**
 * Helper function untuk validasi field database
 */
function isValidDatabaseField(fieldName) {
    const validFields = [
        'action_points',
        'current_weather',
        'bocchi_trust', 'bocchi_comfort', 'bocchi_affection',
        'nijika_trust', 'nijika_comfort', 'nijika_affection',
        'ryo_trust', 'ryo_comfort', 'ryo_affection',
        'kita_trust', 'kita_comfort', 'kita_affection'
    ];
    return validFields.includes(fieldName);
}

/**
 * Helper function untuk update player stats dengan relative values
 */
async function updatePlayerStats(discordId, updates) {
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

        console.log(`[DYNAMIC_ACTION] SQL Query: ${query}`);
        console.log(`[DYNAMIC_ACTION] Values: ${JSON.stringify(values)}`);

        db.run(query, values, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

/**
 * Helper function untuk format perubahan stats
 */
function formatStatChanges(updates) {
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

module.exports = {
    handleDynamicActionButton
};
