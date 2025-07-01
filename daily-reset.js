const { EmbedBuilder } = require('discord.js');
const { getPlayer, updatePlayer } = require('./database');
const { generateWeather } = require('./game_logic/weather');
const { getCurrentJST, isNewDayInJST, getDisplayTimeInfo } = require('./utils/time');

// FASE 3.1: Konstanta untuk sistem energi
const MAX_ENERGY = 100;

/**
 * Fungsi untuk menghasilkan cuaca baru menggunakan sistem weather dinamis
 * @returns {string} Cuaca baru dengan deskripsi lengkap
 */
function generateNewWeather() {
    const weather = generateWeather();
    return weather.fullDescription;
}

/**
 * Fungsi utama untuk mengecek dan melakukan reset harian
 * @param {string} userId - Discord user ID
 * @param {Object} interaction - Discord interaction object untuk mengirim notifikasi
 * @returns {Object} - { isNewDay: boolean, player: Object, notification: string }
 */
async function checkAndResetDailyStats(userId, interaction = null) {
    try {
        console.log(`[DAILY_RESET] Checking daily reset for user ${userId}`);
        
        // a. Ambil data pemain dari database
        const player = await getPlayer(userId);
        
        if (!player) {
            console.log(`[DAILY_RESET] Player ${userId} not found`);
            return { isNewDay: false, player: null, notification: null };
        }
        
        // b. Dapatkan tanggal hari ini dalam JST
        const jstInfo = getCurrentJST();
        const todayJST = jstInfo.dateString; // Format YYYY-MM-DD dalam JST
        const lastPlayedDate = player.last_played_date;

        console.log(`[DAILY_RESET] Today JST: ${todayJST}, Last played: ${lastPlayedDate}`);
        console.log(`[DAILY_RESET] Current JST time: ${jstInfo.fullDateTimeString}`);

        // c. Cek apakah ini hari baru berdasarkan JST
        const isNewDay = isNewDayInJST(lastPlayedDate);
        if (isNewDay) {
            console.log(`[DAILY_RESET] New day detected! Performing daily reset...`);
            
            // Generate cuaca baru
            const newWeather = generateNewWeather();
            console.log(`[DAILY_RESET] New weather: ${newWeather}`);
            
            // FASE 3.1: Update database dengan reset harian menggunakan sistem energi
            const updates = {
                energy: MAX_ENERGY,
                current_weather: newWeather,
                last_played_date: todayJST,
                last_reset_timestamp: jstInfo.utcString // Simpan timestamp UTC untuk referensi
            };
            
            // Gunakan absolute update untuk reset harian
            await updatePlayerAbsolute(userId, updates);
            
            // Buat notifikasi untuk pemain
            const notification = createDailyResetNotification(newWeather);
            
            // Kirim notifikasi jika interaction tersedia
            if (interaction) {
                await sendDailyResetNotification(interaction, notification, newWeather);
            }
            
            // Update player object dengan nilai baru
            const updatedPlayer = { ...player, ...updates };
            
            console.log(`[DAILY_RESET] Daily reset completed for user ${userId}`);
            
            return {
                isNewDay: true,
                player: updatedPlayer,
                notification: notification,
                newWeather: newWeather
            };
        } else {
            console.log(`[DAILY_RESET] Same day, no reset needed for user ${userId}`);

            // Update last_played_date meskipun tidak reset (untuk tracking)
            if (player.last_played_date !== todayJST) {
                await updatePlayerAbsolute(userId, { last_played_date: todayJST });
                player.last_played_date = todayJST;
            }

            return {
                isNewDay: false,
                player: player,
                notification: null
            };
        }
        
    } catch (error) {
        console.error(`[DAILY_RESET] Error in checkAndResetDailyStats:`, error);
        throw error;
    }
}

/**
 * Helper function untuk update player dengan nilai absolut (bukan relatif)
 * @param {string} userId - Discord user ID
 * @param {Object} updates - Object dengan field yang akan diupdate
 */
