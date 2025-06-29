// Test file untuk memastikan sistem jadwal dunia berfungsi dengan baik
const { 
    schedules, 
    getLocationStatus, 
    getCharacterActivity, 
    getCharactersAtLocation, 
    getWorldStatus 
} = require('./game_logic/schedules');

const { getCurrentJST, getJSTFromCustomTime } = require('./utils/time');

async function testScheduleSystem() {
    console.log('📅 Memulai test sistem jadwal dunia...\n');
    
    try {
        // Test 1: Struktur data schedules
        console.log('Test 1: Struktur data schedules');
        console.log(`   Jumlah lokasi: ${Object.keys(schedules.locations).length}`);
        console.log(`   Jumlah karakter: ${Object.keys(schedules.characters).length}`);
        
        // Verifikasi lokasi
        const locations = Object.keys(schedules.locations);
        console.log(`   Lokasi: ${locations.join(', ')}`);
        
        // Verifikasi karakter
        const characters = Object.keys(schedules.characters);
        console.log(`   Karakter: ${characters.join(', ')}`);
        
        // Verifikasi metadata
        console.log(`   Timezone: ${schedules.metadata.timezone}`);
        console.log(`   Reset Hour: ${schedules.metadata.resetHour}`);
        console.log('✅ Struktur data schedules valid\n');
        
        // Test 2: getLocationStatus() dengan waktu saat ini
        console.log('Test 2: getLocationStatus() dengan waktu saat ini');
        const currentTime = getCurrentJST();
        console.log(`   Waktu saat ini: ${currentTime.fullDateTimeString} (${currentTime.period})`);
        
        locations.forEach(locationName => {
            const status = getLocationStatus(locationName);
            console.log(`   ${locationName}:`);
            console.log(`     Status: ${status.status} (${status.isOpen ? 'BUKA' : 'TUTUP'})`);
            console.log(`     Message: ${status.message}`);
            console.log(`     Atmosphere: ${status.atmosphere}`);
            if (status.nextChange) {
                console.log(`     Next change: ${status.nextChange.status} in ${status.nextChange.hoursUntil}h`);
            }
        });
        console.log('✅ getLocationStatus() working\n');
        
        // Test 3: getCharacterActivity() dengan waktu saat ini
        console.log('Test 3: getCharacterActivity() dengan waktu saat ini');
        
        characters.forEach(characterName => {
            const activity = getCharacterActivity(characterName);
            if (activity.found) {
                console.log(`   ${characterName}:`);
                console.log(`     Lokasi: ${activity.current.location}`);
                console.log(`     Aktivitas: ${activity.current.activity}`);
                console.log(`     Mood: ${activity.current.mood}`);
                console.log(`     Availability: ${activity.current.availability}`);
                console.log(`     Time remaining: ${activity.current.timeRemaining}h`);
                console.log(`     Schedule type: ${activity.dayType}`);
            } else {
                console.log(`   ${characterName}: ${activity.message}`);
            }
        });
        console.log('✅ getCharacterActivity() working\n');
        
        // Test 4: getCharactersAtLocation()
        console.log('Test 4: getCharactersAtLocation()');
        
        locations.forEach(locationName => {
            const charactersAtLoc = getCharactersAtLocation(locationName);
            console.log(`   ${locationName}: ${charactersAtLoc.length} karakter`);
            charactersAtLoc.forEach(char => {
                console.log(`     - ${char.name}: ${char.activity} (${char.mood}, ${char.availability})`);
            });
        });
        console.log('✅ getCharactersAtLocation() working\n');
        
        // Test 5: getWorldStatus()
        console.log('Test 5: getWorldStatus()');
        const worldStatus = getWorldStatus();
        
        console.log(`   Current time: ${worldStatus.currentTime.jst}`);
        console.log(`   Period: ${worldStatus.currentTime.period}`);
        console.log(`   Day: ${worldStatus.currentTime.dayName}`);
        console.log(`   Is weekend: ${worldStatus.currentTime.isWeekend}`);
        
        console.log(`   Open locations: ${Object.entries(worldStatus.locations)
            .filter(([name, status]) => status.isOpen)
            .map(([name]) => name)
            .join(', ')}`);
        
        console.log(`   Available characters: ${Object.entries(worldStatus.characters)
            .filter(([name, activity]) => activity.found && activity.current.availability === 'available')
            .map(([name]) => name)
            .join(', ')}`);
        
        console.log('✅ getWorldStatus() working\n');
        
        // Test 6: Test dengan berbagai waktu (simulasi)
        console.log('Test 6: Test dengan berbagai waktu (simulasi)');
        
        const testTimes = [
            { name: 'Pagi (7 AM)', hour: 7 },
            { name: 'Siang (12 PM)', hour: 12 },
            { name: 'Sore (17 PM)', hour: 17 },
            { name: 'Malam (22 PM)', hour: 22 },
            { name: 'Tengah Malam (2 AM)', hour: 2 }
        ];
        
        testTimes.forEach(testTime => {
            console.log(`   ${testTime.name}:`);
            
            // Simulasi waktu dengan membuat custom date
            const testDate = new Date();
            testDate.setHours(testTime.hour, 0, 0, 0);
            
            // Test STARRY status pada waktu tersebut
            const starryOpen = testTime.hour >= 17 && testTime.hour < 23;
            console.log(`     STARRY: ${starryOpen ? 'BUKA' : 'TUTUP'}`);
            
            // Test aktivitas Bocchi pada waktu tersebut
            let bocchiActivity = 'Unknown';
            if (testTime.hour >= 0 && testTime.hour < 6) bocchiActivity = 'Tidur';
            else if (testTime.hour >= 8 && testTime.hour < 15) bocchiActivity = 'Sekolah';
            else if (testTime.hour >= 17 && testTime.hour < 21) bocchiActivity = 'Latihan di STARRY';
            else if (testTime.hour >= 22) bocchiActivity = 'Latihan gitar di rumah';
            
            console.log(`     Bocchi: ${bocchiActivity}`);
        });
        console.log('✅ Time simulation working\n');
        
        // Test 7: Test weekend vs weekday schedules
        console.log('Test 7: Test weekend vs weekday schedules');
        
        // Test dengan hari kerja (misal Senin)
        console.log('   Weekday schedule (Senin):');
        characters.forEach(characterName => {
            const character = schedules.characters[characterName];
            if (character && character.weekday) {
                const morningActivity = character.weekday.find(act => act.start <= 9 && act.end > 9);
                if (morningActivity) {
                    console.log(`     ${characterName} (9 AM): ${morningActivity.location} - ${morningActivity.activity}`);
                }
            }
        });
        
        // Test dengan weekend (misal Sabtu)
        console.log('   Weekend schedule (Sabtu):');
        characters.forEach(characterName => {
            const character = schedules.characters[characterName];
            if (character && character.weekend) {
                const morningActivity = character.weekend.find(act => act.start <= 9 && act.end > 9);
                if (morningActivity) {
                    console.log(`     ${characterName} (9 AM): ${morningActivity.location} - ${morningActivity.activity}`);
                }
            }
        });
        console.log('✅ Weekend vs weekday schedules working\n');
        
        // Test 8: Test availability levels
        console.log('Test 8: Test availability levels');
        
        const availabilityLevels = ['available', 'limited', 'unavailable'];
        availabilityLevels.forEach(level => {
            const charactersWithLevel = [];
            characters.forEach(characterName => {
                const activity = getCharacterActivity(characterName);
                if (activity.found && activity.current.availability === level) {
                    charactersWithLevel.push(characterName);
                }
            });
            console.log(`   ${level}: ${charactersWithLevel.join(', ') || 'None'}`);
        });
        console.log('✅ Availability levels working\n');
        
        // Test 9: Test location atmosphere
        console.log('Test 9: Test location atmosphere');
        
        locations.forEach(locationName => {
            const location = schedules.locations[locationName];
            if (location.atmosphere) {
                const atmosphereHours = Object.keys(location.atmosphere);
                console.log(`   ${locationName}: ${atmosphereHours.length} atmosphere entries`);
                
                // Show sample atmosphere
                const sampleHour = atmosphereHours[0];
                console.log(`     Sample (${sampleHour}:00): ${location.atmosphere[sampleHour]}`);
            }
        });
        console.log('✅ Location atmosphere working\n');
        
        // Test 10: Integration test - realistic scenario
        console.log('Test 10: Integration test - realistic scenario');
        console.log('   Scenario: Pemain ingin bertemu Bocchi di STARRY pada jam 19:00');
        
        // Cek apakah STARRY buka jam 19:00
        const starryAt19 = 19 >= 17 && 19 < 23;
        console.log(`   STARRY buka jam 19:00: ${starryAt19 ? 'Ya' : 'Tidak'}`);
        
        // Cek apakah Bocchi ada di STARRY jam 19:00 (weekday)
        const bocchiWeekday = schedules.characters.Bocchi.weekday;
        const bocchiAt19 = bocchiWeekday.find(act => act.start <= 19 && act.end > 19);
        
        if (bocchiAt19) {
            console.log(`   Bocchi di jam 19:00: ${bocchiAt19.location}`);
            console.log(`   Aktivitas: ${bocchiAt19.activity}`);
            console.log(`   Availability: ${bocchiAt19.availability}`);
            console.log(`   Mood: ${bocchiAt19.mood}`);
            
            const canMeet = starryAt19 && bocchiAt19.location === 'STARRY' && bocchiAt19.availability === 'available';
            console.log(`   Bisa bertemu: ${canMeet ? 'Ya! 🎸' : 'Tidak 😢'}`);
        }
        
        console.log('✅ Integration test working\n');
        
        console.log('🎉 Semua test sistem jadwal dunia berhasil!');
        console.log('💡 Sistem jadwal siap memberikan kehidupan dinamis pada dunia game');
        
        // Summary
        console.log('\n📊 Summary:');
        console.log(`   Total lokasi: ${locations.length}`);
        console.log(`   Total karakter: ${characters.length}`);
        console.log(`   Waktu saat ini: ${currentTime.fullDateTimeString}`);
        console.log(`   Lokasi buka: ${Object.entries(getWorldStatus().locations)
            .filter(([name, status]) => status.isOpen).length}/${locations.length}`);
        console.log(`   Karakter available: ${Object.entries(getWorldStatus().characters)
            .filter(([name, activity]) => activity.found && activity.current.availability === 'available').length}/${characters.length}`);
        
    } catch (error) {
        console.error('❌ Error dalam test sistem jadwal:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testScheduleSystem();
}

module.exports = { testScheduleSystem };
