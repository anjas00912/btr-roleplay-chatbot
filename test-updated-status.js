// Test file untuk memastikan command status yang sudah diperbarui berfungsi dengan baik
const { initializeDatabase, getPlayer, addPlayer, updatePlayer, closeDatabase } = require('./database');

// Mock interaction object untuk testing
function createMockInteraction(userId) {
    return {
        user: {
            id: userId,
            displayAvatarURL: () => 'https://example.com/avatar.png'
        },
        reply: async (options) => {
            console.log('📤 Reply sent:');
            if (options.embeds && options.embeds[0]) {
                const embed = options.embeds[0];
                console.log(`   Title: ${embed.data.title}`);
                console.log(`   Description: ${embed.data.description}`);
                console.log(`   Color: #${embed.data.color?.toString(16) || 'default'}`);
                console.log(`   Fields: ${embed.data.fields?.length || 0} fields`);
                if (embed.data.fields) {
                    embed.data.fields.forEach((field, index) => {
                        console.log(`     Field ${index + 1}: ${field.name} = ${field.value.substring(0, 50)}${field.value.length > 50 ? '...' : ''}`);
                    });
                }
            }
            console.log(`   Ephemeral: ${options.ephemeral || false}\n`);
        }
    };
}

async function testUpdatedStatus() {
    console.log('🧪 Memulai test command status yang sudah diperbarui...\n');
    
    try {
        // Inisialisasi database
        console.log('Inisialisasi database...');
        await initializeDatabase();
        console.log('✅ Database berhasil diinisialisasi\n');
        
        // Import command status
        const statusCommand = require('./commands/status');
        
        // Test 1: User yang belum terdaftar
        console.log('Test 1: User yang belum terdaftar');
        const mockInteraction1 = createMockInteraction('999999999999999999');
        await statusCommand.execute(mockInteraction1);
        
        // Test 2: User yang sudah terdaftar dengan berbagai cuaca
        console.log('Test 2: User yang sudah terdaftar dengan berbagai cuaca');
        const testUserId = '123456789012345678';
        
        // Hapus player lama jika ada
        const { db } = require('./database');
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM players WHERE discord_id = ?', [testUserId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Test dengan berbagai jenis cuaca
        const testWeathers = [
            'Cerah - Langit biru cerah tanpa awan',
            'Cerah Berawan - Langit biru dengan awan putih',
            'Mendung - Awan gelap menutupi langit',
            'Hujan Ringan - Gerimis halus membasahi jalanan',
            'Hujan Deras - Hujan lebat mengguyur kota',
            'Berangin - Angin kencang bertiup',
            'Dingin - Udara dingin menusuk tulang',
            'Badai - Badai petir menggelegar di langit'
        ];
        
        for (let i = 0; i < testWeathers.length; i++) {
            const weather = testWeathers[i];
            console.log(`\n   Testing weather: ${weather.split(' - ')[0]}`);
            
            // Buat atau update player dengan cuaca tertentu
            if (i === 0) {
                await addPlayer(testUserId, 'pekerja_starry', 7);
            }
            
            await updatePlayer(testUserId, {
                current_weather: weather,
                bocchi_trust: 15 + i,
                bocchi_comfort: 10 + i,
                bocchi_affection: 5 + i,
                nijika_trust: 20 + i,
                nijika_comfort: 15 + i,
                nijika_affection: 8 + i,
                ryo_trust: 12 + i,
                ryo_comfort: 8 + i,
                ryo_affection: 4 + i,
                kita_trust: 18 + i,
                kita_comfort: 12 + i,
                kita_affection: 6 + i
            });
            
            const mockInteraction = createMockInteraction(testUserId);
            await statusCommand.execute(mockInteraction);
        }
        
        // Test 3: Test helper functions
        console.log('Test 3: Test helper functions');
        
        // Test formatWeatherDisplay
        console.log('   Testing formatWeatherDisplay:');
        const testWeatherCases = [
            'Cerah - Langit biru cerah',
            'Badai - Badai petir menggelegar',
            'tidak diketahui',
            null
        ];
        
        testWeatherCases.forEach(weather => {
            const result = statusCommand.formatWeatherDisplay(weather);
            console.log(`     Weather: ${weather || 'null'}`);
            console.log(`       Emoji: ${result.emoji}`);
            console.log(`       Text: ${result.text.substring(0, 50)}${result.text.length > 50 ? '...' : ''}`);
        });
        
        // Test getMoodText
        console.log('\n   Testing getMoodText:');
        const testMoods = ['cheerful', 'romantic', 'intense', 'unknown_mood'];
        
        testMoods.forEach(mood => {
            const moodText = statusCommand.getMoodText(mood);
            console.log(`     Mood: ${mood} -> ${moodText}`);
        });
        
        // Test 4: Test dengan AP yang berbeda
        console.log('\nTest 4: Test dengan AP yang berbeda');
        
        const apValues = [0, 3, 7, 10];
        
        for (const ap of apValues) {
            console.log(`\n   Testing with ${ap} AP:`);
            
            // Set AP ke nilai tertentu
            const currentPlayer = await getPlayer(testUserId);
            const apDiff = ap - (currentPlayer.action_points || 0);
            await updatePlayer(testUserId, { action_points: apDiff });
            
            const mockInteraction = createMockInteraction(testUserId);
            await statusCommand.execute(mockInteraction);
        }
        
        // Test 5: Test dengan relationship levels yang berbeda
        console.log('\nTest 5: Test dengan relationship levels yang berbeda');
        
        // Test dengan total relationship yang tinggi
        await updatePlayer(testUserId, {
            bocchi_trust: 50,
            bocchi_comfort: 40,
            bocchi_affection: 30,
            nijika_trust: 60,
            nijika_comfort: 50,
            nijika_affection: 40,
            ryo_trust: 45,
            ryo_comfort: 35,
            ryo_affection: 25,
            kita_trust: 55,
            kita_comfort: 45,
            kita_affection: 35
        });
        
        console.log('   Testing with high relationship levels:');
        const mockInteraction5 = createMockInteraction(testUserId);
        await statusCommand.execute(mockInteraction5);
        
        // Test calculateTotalRelationship
        const finalPlayer = await getPlayer(testUserId);
        const totalRel = statusCommand.calculateTotalRelationship(finalPlayer);
        const relLevel = statusCommand.getRelationshipLevel(totalRel);
        console.log(`   Total relationship: ${totalRel}`);
        console.log(`   Relationship level: ${relLevel}`);
        
        console.log('\n🎉 Semua test command status yang diperbarui berhasil!');
        
    } catch (error) {
        console.error('❌ Error dalam test status yang diperbarui:', error);
    } finally {
        // Tutup koneksi database
        await closeDatabase();
        console.log('🔒 Koneksi database ditutup');
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testUpdatedStatus();
}

module.exports = { testUpdatedStatus };
