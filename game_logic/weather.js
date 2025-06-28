/**
 * Sistem Cuaca Dinamis untuk Bocchi Game
 * Menghasilkan cuaca dengan bobot yang logis dan deskripsi yang immersive
 */

// Definisi cuaca dengan bobot, mood, dan efek pada gameplay
const WEATHER_TYPES = [
    {
        name: "Cerah",
        weight: 35, // 35% chance
        description: "Langit biru cerah tanpa awan. Sinar matahari hangat menyinari jalanan Shimokitazawa.",
        mood: "cheerful",
        effects: {
            trust_bonus: 0.1,
            comfort_bonus: 0.1,
            energy_level: "high"
        },
        locations: {
            starry: "Cahaya matahari masuk melalui jendela STARRY, menciptakan suasana hangat di live house.",
            school: "Halaman sekolah dipenuhi siswa yang menikmati cuaca cerah.",
            street: "Jalanan Shimokitazawa ramai dengan orang-orang yang berjalan santai."
        }
    },
    {
        name: "Cerah Berawan",
        weight: 25, // 25% chance
        description: "Langit biru dengan awan putih yang bergerak perlahan. Cuaca yang sempurna untuk aktivitas outdoor.",
        mood: "pleasant",
        effects: {
            trust_bonus: 0.05,
            comfort_bonus: 0.05,
            energy_level: "normal"
        },
        locations: {
            starry: "Awan-awan putih terlihat dari jendela STARRY, memberikan pencahayaan yang lembut.",
            school: "Angin sepoi-sepoi membuat suasana sekolah terasa nyaman.",
            street: "Bayangan awan sesekali menutupi jalanan, memberikan kesejukan."
        }
    },
    {
        name: "Mendung",
        weight: 15, // 15% chance
        description: "Awan gelap menutupi langit. Udara terasa lembab dan ada kemungkinan hujan.",
        mood: "melancholic",
        effects: {
            affection_bonus: 0.1,
            comfort_bonus: -0.05,
            energy_level: "low"
        },
        locations: {
            starry: "Suasana STARRY terasa lebih intim dengan langit yang mendung di luar.",
            school: "Siswa-siswa mulai membawa payung, bersiap untuk kemungkinan hujan.",
            street: "Jalanan terasa sepi, orang-orang bergegas mencari tempat berlindung."
        }
    },
    {
        name: "Hujan Ringan",
        weight: 12, // 12% chance
        description: "Gerimis halus membasahi jalanan. Suara tetesan air menciptakan suasana romantis dan tenang.",
        mood: "romantic",
        effects: {
            affection_bonus: 0.15,
            comfort_bonus: 0.1,
            energy_level: "calm"
        },
        locations: {
            starry: "Suara hujan ringan di atap STARRY menciptakan background musik alami yang menenangkan.",
            school: "Siswa-siswa berkumpul di koridor, menikmati suara hujan yang menenangkan.",
            street: "Jalanan basah memantulkan lampu, menciptakan pemandangan yang indah."
        }
    },
    {
        name: "Hujan Deras",
        weight: 8, // 8% chance
        description: "Hujan lebat mengguyur kota. Orang-orang berlindung di dalam, menciptakan momen intim.",
        mood: "intimate",
        effects: {
            affection_bonus: 0.2,
            trust_bonus: 0.1,
            energy_level: "cozy"
        },
        locations: {
            starry: "Suara hujan deras membuat STARRY terasa seperti tempat perlindungan yang hangat.",
            school: "Semua siswa berkumpul di dalam, menciptakan suasana yang akrab.",
            street: "Jalanan sepi, hanya terlihat orang-orang yang berlari mencari tempat berteduh."
        }
    },
    {
        name: "Berangin",
        weight: 3, // 3% chance
        description: "Angin kencang bertiup, membuat daun-daun berguguran. Suasana dramatis dan energik.",
        mood: "dramatic",
        effects: {
            trust_bonus: 0.05,
            comfort_bonus: -0.1,
            energy_level: "dynamic"
        },
        locations: {
            starry: "Angin kencang membuat pintu dan jendela STARRY bergetar, menambah intensitas musik.",
            school: "Daun-daun berguguran di halaman sekolah, siswa-siswa memegang erat tas mereka.",
            street: "Angin kencang membuat rambut dan pakaian berkibar, menciptakan momen sinematik."
        }
    },
    {
        name: "Dingin",
        weight: 1.5, // 1.5% chance
        description: "Udara dingin menusuk tulang. Orang-orang saling mendekat untuk mencari kehangatan.",
        mood: "cozy",
        effects: {
            comfort_bonus: 0.15,
            affection_bonus: 0.1,
            energy_level: "low"
        },
        locations: {
            starry: "STARRY terasa hangat dan nyaman, kontras dengan udara dingin di luar.",
            school: "Siswa-siswa berkumpul di ruang kelas yang hangat, berbagi kehangatan.",
            street: "Orang-orang berjalan cepat, napas mereka terlihat seperti uap di udara dingin."
        }
    },
    {
        name: "Badai",
        weight: 0.5, // 0.5% chance - very rare
        description: "Badai petir menggelegar di langit. Kilat menyambar dan hujan sangat deras. Suasana yang intens dan mendebarkan.",
        mood: "intense",
        effects: {
            affection_bonus: 0.25,
            trust_bonus: 0.15,
            energy_level: "high"
        },
        locations: {
            starry: "Kilat menerangi STARRY sesekali, menciptakan suasana konser yang epik.",
            school: "Semua aktivitas outdoor dibatalkan, siswa-siswa berkumpul di dalam dengan perasaan was-was.",
            street: "Jalanan benar-benar sepi, hanya terdengar suara petir dan hujan yang sangat deras."
        }
    }
];

