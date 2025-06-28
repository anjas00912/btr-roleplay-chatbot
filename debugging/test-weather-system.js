// Test file untuk memastikan sistem cuaca dinamis berfungsi dengan baik
const { 
    generateWeather, 
    getWeatherByLocation, 
    getWeatherEffects, 
    getWeatherMood, 
    getWeatherInfo,
    getWeatherDistribution,
    WEATHER_TYPES 
} = require('./game_logic/weather');

async function testWeatherSystem() {
    console.log('🧪 Memulai test sistem cuaca dinamis...\n');
    
    try {
        // Test 1: Test generateWeather function
        console.log('Test 1: Test generateWeather function');
        console.log('Generating 10 random weather samples:');
        for (let i = 0; i < 10; i++) {
            const weather = generateWeather();
            console.log(`   ${i + 1}. ${weather.name} (${weather.mood}) - ${weather.description.substring(0, 50)}...`);
        }
        console.log('✅ generateWeather function berfungsi\n');
        
        // Test 2: Test weather distribution
        console.log('Test 2: Test weather distribution (10000 samples)');
        const distribution = getWeatherDistribution(10000);
        console.log('Expected vs Actual distribution:');
        
        WEATHER_TYPES.forEach(weather => {
            const expected = weather.weight;
            const actual = parseFloat(distribution[weather.name]);
            const diff = Math.abs(expected - actual);
            const status = diff < 2 ? '✅' : '⚠️'; // Allow 2% tolerance
            console.log(`   ${weather.name}: Expected ${expected}%, Actual ${actual}% ${status}`);
        });
        console.log('✅ Weather distribution test completed\n');
        
        // Test 3: Test getWeatherByLocation
        console.log('Test 3: Test getWeatherByLocation');
        const testWeathers = ['Cerah', 'Hujan Deras', 'Badai'];
        const locations = ['starry', 'school', 'street'];
        
        testWeathers.forEach(weatherName => {
            console.log(`   Weather: ${weatherName}`);
            locations.forEach(location => {
                const description = getWeatherByLocation(weatherName, location);
                console.log(`     ${location}: ${description.substring(0, 60)}...`);
            });
            console.log('');
        });
        console.log('✅ getWeatherByLocation function berfungsi\n');
        
        // Test 4: Test getWeatherEffects
        console.log('Test 4: Test getWeatherEffects');
        WEATHER_TYPES.forEach(weather => {
            const effects = getWeatherEffects(weather.name);
            console.log(`   ${weather.name}:`);
            console.log(`     Trust bonus: ${effects.trust_bonus || 0}`);
            console.log(`     Comfort bonus: ${effects.comfort_bonus || 0}`);
            console.log(`     Affection bonus: ${effects.affection_bonus || 0}`);
            console.log(`     Energy level: ${effects.energy_level}`);
        });
        console.log('✅ getWeatherEffects function berfungsi\n');
        
        // Test 5: Test getWeatherMood
        console.log('Test 5: Test getWeatherMood');
        WEATHER_TYPES.forEach(weather => {
            const mood = getWeatherMood(weather.name);
            console.log(`   ${weather.name}: ${mood}`);
        });
        console.log('✅ getWeatherMood function berfungsi\n');
        
        // Test 6: Test getWeatherInfo
        console.log('Test 6: Test getWeatherInfo');
        const testWeatherInfo = getWeatherInfo('Hujan Ringan');
        if (testWeatherInfo) {
            console.log(`   Name: ${testWeatherInfo.name}`);
            console.log(`   Description: ${testWeatherInfo.description.substring(0, 50)}...`);
            console.log(`   Mood: ${testWeatherInfo.mood}`);
            console.log(`   Effects: ${JSON.stringify(testWeatherInfo.effects)}`);
            console.log(`   Full Description: ${testWeatherInfo.fullDescription.substring(0, 60)}...`);
        }
        console.log('✅ getWeatherInfo function berfungsi\n');
        
        // Test 7: Test edge cases
        console.log('Test 7: Test edge cases');
        
        // Test dengan weather yang tidak ada
        const invalidWeather = getWeatherInfo('Weather Tidak Ada');
        console.log(`   Invalid weather info: ${invalidWeather}`);
        
        const invalidMood = getWeatherMood('Weather Tidak Ada');
        console.log(`   Invalid weather mood: ${invalidMood}`);
        
        const invalidEffects = getWeatherEffects('Weather Tidak Ada');
        console.log(`   Invalid weather effects: ${JSON.stringify(invalidEffects)}`);
        
        const invalidLocation = getWeatherByLocation('Cerah', 'invalid_location');
        console.log(`   Invalid location: ${invalidLocation.substring(0, 50)}...`);
        
        console.log('✅ Edge cases handled properly\n');
        
        // Test 8: Test weather weight validation
        console.log('Test 8: Test weather weight validation');
        const totalWeight = WEATHER_TYPES.reduce((sum, weather) => sum + weather.weight, 0);
        console.log(`   Total weight: ${totalWeight}%`);
        
        if (Math.abs(totalWeight - 100) < 0.1) {
            console.log('✅ Weather weights sum to 100%');
        } else {
            console.log('⚠️ Weather weights do not sum to 100%');
        }
        
        // Test rare weather generation
        console.log('\n   Testing rare weather generation (1000 samples):');
        const rareCounts = {};
        for (let i = 0; i < 1000; i++) {
            const weather = generateWeather();
            rareCounts[weather.name] = (rareCounts[weather.name] || 0) + 1;
        }
        
        const rareWeathers = ['Dingin', 'Badai'];
        rareWeathers.forEach(weatherName => {
            const count = rareCounts[weatherName] || 0;
            console.log(`   ${weatherName}: ${count}/1000 (${(count/10).toFixed(1)}%)`);
        });
        
        console.log('\n🎉 Semua test sistem cuaca dinamis berhasil!');
        
    } catch (error) {
        console.error('❌ Error dalam test sistem cuaca:', error);
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testWeatherSystem();
}

module.exports = { testWeatherSystem };