async function updatePlayerAbsolute(userId, updates) {
    const { db } = require('./database');
    
    return new Promise((resolve, reject) => {
        const updateClauses = [];
        const values = [];
        
        for (const [field, value] of Object.entries(updates)) {
            updateClauses.push(`${field} = ?`);
            values.push(value);
        }
        
        if (updateClauses.length === 0) {
            return resolve(0);
        }
        
        const query = `UPDATE players SET ${updateClauses.join(', ')} WHERE discord_id = ?`;
        values.push(userId);
        
        console.log(`[DAILY_RESET] SQL Query: ${query}`);
        console.log(`[DAILY_RESET] Values: ${JSON.stringify(values)}`);
        
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
 * Helper function untuk membuat teks notifikasi reset harian
 * @param {string} newWeather - Cuaca baru
 * @returns {string} - Teks notifikasi
 */
function createDailyResetNotification(newWeather) {
    const greetings = [
        "Selamat pagi!",
        "Hari baru telah dimulai!",
        "Pagi yang indah di Shimokitazawa!",
        "Selamat pagi, musisi!",
        "Hari baru, semangat baru!"
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    return `${randomGreeting} ${newWeather} Kamu merasa segar dan energimu telah pulih sepenuhnya (${MAX_ENERGY}/100)!`;
}

/**
 * Helper function untuk mengirim notifikasi reset harian ke Discord
 * @param {Object} interaction - Discord interaction
 * @param {string} notification - Teks notifikasi
 * @param {string} newWeather - Cuaca baru
 */
async function sendDailyResetNotification(interaction, notification, newWeather) {
    const embed = new EmbedBuilder()
        .setColor('#4ecdc4')
        .setTitle('🌅 Hari Baru Dimulai!')
        .setDescription(notification)
        .addFields(
            { name: '🌤️ Cuaca Hari Ini', value: newWeather, inline: false },
            { name: '⚡ Energi', value: `${MAX_ENERGY}/100 💪`, inline: true },
            { name: '📅 Tanggal', value: new Date().toLocaleDateString('id-ID'), inline: true }
        )
        .setFooter({ text: 'Selamat bermain!' })
        .setTimestamp();
    
    // Kirim sebagai followUp jika interaction sudah di-reply, atau sebagai reply baru
    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('[DAILY_RESET] Error sending notification:', error);
        // Jika gagal kirim sebagai reply, coba kirim ke channel
        if (interaction.channel) {
            await interaction.channel.send({ embeds: [embed] });
        }
    }
}

/**
 * FASE 3.1: Helper function untuk mengecek energi pemain (selalu bisa beraksi)
 * @param {Object} player - Player object dari database
 * @param {number} energyCost - Energi yang akan dikonsumsi (default: 5)
 * @returns {Object} - Info energi dan zona
 */
function checkEnergyStatus(player, energyCost = 5) {
    const { getEnergyZone } = require('./database');

    if (!player || player.energy === undefined) {
        return {
            canAct: false,
            currentEnergy: 0,
            energyZone: getEnergyZone(0),
            warning: 'Data pemain tidak valid'
        };
    }

    const currentEnergy = player.energy || 0;
    const energyAfterAction = Math.max(0, currentEnergy - energyCost);
    const energyZone = getEnergyZone(currentEnergy);

    return {
        canAct: true, // Selalu bisa beraksi dalam sistem baru
        currentEnergy,
        energyAfterAction,
        energyZone,
        warning: currentEnergy <= 10 ? 'Energi sangat rendah! Aksi berisiko gagal.' : null
    };
}

/**
 * FASE 3.1: Helper function untuk membuat embed warning energi rendah
 * @param {number} currentEnergy - Energi saat ini
 * @param {Object} energyZone - Info zona energi
 * @returns {EmbedBuilder} - Embed warning
 */
function createEnergyWarningEmbed(currentEnergy, energyZone) {
    return new EmbedBuilder()
        .setColor(energyZone.color)
        .setTitle(`${energyZone.emoji} ${energyZone.name}`)
        .setDescription(`${energyZone.description}\n\nKamu masih bisa beraksi, tapi dengan konsekuensi!`)
        .addFields(
            { name: '⚡ Energi Saat Ini', value: `${currentEnergy}/100`, inline: true },
            { name: '📊 Efek Performa', value: `${Math.round(energyZone.statMultiplier * 100)}% dari normal`, inline: true },
            { name: '⚠️ Risiko Gagal', value: `${Math.round(energyZone.failureChance * 100)}%`, inline: true }
        )
        .addFields({
            name: '💡 Tips',
            value: energyZone.zone === 'critical'
                ? 'Sangat disarankan untuk istirahat! Aksi berisiko tinggi gagal dan merugikan.'
                : 'Pertimbangkan untuk istirahat agar performa optimal.',
            inline: false
        })
        .setFooter({ text: 'Sistem Energi v3.1 • Kamu selalu bisa beraksi!' })
        .setTimestamp();
}

// Backward compatibility - fungsi lama untuk transisi
function hasEnoughAP(player, requiredAP = 1) {
    // Konversi ke sistem energi baru
    const energyEquivalent = requiredAP * 5; // 1 AP = 5 Energy
    const energyStatus = checkEnergyStatus(player, energyEquivalent);
    return energyStatus.canAct;
}

function createInsufficientAPEmbed(currentAP = 0, requiredAP = 1) {
    // Konversi ke sistem energi baru
    const currentEnergy = currentAP * 10; // Rough conversion
    const { getEnergyZone } = require('./database');
    const energyZone = getEnergyZone(currentEnergy);

    return createEnergyWarningEmbed(currentEnergy, energyZone);
}

/**
 * Fungsi untuk mendapatkan informasi waktu JST untuk display
 * @returns {Object} Informasi waktu JST yang user-friendly
 */
function getJSTTimeInfo() {
    return getDisplayTimeInfo();
}

/**
 * Fungsi untuk mendapatkan waktu JST saat ini
 * @returns {Object} Informasi lengkap waktu JST
 */
function getCurrentJSTInfo() {
    return getCurrentJST();
}

module.exports = {
    checkAndResetDailyStats,
    generateNewWeather,
    updatePlayerAbsolute,
    getJSTTimeInfo,
    getCurrentJSTInfo,
    // FASE 3.1: New energy system functions
    checkEnergyStatus,
    createEnergyWarningEmbed,
    MAX_ENERGY,
    // Backward compatibility
    hasEnoughAP,
    createInsufficientAPEmbed,
    MAX_ACTION_POINTS: MAX_ENERGY // Alias untuk backward compatibility
};
