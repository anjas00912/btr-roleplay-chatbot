const { EmbedBuilder } = require('discord.js');
const { getPlayer, updatePlayer } = require('./database');
const { generateWeather } = require('./game_logic/weather');
const { getCurrentJST, isNewDayInJST, getDisplayTimeInfo } = require('./utils/time');

// Konstanta untuk sistem game
const MAX_ACTION_POINTS = 10;

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
            
            // Update database dengan reset harian menggunakan JST
            const updates = {
                action_points: MAX_ACTION_POINTS,
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
    
    return `${randomGreeting} ${newWeather} Kamu merasa segar dan memiliki ${MAX_ACTION_POINTS} AP untuk digunakan hari ini.`;
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
            { name: '⚡ Action Points', value: `${MAX_ACTION_POINTS}/${MAX_ACTION_POINTS}`, inline: true },
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
 * Helper function untuk mengecek apakah pemain memiliki AP yang cukup
 * @param {Object} player - Player object dari database
 * @param {number} requiredAP - AP yang dibutuhkan (default: 1)
 * @returns {boolean} - True jika AP cukup
 */
function hasEnoughAP(player, requiredAP = 1) {
    return player && player.action_points && player.action_points >= requiredAP;
}

/**
 * Helper function untuk membuat embed error ketika AP tidak cukup
 * @param {number} currentAP - AP saat ini
 * @returns {EmbedBuilder} - Embed error
 */
function createInsufficientAPEmbed(currentAP = 0) {
    return new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('😴 Terlalu Lelah')
        .setDescription('Kamu terlalu lelah hari ini untuk melakukan aksi ini.')
        .addFields(
            { name: '⚡ Action Points Tersisa', value: `${currentAP}/${MAX_ACTION_POINTS}`, inline: true },
            { name: '💡 Tips', value: 'Action Points akan reset besok. Istirahat yang cukup!', inline: false }
        )
        .setFooter({ text: 'Kembali lagi besok untuk melanjutkan petualangan!' })
        .setTimestamp();
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
    hasEnoughAP,
    createInsufficientAPEmbed,
    updatePlayerAbsolute,
    getJSTTimeInfo,
    getCurrentJSTInfo,
    MAX_ACTION_POINTS
};
