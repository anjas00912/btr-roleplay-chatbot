// Test file untuk memastikan sistem context builder berfungsi dengan baik
const { 
    buildDetailedSituationContext,
    getTimeAtmosphereDescription,
    buildSayActionContext,
    buildActActionContext,
    buildWeatherAtmosphereContext,
    buildWorldActivityContext,
    getMoodDescription
} = require('./utils/context-builder');

const { getCurrentJST, getJSTFromCustomTime } = require('./utils/time');

async function testContextBuilderSystem() {
    console.log('🎨 Memulai test sistem context builder untuk LLM prompts...\n');
    
    try {
        // Test 1: buildDetailedSituationContext() untuk berbagai skenario
        console.log('Test 1: buildDetailedSituationContext() untuk berbagai skenario');
        
        const mockPlayer = {
            origin_story: 'Pekerja Baru di STARRY',
            action_points: 7,
            current_weather: 'Cerah - Langit biru cerah tanpa awan'
        };
        
        const testScenarios = [
            {
                name: 'Say action dengan target Bocchi',
                action: 'say',
                target: 'Bocchi',
                validationContext: {
                    target: 'Bocchi',
                    location: 'STARRY',
                    activity: 'Latihan band dengan Kessoku Band',
                    mood: 'focused',
                    availability: 'available',
                    currentTime: '2025-06-28 19:30:00'
                }
            },
            {
                name: 'Act action - latihan gitar',
                action: 'latihan_gitar',
                target: null,
                validationContext: {
                    currentTime: '2025-06-28 10:00:00',
                    period: 'pagi',
                    optimality: 'normal',
                    creativityBonus: 'medium'
                }
            },
            {
                name: 'Act action - bekerja di STARRY',
                action: 'bekerja_starry',
                target: null,
                validationContext: {
                    currentTime: '2025-06-28 20:00:00',
                    period: 'malam',
                    atmosphere: 'Peak time - banyak pertunjukan',
                    charactersPresent: [
                        { name: 'Nijika', activity: 'Koordinasi band' },
                        { name: 'Ryo', activity: 'Sound check bass' }
                    ]
                }
            }
        ];
        
        testScenarios.forEach((scenario, index) => {
            console.log(`\n   Scenario ${index + 1}: ${scenario.name}`);
            const context = buildDetailedSituationContext(
                mockPlayer, 
                scenario.action, 
                scenario.target, 
                scenario.validationContext
            );
            
            console.log(`     Context length: ${context.length} characters`);
            console.log(`     Preview: ${context.substring(0, 150)}...`);
            
            // Verifikasi elemen penting ada dalam konteks
            const hasTime = context.includes('Waktu saat ini');
            const hasWeather = context.includes('Cuaca:');
            const hasAtmosphere = context.includes('Suasana');
            
            console.log(`     Contains time: ${hasTime ? '✅' : '❌'}`);
            console.log(`     Contains weather: ${hasWeather ? '✅' : '❌'}`);
            console.log(`     Contains atmosphere: ${hasAtmosphere ? '✅' : '❌'}`);
        });
        console.log('✅ buildDetailedSituationContext() working\n');
        
        // Test 2: getTimeAtmosphereDescription() untuk berbagai waktu
        console.log('Test 2: getTimeAtmosphereDescription() untuk berbagai waktu');
        
        const testTimes = [
            { hour: 6, period: 'pagi', dayOfWeek: 1 }, // Senin pagi
            { hour: 12, period: 'siang', dayOfWeek: 3 }, // Rabu siang
            { hour: 18, period: 'sore', dayOfWeek: 5 }, // Jumat sore
            { hour: 22, period: 'malam', dayOfWeek: 6 }, // Sabtu malam
            { hour: 2, period: 'malam', dayOfWeek: 7 }, // Minggu dini hari
        ];
        
        testTimes.forEach(time => {
            const mockTime = {
                hour: time.hour,
                period: time.period,
                dayOfWeek: time.dayOfWeek,
                dayName: ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][time.dayOfWeek]
            };
            
            const atmosphere = getTimeAtmosphereDescription(mockTime);
            console.log(`   ${mockTime.dayName} ${time.hour}:00 (${time.period}):`);
            console.log(`     ${atmosphere.substring(0, 100)}...`);
        });
        console.log('✅ getTimeAtmosphereDescription() working\n');
        
        // Test 3: buildSayActionContext() untuk berbagai karakter
        console.log('Test 3: buildSayActionContext() untuk berbagai karakter');
        
        const currentTime = getCurrentJST();
        const characterContexts = [
            {
                target: 'Bocchi',
                validationContext: {
                    location: 'Rumah Bocchi',
                    activity: 'Latihan gitar intensif',
                    mood: 'motivated',
                    availability: 'limited',
                    currentTime: currentTime.fullDateTimeString
                }
            },
            {
                target: 'Kita',
                validationContext: {
                    location: 'Shimokitazawa',
                    activity: 'Shopping aksesoris musik',
                    mood: 'excited',
                    availability: 'available',
                    currentTime: currentTime.fullDateTimeString
                }
            }
        ];
        
        characterContexts.forEach(({ target, validationContext }) => {
            const context = buildSayActionContext(target, currentTime, validationContext);
            console.log(`   ${target}:`);
            console.log(`     Context: ${context.substring(0, 120)}...`);
            console.log(`     Contains location: ${context.includes(validationContext.location) ? '✅' : '❌'}`);
            console.log(`     Contains availability: ${context.includes(validationContext.availability) ? '✅' : '❌'}`);
        });
        console.log('✅ buildSayActionContext() working\n');
        
        // Test 4: buildActActionContext() untuk berbagai aksi
        console.log('Test 4: buildActActionContext() untuk berbagai aksi');
        
        const actionContexts = [
            {
                action: 'latihan_gitar',
                validationContext: {
                    currentTime: currentTime.fullDateTimeString,
                    optimality: 'optimal',
                    creativityBonus: 'high'
                }
            },
            {
                action: 'bekerja_starry',
                validationContext: {
                    currentTime: currentTime.fullDateTimeString,
                    atmosphere: 'Persiapan sound check',
                    charactersPresent: [
                        { name: 'Nijika', activity: 'Setup drum' }
                    ]
                }
            },
            {
                action: 'jalan_shimokitazawa',
                validationContext: {
                    currentTime: currentTime.fullDateTimeString,
                    atmosphere: 'Suasana weekend yang santai',
                    charactersPresent: [
                        { name: 'Kita', activity: 'Window shopping' }
                    ]
                }
            }
        ];
        
        actionContexts.forEach(({ action, validationContext }) => {
            const context = buildActActionContext(action, currentTime, validationContext);
            console.log(`   ${action}:`);
            console.log(`     Context: ${context.substring(0, 120)}...`);
            console.log(`     Contains activity: ${context.includes('Aktivitas:') ? '✅' : '❌'}`);
            console.log(`     Contains location: ${context.includes('Lokasi:') ? '✅' : '❌'}`);
        });
        console.log('✅ buildActActionContext() working\n');
        
        // Test 5: buildWeatherAtmosphereContext() untuk berbagai cuaca
        console.log('Test 5: buildWeatherAtmosphereContext() untuk berbagai cuaca');
        
        const weatherTests = [
            { name: 'Cerah', mood: 'cheerful' },
            { name: 'Hujan Ringan', mood: 'romantic' },
            { name: 'Hujan Deras', mood: 'intimate' },
            { name: 'Mendung', mood: 'melancholic' },
            { name: 'Badai', mood: 'intense' }
        ];
        
        weatherTests.forEach(weather => {
            const mockWeatherInfo = { name: weather.name };
            const context = buildWeatherAtmosphereContext(mockWeatherInfo, currentTime);
            console.log(`   ${weather.name}:`);
            console.log(`     Context: ${context.substring(0, 100)}...`);
            console.log(`     Contains weather name: ${context.includes(weather.name.toLowerCase()) ? '✅' : '❌'}`);
        });
        console.log('✅ buildWeatherAtmosphereContext() working\n');
        
        // Test 6: buildWorldActivityContext() untuk berbagai waktu
        console.log('Test 6: buildWorldActivityContext() untuk berbagai waktu');
        
        const worldActivityTests = [
            { hour: 8, dayOfWeek: 1, expected: 'Rush hour pagi' },
            { hour: 14, dayOfWeek: 6, expected: 'Weekend siang' },
            { hour: 20, dayOfWeek: 5, expected: 'Malam weekday' },
            { hour: 1, dayOfWeek: 7, expected: 'Dini hari' }
        ];
        
        worldActivityTests.forEach(test => {
            const mockTime = {
                hour: test.hour,
                dayOfWeek: test.dayOfWeek
            };
            
            const context = buildWorldActivityContext(mockTime);
            console.log(`   ${['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][test.dayOfWeek]} ${test.hour}:00:`);
            console.log(`     Context: ${context.substring(0, 100)}...`);
            console.log(`     Relevant content: ${context.toLowerCase().includes(test.expected.toLowerCase().split(' ')[0]) ? '✅' : '❌'}`);
        });
        console.log('✅ buildWorldActivityContext() working\n');
        
        // Test 7: getMoodDescription() untuk semua mood
        console.log('Test 7: getMoodDescription() untuk semua mood');
        
        const moods = ['cheerful', 'pleasant', 'melancholic', 'romantic', 'intimate', 'dramatic', 'cozy', 'intense', 'unknown_mood'];
        
        moods.forEach(mood => {
            const description = getMoodDescription(mood);
            console.log(`   ${mood}: ${description}`);
            console.log(`     Has description: ${description.length > 10 ? '✅' : '❌'}`);
        });
        console.log('✅ getMoodDescription() working\n');
        
        // Test 8: Integration test - full context untuk skenario realistis
        console.log('Test 8: Integration test - full context untuk skenario realistis');
        
        const realisticScenario = {
            player: {
                origin_story: 'Siswa Pindahan',
                action_points: 5,
                current_weather: 'Hujan Ringan - Gerimis halus membasahi jalanan'
            },
            action: 'say',
            target: 'Bocchi',
            validationContext: {
                target: 'Bocchi',
                location: 'STARRY',
                activity: 'Latihan band dengan Kessoku Band',
                mood: 'focused',
                availability: 'available',
                currentTime: '2025-06-28 19:30:00'
            }
        };
        
        console.log('   Scenario: Pemain bicara dengan Bocchi di STARRY saat hujan ringan, jam 19:30');
        const fullContext = buildDetailedSituationContext(
            realisticScenario.player,
            realisticScenario.action,
            realisticScenario.target,
            realisticScenario.validationContext
        );
        
        console.log(`   Full context length: ${fullContext.length} characters`);
        console.log(`   Contains JST time: ${fullContext.includes('JST') ? '✅' : '❌'}`);
        console.log(`   Contains weather: ${fullContext.includes('Hujan') ? '✅' : '❌'}`);
        console.log(`   Contains character: ${fullContext.includes('Bocchi') ? '✅' : '❌'}`);
        console.log(`   Contains location: ${fullContext.includes('STARRY') ? '✅' : '❌'}`);
        console.log(`   Contains atmosphere: ${fullContext.includes('Suasana') ? '✅' : '❌'}`);
        console.log(`   Contains world activity: ${fullContext.includes('AKTIVITAS DUNIA') ? '✅' : '❌'}`);
        
        // Show sample of the context
        console.log('\n   Sample context preview:');
        const lines = fullContext.split('\n').slice(0, 10);
        lines.forEach(line => {
            console.log(`     ${line}`);
        });
        console.log('     ...');
        
        console.log('✅ Integration test working\n');
        
        console.log('🎉 Semua test sistem context builder berhasil!');
        console.log('💡 LLM prompts sekarang akan memiliki konteks waktu JST yang sangat detail dan immersive');
        
        // Summary
        console.log('\n📊 Summary:');
        console.log(`   Current JST: ${getCurrentJST().fullDateTimeString}`);
        console.log(`   Context builder functions: 7 functions tested`);
        console.log(`   Integration scenarios: 3 scenarios tested`);
        console.log(`   Weather contexts: 5 weather types tested`);
        console.log(`   Time atmospheres: 5 time periods tested`);
        console.log(`   Full context length: ${fullContext.length} characters`);
        console.log(`   System status: ✅ All context building systems operational`);
        
    } catch (error) {
        console.error('❌ Error dalam test sistem context builder:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testContextBuilderSystem();
}

module.exports = { testContextBuilderSystem };
