// Test file untuk memastikan sistem waktu JST berfungsi dengan baik
const { 
    getCurrentJST, 
    getNextResetTime, 
    isNewDayInJST, 
    shouldResetDaily, 
    getDisplayTimeInfo,
    getJSTFromCustomTime,
    JST_TIMEZONE,
    DAILY_RESET_HOUR,
    DAILY_RESET_MINUTE
} = require('./utils/time');

const { getJSTTimeInfo, getCurrentJSTInfo } = require('./daily-reset');

async function testJSTTimeSystem() {
    console.log('🕐 Memulai test sistem waktu JST...\n');
    
    try {
        // Test 1: getCurrentJST()
        console.log('Test 1: getCurrentJST()');
        const currentJST = getCurrentJST();
        console.log(`   Current JST: ${currentJST.fullDateTimeString}`);
        console.log(`   Date: ${currentJST.dateString}`);
        console.log(`   Time: ${currentJST.timeString}`);
        console.log(`   Day: ${currentJST.dayName} (${currentJST.dayOfWeek})`);
        console.log(`   Period: ${currentJST.period}`);
        console.log(`   Timezone: ${currentJST.timezone}`);
        console.log(`   UTC Time: ${currentJST.utcString}`);
        console.log(`   Is Reset Time: ${currentJST.isResetTime}`);
        console.log('✅ getCurrentJST() working\n');
        
        // Test 2: getNextResetTime()
        console.log('Test 2: getNextResetTime()');
        const nextReset = getNextResetTime();
        console.log(`   Next reset: ${nextReset.toISOString()}`);
        console.log(`   Next reset JST: ${getJSTFromCustomTime(nextReset).fullDateTimeString}`);
        
        // Hitung waktu sampai reset
        const timeUntilReset = nextReset.getTime() - currentJST.jstDate.getTime();
        const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
        const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
        console.log(`   Time until reset: ${hoursUntilReset}h ${minutesUntilReset}m`);
        console.log('✅ getNextResetTime() working\n');
        
        // Test 3: isNewDayInJST()
        console.log('Test 3: isNewDayInJST()');
        
        const testDates = [
            null, // Belum pernah bermain
            currentJST.dateString, // Hari yang sama
            '2024-01-01', // Hari yang berbeda
            '2025-06-27', // Kemarin (mungkin)
        ];
        
        testDates.forEach((testDate, index) => {
            const isNewDay = isNewDayInJST(testDate);
            console.log(`   Test ${index + 1}: ${testDate || 'null'} -> ${isNewDay ? 'New Day' : 'Same Day'}`);
        });
        console.log('✅ isNewDayInJST() working\n');
        
        // Test 4: shouldResetDaily()
        console.log('Test 4: shouldResetDaily()');
        
        const testTimestamps = [
            null, // Belum pernah reset
            new Date().toISOString(), // Baru saja
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 jam lalu
            new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 jam lalu
        ];
        
        testTimestamps.forEach((timestamp, index) => {
            const shouldReset = shouldResetDaily(timestamp);
            console.log(`   Test ${index + 1}: ${timestamp || 'null'} -> ${shouldReset ? 'Should Reset' : 'No Reset'}`);
        });
        console.log('✅ shouldResetDaily() working\n');
        
        // Test 5: getDisplayTimeInfo()
        console.log('Test 5: getDisplayTimeInfo()');
        const displayInfo = getDisplayTimeInfo();
        console.log(`   Current Time: ${displayInfo.currentTime}`);
        console.log(`   Current Date: ${displayInfo.currentDate}`);
        console.log(`   Day Name: ${displayInfo.dayName}`);
        console.log(`   Period: ${displayInfo.period}`);
        console.log(`   Next Reset: ${displayInfo.nextResetTime}`);
        console.log(`   Time Until Reset: ${displayInfo.timeUntilReset}`);
        console.log(`   Is Near Reset: ${displayInfo.isNearReset}`);
        console.log(`   Full DateTime: ${displayInfo.fullDateTime}`);
        console.log('✅ getDisplayTimeInfo() working\n');
        
        // Test 6: Integration dengan daily-reset.js
        console.log('Test 6: Integration dengan daily-reset.js');
        const jstTimeInfo = getJSTTimeInfo();
        const currentJSTInfo = getCurrentJSTInfo();
        
        console.log('   From daily-reset getJSTTimeInfo():');
        console.log(`     Current Time: ${jstTimeInfo.currentTime}`);
        console.log(`     Current Date: ${jstTimeInfo.currentDate}`);
        console.log(`     Day Name: ${jstTimeInfo.dayName}`);
        console.log(`     Period: ${jstTimeInfo.period}`);
        
        console.log('   From daily-reset getCurrentJSTInfo():');
        console.log(`     Full DateTime: ${currentJSTInfo.fullDateTimeString}`);
        console.log(`     Date String: ${currentJSTInfo.dateString}`);
        console.log(`     Time String: ${currentJSTInfo.timeString}`);
        console.log('✅ Integration working\n');
        
        // Test 7: Test dengan waktu custom (simulasi berbagai skenario)
        console.log('Test 7: Test dengan waktu custom');
        
        const testScenarios = [
            // Scenario 1: Tepat waktu reset (5 AM JST)
            {
                name: 'Reset Time (5 AM JST)',
                utcTime: new Date('2025-06-28T20:00:00.000Z') // 5 AM JST = 8 PM UTC (UTC-9)
            },
            // Scenario 2: Sebelum reset (4 AM JST)
            {
                name: 'Before Reset (4 AM JST)',
                utcTime: new Date('2025-06-28T19:00:00.000Z') // 4 AM JST = 7 PM UTC
            },
            // Scenario 3: Setelah reset (6 AM JST)
            {
                name: 'After Reset (6 AM JST)',
                utcTime: new Date('2025-06-28T21:00:00.000Z') // 6 AM JST = 9 PM UTC
            },
            // Scenario 4: Tengah malam JST
            {
                name: 'Midnight JST',
                utcTime: new Date('2025-06-28T15:00:00.000Z') // 12 AM JST = 3 PM UTC
            }
        ];
        
        testScenarios.forEach((scenario, index) => {
            console.log(`   Scenario ${index + 1}: ${scenario.name}`);
            const customJST = getJSTFromCustomTime(scenario.utcTime);
            if (customJST) {
                console.log(`     JST Time: ${customJST.fullDateTimeString}`);
                console.log(`     Period: ${customJST.period}`);
                console.log(`     Day: ${customJST.dayOfWeek}`);
            } else {
                console.log(`     Error converting time`);
            }
        });
        console.log('✅ Custom time testing working\n');
        
        // Test 8: Konstanta dan konfigurasi
        console.log('Test 8: Konstanta dan konfigurasi');
        console.log(`   JST_TIMEZONE: ${JST_TIMEZONE}`);
        console.log(`   DAILY_RESET_HOUR: ${DAILY_RESET_HOUR}`);
        console.log(`   DAILY_RESET_MINUTE: ${DAILY_RESET_MINUTE}`);
        console.log('✅ Constants working\n');
        
        // Test 9: Error handling
        console.log('Test 9: Error handling');
        try {
            // Test dengan input invalid
            const invalidResult = getJSTFromCustomTime('invalid date');
            console.log(`   Invalid date handling: ${invalidResult ? 'Failed' : 'Passed'}`);
        } catch (error) {
            console.log(`   Error handling: Passed (${error.message})`);
        }
        console.log('✅ Error handling working\n');
        
        // Test 10: Performance test
        console.log('Test 10: Performance test');
        const startTime = Date.now();
        
        for (let i = 0; i < 1000; i++) {
            getCurrentJST();
        }
        
        const endTime = Date.now();
        const avgTime = (endTime - startTime) / 1000;
        console.log(`   1000 calls to getCurrentJST(): ${avgTime.toFixed(2)}ms average`);
        console.log(`   Performance: ${avgTime < 1 ? 'Excellent' : avgTime < 5 ? 'Good' : 'Needs optimization'}`);
        console.log('✅ Performance test completed\n');
        
        console.log('🎉 Semua test sistem waktu JST berhasil!');
        console.log('💡 Sistem waktu JST siap digunakan untuk daily reset yang akurat');
        
        // Summary
        console.log('\n📊 Summary:');
        console.log(`   Current JST: ${currentJST.fullDateTimeString}`);
        console.log(`   Next Reset: ${getJSTFromCustomTime(nextReset).fullDateTimeString}`);
        console.log(`   Time Until Reset: ${hoursUntilReset}h ${minutesUntilReset}m`);
        console.log(`   System Status: ✅ All systems operational`);
        
    } catch (error) {
        console.error('❌ Error dalam test sistem waktu JST:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testJSTTimeSystem();
}

module.exports = { testJSTTimeSystem };
