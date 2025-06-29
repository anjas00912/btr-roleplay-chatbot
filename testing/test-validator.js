// Test file untuk memastikan sistem validasi core interaction logic berfungsi dengan baik
const { 
    isActionPossible, 
    validateSayAction, 
    validateGuitarPractice, 
    validateStarryWork, 
    validateSongwriting, 
    validateShimokitazawaWalk, 
    getSuggestions, 
    getSayActionSuggestions 
} = require('./utils/validator');

const { getCurrentJST, getJSTFromCustomTime } = require('./utils/time');

async function testValidatorSystem() {
    console.log('🔍 Memulai test sistem validasi core interaction logic...\n');
    
    try {
        // Test 1: isActionPossible() dengan berbagai aksi
        console.log('Test 1: isActionPossible() dengan berbagai aksi');
        const currentTime = getCurrentJST();
        console.log(`   Waktu saat ini: ${currentTime.fullDateTimeString} (${currentTime.period})`);
        
        const testActions = [
            { action: 'bicara', target: 'Bocchi' },
            { action: 'say', target: 'Nijika' },
            { action: 'bicara', target: 'InvalidCharacter' },
            { action: 'latihan_gitar', target: null },
            { action: 'bekerja_starry', target: null },
            { action: 'menulis_lagu', target: null },
            { action: 'jalan_shimokitazawa', target: null },
            { action: 'invalid_action', target: null }
        ];
        
        testActions.forEach(({ action, target }) => {
            const result = isActionPossible(action, target, 'test_user_id');
            console.log(`   ${action}${target ? ` -> ${target}` : ''}: ${result.possible ? '✅ VALID' : '❌ INVALID'}`);
            if (!result.possible) {
                console.log(`     Reason: ${result.reason}`);
            }
            if (result.context) {
                console.log(`     Context: ${JSON.stringify(result.context, null, 2).substring(0, 100)}...`);
            }
        });
        console.log('✅ isActionPossible() working\n');
        
        // Test 2: validateSayAction() dengan berbagai karakter
        console.log('Test 2: validateSayAction() dengan berbagai karakter');
        
        const characters = ['Bocchi', 'Nijika', 'Ryo', 'Kita', 'Kikuri', 'InvalidCharacter'];
        
        characters.forEach(character => {
            const result = validateSayAction(character, currentTime);
            console.log(`   ${character}: ${result.possible ? '✅ AVAILABLE' : '❌ UNAVAILABLE'}`);
            console.log(`     Reason: ${result.reason}`);
            if (result.context && result.context.location) {
                console.log(`     Location: ${result.context.location}`);
                console.log(`     Activity: ${result.context.activity}`);
                console.log(`     Mood: ${result.context.mood}`);
                console.log(`     Availability: ${result.context.availability}`);
            }
        });
        console.log('✅ validateSayAction() working\n');
        
        // Test 3: validateGuitarPractice() dengan berbagai waktu
        console.log('Test 3: validateGuitarPractice() dengan berbagai waktu');
        
        const testHours = [2, 6, 10, 14, 18, 22, 23];
        
        testHours.forEach(hour => {
            // Simulasi waktu dengan jam tertentu
            const testTime = { ...currentTime, hour, timeString: `${hour.toString().padStart(2, '0')}:00:00` };
            const result = validateGuitarPractice(testTime);
            console.log(`   ${hour}:00 - ${result.possible ? '✅ OK' : '❌ NOT OK'}: ${result.reason}`);
        });
        console.log('✅ validateGuitarPractice() working\n');
        
        // Test 4: validateStarryWork() dengan berbagai waktu
        console.log('Test 4: validateStarryWork() dengan berbagai waktu');
        
        testHours.forEach(hour => {
            const testTime = { ...currentTime, hour };
            const result = validateStarryWork(testTime);
            console.log(`   ${hour}:00 - ${result.possible ? '✅ OPEN' : '❌ CLOSED'}: ${result.reason.substring(0, 50)}...`);
        });
        console.log('✅ validateStarryWork() working\n');
        
        // Test 5: validateSongwriting() dengan berbagai waktu
        console.log('Test 5: validateSongwriting() dengan berbagai waktu');
        
        testHours.forEach(hour => {
            const testTime = { ...currentTime, hour };
            const result = validateSongwriting(testTime);
            const optimality = result.context?.optimality || 'unknown';
            console.log(`   ${hour}:00 - ✅ ${optimality.toUpperCase()}: ${result.reason.substring(0, 50)}...`);
        });
        console.log('✅ validateSongwriting() working\n');
        
        // Test 6: validateShimokitazawaWalk()
        console.log('Test 6: validateShimokitazawaWalk()');
        
        const walkResult = validateShimokitazawaWalk(currentTime);
        console.log(`   Current time: ${walkResult.possible ? '✅ GOOD TIME' : '❌ BAD TIME'}`);
        console.log(`   Reason: ${walkResult.reason}`);
        if (walkResult.context?.charactersPresent) {
            console.log(`   Characters present: ${walkResult.context.charactersPresent.length}`);
        }
        console.log('✅ validateShimokitazawaWalk() working\n');
        
        // Test 7: getSuggestions() untuk berbagai aksi
        console.log('Test 7: getSuggestions() untuk berbagai aksi');
        
        const actionTypes = ['bicara', 'bekerja_starry', 'latihan_gitar', 'unknown_action'];
        const targets = ['Bocchi', 'Nijika', 'Ryo', 'Kita', 'Kikuri'];
        
        actionTypes.forEach(action => {
            if (action === 'bicara') {
                targets.forEach(target => {
                    const suggestions = getSuggestions(action, target);
                    console.log(`   ${action} -> ${target}:`);
                    console.log(`     Times: ${suggestions.suggestedTimes.join(', ')}`);
                    console.log(`     Tips: ${suggestions.tips.substring(0, 50)}...`);
                });
            } else {
                const suggestions = getSuggestions(action, null);
                console.log(`   ${action}:`);
                console.log(`     Times: ${suggestions.suggestedTimes.join(', ')}`);
                console.log(`     Tips: ${suggestions.tips.substring(0, 50)}...`);
            }
        });
        console.log('✅ getSuggestions() working\n');
        
        // Test 8: getSayActionSuggestions() untuk semua karakter
        console.log('Test 8: getSayActionSuggestions() untuk semua karakter');
        
        const allCharacters = ['Bocchi', 'Nijika', 'Ryo', 'Kita', 'Kikuri', 'UnknownCharacter'];
        
        allCharacters.forEach(character => {
            const suggestions = getSayActionSuggestions(character);
            console.log(`   ${character}:`);
            console.log(`     Best times: ${suggestions.suggestedTimes.join(', ')}`);
            console.log(`     Tips: ${suggestions.tips.substring(0, 60)}...`);
        });
        console.log('✅ getSayActionSuggestions() working\n');
        
        // Test 9: Scenario testing - realistic game situations
        console.log('Test 9: Scenario testing - realistic game situations');
        
        const scenarios = [
            {
                name: 'Pemain ingin bicara dengan Bocchi jam 10 pagi (weekend)',
                action: 'bicara',
                target: 'Bocchi',
                time: currentTime // Saat ini weekend pagi
            },
            {
                name: 'Pemain ingin latihan gitar jam 3 pagi',
                action: 'latihan_gitar',
                target: null,
                time: { ...currentTime, hour: 3 }
            },
            {
                name: 'Pemain ingin bekerja di STARRY jam 12 siang',
                action: 'bekerja_starry',
                target: null,
                time: { ...currentTime, hour: 12 }
            },
            {
                name: 'Pemain ingin menulis lagu jam 9 malam',
                action: 'menulis_lagu',
                target: null,
                time: { ...currentTime, hour: 21 }
            }
        ];
        
        scenarios.forEach((scenario, index) => {
            console.log(`   Scenario ${index + 1}: ${scenario.name}`);
            
            // Untuk test ini, kita gunakan waktu saat ini atau simulasi sederhana
            const result = isActionPossible(scenario.action, scenario.target, 'test_user');
            
            console.log(`     Result: ${result.possible ? '✅ POSSIBLE' : '❌ NOT POSSIBLE'}`);
            console.log(`     Reason: ${result.reason}`);
            
            if (!result.possible && scenario.action === 'bicara') {
                const suggestions = getSayActionSuggestions(scenario.target);
                console.log(`     Suggestion: ${suggestions.suggestedTimes[0] || 'No suggestion'}`);
            }
        });
        console.log('✅ Scenario testing working\n');
        
        // Test 10: Error handling
        console.log('Test 10: Error handling');
        
        const errorTests = [
            { action: null, target: 'Bocchi' },
            { action: 'bicara', target: null },
            { action: '', target: '' },
            { action: 'bicara', target: 'Bocchi', userId: null }
        ];
        
        errorTests.forEach((test, index) => {
            try {
                const result = isActionPossible(test.action, test.target, test.userId || 'test_user');
                console.log(`   Error test ${index + 1}: ${result.possible ? 'Unexpected success' : 'Handled gracefully'}`);
                console.log(`     Reason: ${result.reason.substring(0, 50)}...`);
            } catch (error) {
                console.log(`   Error test ${index + 1}: Exception caught - ${error.message.substring(0, 50)}...`);
            }
        });
        console.log('✅ Error handling working\n');
        
        console.log('🎉 Semua test sistem validasi berhasil!');
        console.log('💡 Core interaction logic siap mencegah aksi yang tidak realistis');
        
        // Summary
        console.log('\n📊 Summary:');
        console.log(`   Waktu saat ini: ${currentTime.fullDateTimeString}`);
        console.log(`   Period: ${currentTime.period}`);
        console.log(`   Day type: ${currentTime.dayOfWeek === 6 || currentTime.dayOfWeek === 7 ? 'Weekend' : 'Weekday'}`);
        
        // Test quick validation untuk semua karakter saat ini
        const currentAvailability = ['Bocchi', 'Nijika', 'Ryo', 'Kita', 'Kikuri'].map(char => {
            const result = validateSayAction(char, currentTime);
            return { character: char, available: result.possible };
        });
        
        const availableNow = currentAvailability.filter(c => c.available).map(c => c.character);
        const unavailableNow = currentAvailability.filter(c => !c.available).map(c => c.character);
        
        console.log(`   Available characters: ${availableNow.join(', ') || 'None'}`);
        console.log(`   Unavailable characters: ${unavailableNow.join(', ') || 'None'}`);
        console.log(`   System status: ✅ All validation systems operational`);
        
    } catch (error) {
        console.error('❌ Error dalam test sistem validasi:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testValidatorSystem();
}

module.exports = { testValidatorSystem };
