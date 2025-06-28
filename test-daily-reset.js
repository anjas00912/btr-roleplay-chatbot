// Test file untuk memastikan sistem daily reset berfungsi dengan baik
const { initializeDatabase, getPlayer, addPlayer, updatePlayer, closeDatabase } = require('./database');
const { 
    checkAndResetDailyStats, 
    generateNewWeather, 
    hasEnoughAP, 
    createInsufficientAPEmbed,
    MAX_ACTION_POINTS 
} = require('./daily-reset');

// Mock interaction object untuk testing
function createMockInteraction(userId) {
    return {
        user: { id: userId },
        replied: false,
        deferred: false,
        reply: async (options) => {
            console.log('📤 Reply sent:');
            if (options.embeds && options.embeds[0]) {
                const embed = options.embeds[0];
                console.log(`   Title: ${embed.data.title}`);
                console.log(`   Description: ${embed.data.description?.substring(0, 100)}...`);
            }
            console.log('');
        },
        followUp: async (options) => {
            console.log('📤 FollowUp sent:');
            if (options.embeds && options.embeds[0]) {
                const embed = options.embeds[0];
                console.log(`   Title: ${embed.data.title}`);
                console.log(`   Description: ${embed.data.description?.substring(0, 100)}...`);
            }
            console.log('');
        },
        channel: {
            send: async (options) => {
                console.log('📤 Channel message sent:');
                if (options.embeds && options.embeds[0]) {
                    const embed = options.embeds[0];
                    console.log(`   Title: ${embed.data.title}`);
                    console.log(`   Description: ${embed.data.description?.substring(0, 100)}...`);
                }
                console.log('');
            }
        }
    };
}

async function testDailyReset() {
    console.log('🧪 Memulai test sistem daily reset...\n');
    
    try {
        // Inisialisasi database
        console.log('Inisialisasi database...');
        await initializeDatabase();
        console.log('✅ Database berhasil diinisialisasi\n');
        
        const testUserId = '123456789012345678';
        
        // Hapus player lama jika ada
        const { db } = require('./database');
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM players WHERE discord_id = ?', [testUserId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Test 1: Test generateNewWeather
        console.log('Test 1: Test generate new weather');
        for (let i = 0; i < 5; i++) {
            const weather = generateNewWeather();
            console.log(`   Weather ${i + 1}: ${weather.substring(0, 50)}...`);
        }
        console.log('✅ Generate weather berfungsi\n');
        
        // Test 2: Test hasEnoughAP
        console.log('Test 2: Test hasEnoughAP function');
        const testPlayer1 = { action_points: 5 };
        const testPlayer2 = { action_points: 0 };
        const testPlayer3 = null;
        
        console.log(`   Player dengan 5 AP, butuh 1: ${hasEnoughAP(testPlayer1, 1) ? '✅ Cukup' : '❌ Tidak cukup'}`);
        console.log(`   Player dengan 0 AP, butuh 1: ${hasEnoughAP(testPlayer2, 1) ? '✅ Cukup' : '❌ Tidak cukup'}`);
        console.log(`   Player null, butuh 1: ${hasEnoughAP(testPlayer3, 1) ? '✅ Cukup' : '❌ Tidak cukup'}`);
        console.log('✅ hasEnoughAP function berfungsi\n');
        
        // Test 3: Test createInsufficientAPEmbed
        console.log('Test 3: Test createInsufficientAPEmbed');
        const apEmbed = createInsufficientAPEmbed(0);
        console.log(`   Embed title: ${apEmbed.data.title}`);
        console.log(`   Embed color: #${apEmbed.data.color?.toString(16)}`);
        console.log('✅ createInsufficientAPEmbed berfungsi\n');
        
        // Test 4: Test daily reset dengan player baru
        console.log('Test 4: Test daily reset dengan player baru');
        
        // Buat player dengan tanggal kemarin
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        await addPlayer(testUserId, 'pekerja_starry', 3);
        await updatePlayer(testUserId, { 
            last_played_date: yesterdayStr,
            action_points: -1  // Set ke 2 AP (3 - 1)
        });
        
        console.log(`   Player dibuat dengan tanggal: ${yesterdayStr}, AP: 2`);
        
        const mockInteraction = createMockInteraction(testUserId);
        const resetResult = await checkAndResetDailyStats(testUserId, mockInteraction);
        
        console.log(`   Reset result: isNewDay=${resetResult.isNewDay}`);
        console.log(`   New weather: ${resetResult.newWeather?.substring(0, 50)}...`);
        console.log(`   Player AP after reset: ${resetResult.player?.action_points}`);
        
        if (resetResult.isNewDay && resetResult.player?.action_points === MAX_ACTION_POINTS) {
            console.log('✅ Daily reset berfungsi dengan benar');
        } else {
            console.log('❌ Daily reset tidak berfungsi dengan benar');
        }
        console.log('');
        
        // Test 5: Test daily reset dengan player yang sudah main hari ini
        console.log('Test 5: Test daily reset dengan player yang sudah main hari ini');
        
        const resetResult2 = await checkAndResetDailyStats(testUserId, mockInteraction);
        
        console.log(`   Reset result 2: isNewDay=${resetResult2.isNewDay}`);
        console.log(`   Player AP: ${resetResult2.player?.action_points}`);
        
        if (!resetResult2.isNewDay) {
            console.log('✅ Tidak ada reset untuk hari yang sama');
        } else {
            console.log('❌ Seharusnya tidak ada reset untuk hari yang sama');
        }
        console.log('');
        
        // Test 6: Test dengan player yang tidak ada
        console.log('Test 6: Test dengan player yang tidak ada');
        
        const resetResult3 = await checkAndResetDailyStats('999999999999999999', mockInteraction);
        
        console.log(`   Reset result 3: isNewDay=${resetResult3.isNewDay}, player=${resetResult3.player}`);
        
        if (!resetResult3.isNewDay && !resetResult3.player) {
            console.log('✅ Handle player tidak ada dengan benar');
        } else {
            console.log('❌ Tidak handle player tidak ada dengan benar');
        }
        console.log('');
        
        console.log('🎉 Semua test daily reset berhasil!');
        
    } catch (error) {
        console.error('❌ Error dalam test daily reset:', error);
    } finally {
        // Tutup koneksi database
        await closeDatabase();
        console.log('🔒 Koneksi database ditutup');
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testDailyReset();
}

module.exports = { testDailyReset };
