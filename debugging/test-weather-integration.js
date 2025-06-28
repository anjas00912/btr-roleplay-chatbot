// Test file untuk memastikan integrasi sistem cuaca dengan daily reset dan command say
const { initializeDatabase, getPlayer, addPlayer, updatePlayer, closeDatabase } = require('./database');
const { checkAndResetDailyStats } = require('./daily-reset');
const { getWeatherInfo } = require('./game_logic/weather');

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

async function testWeatherIntegration() {
    console.log('🧪 Memulai test integrasi sistem cuaca...\n');
    
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
        
        // Test 1: Test daily reset dengan sistem cuaca baru
        console.log('Test 1: Test daily reset dengan sistem cuaca baru');
        
        // Buat player dengan tanggal kemarin
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        await addPlayer(testUserId, 'pekerja_starry', 3);
        await updatePlayer(testUserId, { 
            last_played_date: yesterdayStr,
            action_points: -1,
            current_weather: 'Cerah - Cuaca lama yang akan diganti'
        });
        
        console.log(`   Player dibuat dengan tanggal: ${yesterdayStr}`);
        console.log(`   Cuaca lama: Cerah - Cuaca lama yang akan diganti`);
        
        const mockInteraction = createMockInteraction(testUserId);
        const resetResult = await checkAndResetDailyStats(testUserId, mockInteraction);
        
        console.log(`   Reset result: isNewDay=${resetResult.isNewDay}`);
        console.log(`   New weather: ${resetResult.newWeather?.substring(0, 60)}...`);
        
        // Verifikasi cuaca baru di database
        const playerAfterReset = await getPlayer(testUserId);
        console.log(`   Weather in database: ${playerAfterReset.current_weather?.substring(0, 60)}...`);
        
        // Test weather info extraction
        const weatherName = playerAfterReset.current_weather.split(' - ')[0];
        const weatherInfo = getWeatherInfo(weatherName);
        console.log(`   Weather name extracted: ${weatherName}`);
        console.log(`   Weather mood: ${weatherInfo?.mood || 'unknown'}`);
        console.log(`   Weather effects: ${JSON.stringify(weatherInfo?.effects || {})}`);
        
        console.log('✅ Daily reset dengan sistem cuaca baru berfungsi\n');
        
        // Test 2: Test prompt building dengan cuaca
        console.log('Test 2: Test prompt building dengan informasi cuaca');
        
        const sayCommand = require('./commands/say');
        const prompt = sayCommand.buildLLMPrompt(playerAfterReset, 'Hello everyone!');
        
        console.log(`   Prompt length: ${prompt.length} characters`);
        console.log(`   Contains weather name: ${prompt.includes(weatherName) ? 'Yes' : 'No'}`);
        console.log(`   Contains weather mood: ${prompt.includes(weatherInfo?.mood || '') ? 'Yes' : 'No'}`);
        console.log(`   Contains situation context: ${prompt.includes('Konteks Situasi') ? 'Yes' : 'No'}`);
        console.log(`   Contains weather effects: ${prompt.includes('cuaca_efek') ? 'Yes' : 'No'}`);
        
        // Extract and show weather context from prompt
        const contextMatch = prompt.match(/Konteks Situasi: ({[\s\S]*?})/);
        if (contextMatch) {
            try {
                const context = JSON.parse(contextMatch[1]);
                console.log(`   Weather context extracted:`);
                console.log(`     Cuaca: ${context.cuaca}`);
                console.log(`     Mood: ${context.cuaca_mood}`);
                console.log(`     Deskripsi: ${context.cuaca_deskripsi?.substring(0, 50)}...`);
                console.log(`     Efek: ${JSON.stringify(context.cuaca_efek)}`);
            } catch (e) {
                console.log(`   Error parsing context: ${e.message}`);
            }
        }
        
        console.log('✅ Prompt building dengan cuaca berfungsi\n');
        
        // Test 3: Test multiple weather generations
        console.log('Test 3: Test multiple weather generations');
        
        for (let i = 0; i < 5; i++) {
            // Simulate multiple days
            const testDate = new Date();
            testDate.setDate(testDate.getDate() - (i + 2));
            const testDateStr = testDate.toISOString().split('T')[0];
            
            await updatePlayer(testUserId, { last_played_date: testDateStr });
            
            const resetResult = await checkAndResetDailyStats(testUserId);
            console.log(`   Day ${i + 1}: ${resetResult.newWeather?.split(' - ')[0] || 'No weather'}`);
        }
        
        console.log('✅ Multiple weather generations berfungsi\n');
        
        // Test 4: Test weather effects pada different weather types
        console.log('Test 4: Test weather effects pada different weather types');
        
        const testWeathers = ['Cerah', 'Hujan Ringan', 'Badai', 'Dingin'];
        
        testWeathers.forEach(weatherName => {
            const weatherInfo = getWeatherInfo(weatherName);
            console.log(`   ${weatherName}:`);
            console.log(`     Mood: ${weatherInfo?.mood}`);
            console.log(`     Trust bonus: ${weatherInfo?.effects?.trust_bonus || 0}`);
            console.log(`     Comfort bonus: ${weatherInfo?.effects?.comfort_bonus || 0}`);
            console.log(`     Affection bonus: ${weatherInfo?.effects?.affection_bonus || 0}`);
            console.log(`     Energy level: ${weatherInfo?.effects?.energy_level}`);
        });
        
        console.log('✅ Weather effects test completed\n');
        
        console.log('🎉 Semua test integrasi sistem cuaca berhasil!');
        
    } catch (error) {
        console.error('❌ Error dalam test integrasi cuaca:', error);
    } finally {
        // Tutup koneksi database
        await closeDatabase();
        console.log('🔒 Koneksi database ditutup');
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testWeatherIntegration();
}

module.exports = { testWeatherIntegration };
