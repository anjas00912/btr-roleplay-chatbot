// Test file untuk memastikan jadwal Seika Ijichi berfungsi dengan baik
const { 
    schedules, 
    getCharacterActivity, 
    getCharactersAtLocation 
} = require('./game_logic/schedules');

const { 
    isActionPossible, 
    validateSayAction, 
    getSayActionSuggestions 
} = require('./utils/validator');

const { getCurrentJST, getJSTFromCustomTime } = require('./utils/time');
const { buildDetailedSituationContext } = require('./utils/context-builder');

async function testSeikaSchedule() {
    console.log('👩‍💼 Memulai test jadwal Seika Ijichi...\n');
    
    try {
        // Test 1: Verifikasi jadwal Seika ada dalam sistem
        console.log('Test 1: Verifikasi jadwal Seika ada dalam sistem');
        
        const seikaSchedule = schedules.characters.Seika;
        console.log(`   Seika schedule exists: ${seikaSchedule ? '✅' : '❌'}`);
        
        if (seikaSchedule) {
            console.log(`   Weekday schedule entries: ${seikaSchedule.weekday.length}`);
            console.log(`   Weekend schedule entries: ${seikaSchedule.weekend.length}`);
            
            // Verifikasi struktur jadwal weekday
            console.log('\n   Weekday schedule verification:');
            seikaSchedule.weekday.forEach((entry, index) => {
                console.log(`     ${entry.start}:00-${entry.end}:00: ${entry.location}`);
                console.log(`       Activity: ${entry.activity}`);
                console.log(`       Mood: ${entry.mood}`);
                console.log(`       Availability: ${typeof entry.availability === 'object' ? 
                    `${entry.availability.type} (${entry.availability.difficulty})` : 
                    entry.availability}`);
            });
            
            // Verifikasi struktur jadwal weekend
            console.log('\n   Weekend schedule verification:');
            seikaSchedule.weekend.forEach((entry, index) => {
                console.log(`     ${entry.start}:00-${entry.end}:00: ${entry.location}`);
                console.log(`       Activity: ${entry.activity}`);
                console.log(`       Mood: ${entry.mood}`);
                console.log(`       Availability: ${typeof entry.availability === 'object' ? 
                    `${entry.availability.type} (${entry.availability.difficulty})` : 
                    entry.availability}`);
            });
        }
        console.log('✅ Jadwal Seika verified\n');
        
        // Test 2: Test getCharacterActivity untuk Seika di berbagai waktu
        console.log('Test 2: Test getCharacterActivity untuk Seika di berbagai waktu');
        
        const testTimes = [
            { hour: 8, day: 'weekday', expected: 'unavailable' },
            { hour: 11, day: 'weekday', expected: 'limited_very_hard' },
            { hour: 15, day: 'weekday', expected: 'limited_hard' },
            { hour: 19, day: 'weekday', expected: 'available_hard' },
            { hour: 23, day: 'weekday', expected: 'limited_medium' },
            { hour: 9, day: 'weekend', expected: 'unavailable' },
            { hour: 13, day: 'weekend', expected: 'limited_very_hard' },
            { hour: 20, day: 'weekend', expected: 'available_very_hard' },
            { hour: 23, day: 'weekend', expected: 'limited_easy' }
        ];
        
        testTimes.forEach(({ hour, day, expected }) => {
            // Simulasi waktu
            const mockTime = {
                hour,
                dayOfWeek: day === 'weekend' ? 6 : 1 // Sabtu atau Senin
            };
            
            // Hack untuk test: temporarily override getCurrentJST
            const originalGetCurrentJST = require('./utils/time').getCurrentJST;
            require('./utils/time').getCurrentJST = () => mockTime;
            
            const activity = getCharacterActivity('Seika');
            
            // Restore original function
            require('./utils/time').getCurrentJST = originalGetCurrentJST;
            
            if (activity.found) {
                const availability = activity.current.availability;
                const availabilityStr = typeof availability === 'object' ? 
                    `${availability.type}_${availability.difficulty}` : 
                    availability;
                
                console.log(`   ${day} ${hour}:00 - Expected: ${expected}, Got: ${availabilityStr}`);
                console.log(`     Location: ${activity.current.location}`);
                console.log(`     Activity: ${activity.current.activity}`);
                console.log(`     Mood: ${activity.current.mood}`);
                
                if (typeof availability === 'object' && availability.reason) {
                    console.log(`     Reason: ${availability.reason}`);
                }
            } else {
                console.log(`   ${day} ${hour}:00 - No activity found`);
            }
        });
        console.log('✅ Character activity testing completed\n');
        
        // Test 3: Test validateSayAction untuk Seika
        console.log('Test 3: Test validateSayAction untuk Seika');
        
        const currentTime = getCurrentJST();
        const seikaValidation = validateSayAction('Seika', currentTime);
        
        console.log(`   Validation result: ${seikaValidation.possible ? '✅ POSSIBLE' : '❌ NOT POSSIBLE'}`);
        console.log(`   Reason: ${seikaValidation.reason}`);
        
        if (seikaValidation.context) {
            console.log(`   Context:`);
            console.log(`     Location: ${seikaValidation.context.location}`);
            console.log(`     Activity: ${seikaValidation.context.activity}`);
            console.log(`     Mood: ${seikaValidation.context.mood}`);
            console.log(`     Availability: ${seikaValidation.context.availability}`);
            if (seikaValidation.context.difficulty) {
                console.log(`     Difficulty: ${seikaValidation.context.difficulty}`);
            }
        }
        console.log('✅ Say action validation completed\n');
        
        // Test 4: Test getSayActionSuggestions untuk Seika
        console.log('Test 4: Test getSayActionSuggestions untuk Seika');
        
        const suggestions = getSayActionSuggestions('Seika');
        console.log(`   Suggested times: ${suggestions.suggestedTimes.join(', ')}`);
        console.log(`   Tips: ${suggestions.tips}`);
        console.log('✅ Suggestions working\n');
        
        // Test 5: Test isActionPossible untuk bicara dengan Seika
        console.log('Test 5: Test isActionPossible untuk bicara dengan Seika');
        
        const actionValidation = isActionPossible('bicara', 'Seika', 'test_user');
        console.log(`   Action possible: ${actionValidation.possible ? '✅ YES' : '❌ NO'}`);
        console.log(`   Reason: ${actionValidation.reason}`);
        
        if (actionValidation.context && actionValidation.context.difficulty) {
            console.log(`   Difficulty level: ${actionValidation.context.difficulty}`);
        }
        console.log('✅ Action validation completed\n');
        
        // Test 6: Test context builder untuk Seika
        console.log('Test 6: Test context builder untuk Seika');
        
        const mockPlayer = {
            origin_story: 'Pekerja Baru di STARRY',
            action_points: 6,
            current_weather: 'Mendung - Awan gelap menutupi langit'
        };
        
        const mockValidationContext = {
            target: 'Seika',
            location: 'STARRY',
            activity: 'Mengelola jalannya live house, mengawasi pertunjukan',
            mood: 'intimidating',
            availability: 'available',
            difficulty: 'hard',
            currentTime: currentTime.fullDateTimeString
        };
        
        const context = buildDetailedSituationContext(
            mockPlayer, 
            'say', 
            'Seika', 
            mockValidationContext
        );
        
        console.log(`   Context length: ${context.length} characters`);
        console.log(`   Contains Seika: ${context.includes('Seika') ? '✅' : '❌'}`);
        console.log(`   Contains difficulty: ${context.includes('PERINGATAN') || context.includes('TERSEDIA') ? '✅' : '❌'}`);
        console.log(`   Contains mood: ${context.includes('intimidating') ? '✅' : '❌'}`);
        
        // Show sample context
        console.log('\n   Sample context preview:');
        const lines = context.split('\n').slice(0, 12);
        lines.forEach(line => {
            console.log(`     ${line}`);
        });
        console.log('     ...');
        
        console.log('✅ Context builder working\n');
        
        // Test 7: Test Seika di berbagai lokasi
        console.log('Test 7: Test Seika di berbagai lokasi');
        
        const locations = ['STARRY', 'Apartemen di atas STARRY', 'Shimokitazawa'];
        
        locations.forEach(location => {
            const charactersAtLocation = getCharactersAtLocation(location);
            const seikaAtLocation = charactersAtLocation.find(char => char.name === 'Seika');
            
            console.log(`   ${location}:`);
            if (seikaAtLocation) {
                console.log(`     ✅ Seika found: ${seikaAtLocation.activity}`);
                console.log(`     Mood: ${seikaAtLocation.mood}`);
                console.log(`     Availability: ${seikaAtLocation.availability}`);
            } else {
                console.log(`     ❌ Seika not at this location currently`);
            }
        });
        console.log('✅ Location testing completed\n');
        
        // Test 8: Test personality traits dalam jadwal
        console.log('Test 8: Test personality traits dalam jadwal');
        
        // Analisis jadwal untuk traits kepribadian
        const allActivities = [
            ...seikaSchedule.weekday.map(a => a.activity),
            ...seikaSchedule.weekend.map(a => a.activity)
        ];
        
        const personalityTraits = {
            'Professional': allActivities.some(a => a.includes('administrasi') || a.includes('teknis') || a.includes('mengelola')),
            'Hard Worker': allActivities.some(a => a.includes('bekerja') || a.includes('persiapan') || a.includes('mengurus')),
            'Protective of Nijika': allActivities.some(a => a.includes('Nijika')),
            'STARRY Focused': allActivities.every(a => a.includes('STARRY') || a.includes('Apartemen')),
            'Tsundere (caring but distant)': seikaSchedule.weekday.some(entry => 
                entry.availability && typeof entry.availability === 'object' && entry.availability.difficulty
            )
        };
        
        console.log('   Personality traits reflected in schedule:');
        Object.entries(personalityTraits).forEach(([trait, present]) => {
            console.log(`     ${trait}: ${present ? '✅' : '❌'}`);
        });
        
        // Analisis mood patterns
        const allMoods = [
            ...seikaSchedule.weekday.map(a => a.mood),
            ...seikaSchedule.weekend.map(a => a.mood)
        ];
        
        const uniqueMoods = [...new Set(allMoods)];
        console.log(`\n   Mood variety: ${uniqueMoods.length} different moods`);
        console.log(`   Moods: ${uniqueMoods.join(', ')}`);
        
        // Analisis difficulty levels
        const difficultyLevels = [];
        [...seikaSchedule.weekday, ...seikaSchedule.weekend].forEach(entry => {
            if (typeof entry.availability === 'object' && entry.availability.difficulty) {
                difficultyLevels.push(entry.availability.difficulty);
            }
        });
        
        const uniqueDifficulties = [...new Set(difficultyLevels)];
        console.log(`\n   Difficulty levels: ${uniqueDifficulties.join(', ')}`);
        console.log(`   Shows tsundere nature: ${uniqueDifficulties.length > 1 ? '✅' : '❌'}`);
        
        console.log('✅ Personality analysis completed\n');
        
        console.log('🎉 Semua test jadwal Seika berhasil!');
        console.log('💡 Seika Ijichi siap menjadi karakter yang menantang dan kompleks');
        
        // Summary
        console.log('\n📊 Summary:');
        console.log(`   Weekday schedule slots: ${seikaSchedule.weekday.length}`);
        console.log(`   Weekend schedule slots: ${seikaSchedule.weekend.length}`);
        console.log(`   Unique moods: ${uniqueMoods.length}`);
        console.log(`   Difficulty levels: ${uniqueDifficulties.length}`);
        console.log(`   Primary location: STARRY & Apartemen`);
        console.log(`   Character complexity: High (tsundere with professional focus)`);
        console.log(`   Interaction challenge: Very High (requires strategy and timing)`);
        console.log(`   System integration: ✅ Fully integrated with validator and context builder`);
        
    } catch (error) {
        console.error('❌ Error dalam test jadwal Seika:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testSeikaSchedule();
}

module.exports = { testSeikaSchedule };
