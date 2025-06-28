// Test komprehensif untuk jadwal Seika dengan simulasi waktu yang tepat
const { schedules } = require('./game_logic/schedules');

async function testSeikaComprehensive() {
    console.log('👩‍💼 Test komprehensif jadwal Seika Ijichi...\n');
    
    try {
        // Test 1: Analisis jadwal weekday Seika
        console.log('Test 1: Analisis jadwal weekday Seika');
        
        const seikaWeekday = schedules.characters.Seika.weekday;
        
        console.log('   Jadwal Weekday (Senin-Jumat):');
        seikaWeekday.forEach(entry => {
            const availability = typeof entry.availability === 'object' ? 
                `${entry.availability.type} (${entry.availability.difficulty})` : 
                entry.availability;
            
            console.log(`     ${entry.start.toString().padStart(2, '0')}:00-${entry.end.toString().padStart(2, '0')}:00`);
            console.log(`       📍 ${entry.location}`);
            console.log(`       🎯 ${entry.activity}`);
            console.log(`       😤 Mood: ${entry.mood}`);
            console.log(`       🚪 Availability: ${availability}`);
            
            if (typeof entry.availability === 'object' && entry.availability.reason) {
                console.log(`       💭 "${entry.availability.reason}"`);
            }
            console.log('');
        });
        
        console.log('✅ Weekday schedule analyzed\n');
        
        // Test 2: Analisis jadwal weekend Seika
        console.log('Test 2: Analisis jadwal weekend Seika');
        
        const seikaWeekend = schedules.characters.Seika.weekend;
        
        console.log('   Jadwal Weekend (Sabtu-Minggu):');
        seikaWeekend.forEach(entry => {
            const availability = typeof entry.availability === 'object' ? 
                `${entry.availability.type} (${entry.availability.difficulty})` : 
                entry.availability;
            
            console.log(`     ${entry.start.toString().padStart(2, '0')}:00-${entry.end.toString().padStart(2, '0')}:00`);
            console.log(`       📍 ${entry.location}`);
            console.log(`       🎯 ${entry.activity}`);
            console.log(`       😤 Mood: ${entry.mood}`);
            console.log(`       🚪 Availability: ${availability}`);
            
            if (typeof entry.availability === 'object' && entry.availability.reason) {
                console.log(`       💭 "${entry.availability.reason}"`);
            }
            console.log('');
        });
        
        console.log('✅ Weekend schedule analyzed\n');
        
        // Test 3: Analisis kepribadian Seika dari jadwal
        console.log('Test 3: Analisis kepribadian Seika dari jadwal');
        
        const allEntries = [...seikaWeekday, ...seikaWeekend];
        
        // Analisis lokasi
        const locations = [...new Set(allEntries.map(e => e.location))];
        console.log(`   Lokasi yang dikunjungi: ${locations.length}`);
        locations.forEach(loc => {
            const count = allEntries.filter(e => e.location === loc).length;
            console.log(`     - ${loc}: ${count} slot waktu`);
        });
        
        // Analisis mood
        const moods = [...new Set(allEntries.map(e => e.mood))];
        console.log(`\n   Variasi mood: ${moods.length} mood berbeda`);
        moods.forEach(mood => {
            const count = allEntries.filter(e => e.mood === mood).length;
            console.log(`     - ${mood}: ${count}x`);
        });
        
        // Analisis availability
        const availabilities = allEntries.map(e => 
            typeof e.availability === 'object' ? 
                `${e.availability.type}_${e.availability.difficulty}` : 
                e.availability
        );
        const uniqueAvailabilities = [...new Set(availabilities)];
        console.log(`\n   Tingkat availability: ${uniqueAvailabilities.length} level`);
        uniqueAvailabilities.forEach(avail => {
            const count = availabilities.filter(a => a === avail).length;
            console.log(`     - ${avail}: ${count}x`);
        });
        
        console.log('✅ Personality analysis completed\n');
        
        // Test 4: Waktu terbaik untuk berinteraksi dengan Seika
        console.log('Test 4: Waktu terbaik untuk berinteraksi dengan Seika');
        
        // Ranking berdasarkan difficulty
        const difficultyRanking = {
            'unavailable': 0,
            'limited_very_hard': 1,
            'available_very_hard': 2,
            'limited_hard': 3,
            'available_hard': 4,
            'limited_medium': 5,
            'available_medium': 6,
            'limited_easy': 7,
            'available_easy': 8
        };
        
        const weekdayOpportunities = seikaWeekday.map(entry => {
            const availability = typeof entry.availability === 'object' ? 
                `${entry.availability.type}_${entry.availability.difficulty}` : 
                entry.availability;
            
            return {
                time: `${entry.start}:00-${entry.end}:00`,
                day: 'weekday',
                location: entry.location,
                activity: entry.activity,
                mood: entry.mood,
                availability,
                score: difficultyRanking[availability] || 0
            };
        });
        
        const weekendOpportunities = seikaWeekend.map(entry => {
            const availability = typeof entry.availability === 'object' ? 
                `${entry.availability.type}_${entry.availability.difficulty}` : 
                entry.availability;
            
            return {
                time: `${entry.start}:00-${entry.end}:00`,
                day: 'weekend',
                location: entry.location,
                activity: entry.activity,
                mood: entry.mood,
                availability,
                score: difficultyRanking[availability] || 0
            };
        });
        
        const allOpportunities = [...weekdayOpportunities, ...weekendOpportunities]
            .sort((a, b) => b.score - a.score);
        
        console.log('   Ranking waktu terbaik untuk berinteraksi:');
        allOpportunities.forEach((opp, index) => {
            const rank = index + 1;
            const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📍';
            
            console.log(`     ${emoji} #${rank}: ${opp.day} ${opp.time}`);
            console.log(`       Location: ${opp.location}`);
            console.log(`       Mood: ${opp.mood}`);
            console.log(`       Availability: ${opp.availability}`);
            console.log(`       Score: ${opp.score}/8`);
            console.log('');
        });
        
        console.log('✅ Interaction opportunities ranked\n');
        
        // Test 5: Strategi untuk berinteraksi dengan Seika
        console.log('Test 5: Strategi untuk berinteraksi dengan Seika');
        
        const bestOpportunity = allOpportunities[0];
        const worstOpportunity = allOpportunities[allOpportunities.length - 1];
        
        console.log('   🎯 STRATEGI OPTIMAL:');
        console.log(`     Waktu terbaik: ${bestOpportunity.day} ${bestOpportunity.time}`);
        console.log(`     Lokasi: ${bestOpportunity.location}`);
        console.log(`     Mood Seika: ${bestOpportunity.mood}`);
        console.log(`     Tingkat kesulitan: ${bestOpportunity.availability}`);
        
        console.log('\n   ⚠️ WAKTU TERBURUK:');
        console.log(`     Waktu terburuk: ${worstOpportunity.day} ${worstOpportunity.time}`);
        console.log(`     Lokasi: ${worstOpportunity.location}`);
        console.log(`     Mood Seika: ${worstOpportunity.mood}`);
        console.log(`     Tingkat kesulitan: ${worstOpportunity.availability}`);
        
        // Tips berdasarkan analisis
        console.log('\n   💡 TIPS INTERAKSI:');
        
        const easyTimes = allOpportunities.filter(opp => opp.availability.includes('easy'));
        const availableTimes = allOpportunities.filter(opp => opp.availability.includes('available'));
        const starryTimes = allOpportunities.filter(opp => opp.location === 'STARRY');
        
        if (easyTimes.length > 0) {
            console.log(`     - Waktu "easy": ${easyTimes.map(t => `${t.day} ${t.time}`).join(', ')}`);
        }
        
        if (availableTimes.length > 0) {
            console.log(`     - Waktu "available": ${availableTimes.length} slot waktu`);
        }
        
        if (starryTimes.length > 0) {
            console.log(`     - Di STARRY: ${starryTimes.length} slot waktu (lokasi utama)`);
        }
        
        console.log('     - Hindari saat mood "high_stress" atau "intimidating"');
        console.log('     - Terbaik saat mood "relieved" atau "calm_after_storm"');
        console.log('     - Bersikap profesional dan jangan buang-buang waktu');
        console.log('     - Jika membahas Nijika, kemungkinan respons lebih baik');
        
        console.log('✅ Strategy analysis completed\n');
        
        // Test 6: Perbandingan dengan karakter lain
        console.log('Test 6: Perbandingan dengan karakter lain');
        
        const otherCharacters = ['Bocchi', 'Nijika', 'Ryo', 'Kita', 'Kikuri'];
        
        console.log('   Tingkat kesulitan interaksi (rata-rata):');
        
        otherCharacters.forEach(charName => {
            const char = schedules.characters[charName];
            if (char) {
                const allEntries = [...char.weekday, ...char.weekend];
                const availableCount = allEntries.filter(e => 
                    e.availability === 'available' || 
                    (typeof e.availability === 'object' && e.availability.type === 'available')
                ).length;
                
                const totalSlots = allEntries.length;
                const availabilityPercentage = Math.round((availableCount / totalSlots) * 100);
                
                console.log(`     ${charName}: ${availabilityPercentage}% available`);
            }
        });
        
        // Seika
        const seikaAllEntries = [...seikaWeekday, ...seikaWeekend];
        const seikaAvailableCount = seikaAllEntries.filter(e => 
            e.availability === 'available' || 
            (typeof e.availability === 'object' && e.availability.type === 'available')
        ).length;
        const seikaAvailabilityPercentage = Math.round((seikaAvailableCount / seikaAllEntries.length) * 100);
        
        console.log(`     Seika: ${seikaAvailabilityPercentage}% available (tapi dengan difficulty!)`);
        
        console.log('\n   📊 Kesimpulan:');
        console.log(`     - Seika adalah karakter paling menantang untuk didekati`);
        console.log(`     - Memiliki sistem difficulty yang unik`);
        console.log(`     - Membutuhkan strategi dan timing yang tepat`);
        console.log(`     - Reward interaksi kemungkinan lebih besar karena kesulitannya`);
        
        console.log('✅ Character comparison completed\n');
        
        console.log('🎉 Test komprehensif Seika berhasil!');
        console.log('💡 Seika Ijichi adalah karakter yang sangat kompleks dan menantang');
        
        // Final summary
        console.log('\n📊 FINAL SUMMARY:');
        console.log(`   Total schedule slots: ${seikaAllEntries.length}`);
        console.log(`   Unique locations: ${locations.length}`);
        console.log(`   Unique moods: ${moods.length}`);
        console.log(`   Difficulty levels: ${uniqueAvailabilities.length}`);
        console.log(`   Best interaction time: ${bestOpportunity.day} ${bestOpportunity.time}`);
        console.log(`   Character archetype: Tsundere Professional Manager`);
        console.log(`   Gameplay role: High-difficulty, high-reward character`);
        console.log(`   Narrative importance: Key to STARRY and Nijika storylines`);
        
    } catch (error) {
        console.error('❌ Error dalam test komprehensif Seika:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testSeikaComprehensive();
}

module.exports = { testSeikaComprehensive };