/**
 * Fungsi utama untuk menghasilkan cuaca secara acak dengan bobot yang logis
 * @returns {Object} - Object cuaca dengan semua informasi
 */
function generateWeather() {
    // Hitung total weight untuk normalisasi
    const totalWeight = WEATHER_TYPES.reduce((sum, weather) => sum + weather.weight, 0);
    
    // Generate random number antara 0 dan total weight
    const random = Math.random() * totalWeight;
    
    // Pilih cuaca berdasarkan weight
    let currentWeight = 0;
    for (const weather of WEATHER_TYPES) {
        currentWeight += weather.weight;
        if (random <= currentWeight) {
            return {
                name: weather.name,
                description: weather.description,
                mood: weather.mood,
                effects: weather.effects,
                locations: weather.locations,
                fullDescription: `${weather.name} - ${weather.description}`
            };
        }
    }
    
    // Fallback ke cuaca pertama jika ada error
    const fallback = WEATHER_TYPES[0];
    return {
        name: fallback.name,
        description: fallback.description,
        mood: fallback.mood,
        effects: fallback.effects,
        locations: fallback.locations,
        fullDescription: `${fallback.name} - ${fallback.description}`
    };
}

/**
 * Fungsi untuk mendapatkan deskripsi cuaca berdasarkan lokasi
 * @param {string} weatherName - Nama cuaca
 * @param {string} location - Lokasi (starry, school, street)
 * @returns {string} - Deskripsi cuaca untuk lokasi spesifik
 */
function getWeatherByLocation(weatherName, location = 'street') {
    const weather = WEATHER_TYPES.find(w => w.name === weatherName);
    if (!weather) {
        return "Cuaca tidak diketahui.";
    }
    
    return weather.locations[location] || weather.description;
}

/**
 * Fungsi untuk mendapatkan efek cuaca pada gameplay
 * @param {string} weatherName - Nama cuaca
 * @returns {Object} - Efek cuaca pada stats
 */
function getWeatherEffects(weatherName) {
    const weather = WEATHER_TYPES.find(w => w.name === weatherName);
    return weather ? weather.effects : {};
}

/**
 * Fungsi untuk mendapatkan mood cuaca
 * @param {string} weatherName - Nama cuaca
 * @returns {string} - Mood cuaca
 */
function getWeatherMood(weatherName) {
    const weather = WEATHER_TYPES.find(w => w.name === weatherName);
    return weather ? weather.mood : 'neutral';
}

/**
 * Fungsi untuk mendapatkan semua informasi cuaca
 * @param {string} weatherName - Nama cuaca
 * @returns {Object} - Semua informasi cuaca
 */
function getWeatherInfo(weatherName) {
    const weather = WEATHER_TYPES.find(w => w.name === weatherName);
    if (!weather) {
        return null;
    }
    
    return {
        name: weather.name,
        description: weather.description,
        mood: weather.mood,
        effects: weather.effects,
        locations: weather.locations,
        fullDescription: `${weather.name} - ${weather.description}`
    };
}

/**
 * Fungsi untuk mendapatkan statistik distribusi cuaca (untuk debugging)
 * @param {number} iterations - Jumlah iterasi untuk test
 * @returns {Object} - Statistik distribusi cuaca
 */
function getWeatherDistribution(iterations = 10000) {
    const distribution = {};
    
    for (let i = 0; i < iterations; i++) {
        const weather = generateWeather();
        distribution[weather.name] = (distribution[weather.name] || 0) + 1;
    }
    
    // Convert to percentages
    for (const weatherName in distribution) {
        distribution[weatherName] = ((distribution[weatherName] / iterations) * 100).toFixed(2) + '%';
    }
    
    return distribution;
}

module.exports = {
    generateWeather,
    getWeatherByLocation,
    getWeatherEffects,
    getWeatherMood,
    getWeatherInfo,
    getWeatherDistribution,
    WEATHER_TYPES
};
