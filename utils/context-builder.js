// Modul untuk membangun konteks waktu yang kaya dan immersive untuk LLM prompts
// Mengintegrasikan waktu JST, jadwal dunia, cuaca, dan atmosphere

const { getCurrentJST } = require('./time');
const { getLocationStatus, getCharacterActivity, getCharactersAtLocation } = require('../game_logic/schedules');
const { getWeatherInfo, getWeatherEffects, getWeatherMood } = require('../game_logic/weather');

/**
 * Membangun konteks situasi yang sangat detail untuk LLM
 * @param {Object} player - Data pemain
 * @param {string} action - Jenis aksi yang dilakukan
 * @param {string} target - Target aksi (karakter atau lokasi)
 * @param {Object} validationContext - Konteks dari validator
 * @returns {string} Konteks situasi yang detail
 */
function buildDetailedSituationContext(player, action, target, validationContext = null) {
    const currentTime = getCurrentJST();
    const weatherInfo = getWeatherInfo(player.current_weather);
    
    // Base context dengan waktu presisi
    let context = `KONTEKS SITUASI:
Waktu saat ini adalah ${currentTime.dayName}, ${currentTime.timeString} JST (${currentTime.period}).
Tanggal: ${currentTime.dateString}
Cuaca: ${player.current_weather}
Mood Cuaca: ${getWeatherMood(weatherInfo)}`;

    // Tambahkan deskripsi atmosphere berdasarkan waktu
    context += `\n${getTimeAtmosphereDescription(currentTime)}`;

    // Tambahkan konteks lokasi dan karakter berdasarkan aksi
    if (action === 'say' || action === 'bicara') {
        context += buildSayActionContext(target, currentTime, validationContext);
    } else {
        context += buildActActionContext(action, currentTime, validationContext);
    }

    // Tambahkan konteks cuaca yang mempengaruhi suasana
    context += buildWeatherAtmosphereContext(weatherInfo, currentTime);

    // Tambahkan konteks aktivitas dunia sekitar
    context += buildWorldActivityContext(currentTime);

    return context;
}

/**
 * Mendapatkan deskripsi atmosphere berdasarkan waktu
 * @param {Object} currentTime - Waktu JST saat ini
 * @returns {string} Deskripsi atmosphere
 */
function getTimeAtmosphereDescription(currentTime) {
    const hour = currentTime.hour;
    const period = currentTime.period;
    const dayName = currentTime.dayName;
    const isWeekend = currentTime.dayOfWeek === 6 || currentTime.dayOfWeek === 7;

    let atmosphere = `\nSuasana ${period}`;

    if (period === 'pagi') {
        if (hour >= 5 && hour < 7) {
            atmosphere += ` yang sangat awal: Udara segar, jalanan sepi, hanya terdengar suara burung dan angin sepoi-sepoi. Langit mulai terang dengan warna keemasan.`;
        } else if (hour >= 7 && hour < 9) {
            atmosphere += ` yang sibuk: ${isWeekend ? 'Suasana weekend yang santai, beberapa orang jogging di taman' : 'Jalanan mulai ramai dengan pelajar dan pekerja bergegas ke sekolah/kantor'}. Aroma kopi dari kafe-kafe mulai tercium.`;
        } else {
            atmosphere += `: ${isWeekend ? 'Weekend yang tenang, toko-toko mulai buka, suasana santai' : 'Aktivitas pagi yang normal, sekolah dan kantor sudah mulai'}. Matahari bersinar cerah di langit biru.`;
        }
    } else if (period === 'siang') {
        if (hour >= 12 && hour < 14) {
            atmosphere += ` yang ramai: Jam makan siang! Restoran dan kafe penuh dengan orang. ${isWeekend ? 'Keluarga-keluarga piknik di taman' : 'Pekerja dan pelajar istirahat makan siang'}. Matahari tepat di atas kepala.`;
        } else {
            atmosphere += `: ${isWeekend ? 'Siang weekend yang santai, perfect untuk jalan-jalan' : 'Aktivitas siang yang normal, semua orang sibuk dengan rutinitas'}. Cahaya matahari hangat menerangi jalanan.`;
        }
    } else if (period === 'sore') {
        if (hour >= 17 && hour < 18) {
            atmosphere += ` yang golden: Golden hour! Cahaya matahari keemasan menciptakan suasana romantis. ${isWeekend ? 'Pasangan-pasangan berjalan santai' : 'Orang-orang mulai pulang kerja/sekolah'}. Langit berwarna jingga keemasan.`;
        } else if (hour >= 18 && hour < 19) {
            atmosphere += ` yang hidup: Senja mulai tiba, lampu-lampu jalan mulai menyala. ${isWeekend ? 'Suasana weekend evening yang chill' : 'Rush hour, jalanan ramai dengan commuters'}. Langit berubah dari jingga ke ungu.`;
        } else {
            atmosphere += `: Sore yang tenang menuju malam. Lampu-lampu kota mulai berkilauan. ${isWeekend ? 'Weekend evening vibes' : 'Orang-orang mulai santai setelah hari yang panjang'}. Angin sore yang sejuk.`;
        }
    } else { // malam
        if (hour >= 21 && hour < 23) {
            atmosphere += ` yang hidup: Prime time malam! ${isWeekend ? 'Weekend night life, bar dan live house ramai' : 'Malam yang aktif, banyak orang hang out'}. Neon lights menerangi jalanan dengan warna-warni.`;
        } else if (hour >= 23 || hour < 2) {
            atmosphere += ` yang tenang: Late night vibes. Hanya beberapa tempat yang masih buka. Jalanan mulai sepi, hanya terdengar suara angin dan sesekali kendaraan lewat. Lampu jalan menciptakan bayangan panjang.`;
        } else {
            atmosphere += ` yang sangat tenang: Dini hari yang hening. Dunia seperti tidur, hanya terdengar suara alam. Udara dingin dan segar. Langit gelap bertabur bintang.`;
        }
    }

    return atmosphere;
}

/**
 * Membangun konteks untuk aksi bicara/say
 * @param {string} target - Karakter target
 * @param {Object} currentTime - Waktu saat ini
 * @param {Object} validationContext - Konteks validasi
 * @returns {string} Konteks aksi bicara
 */
function buildSayActionContext(target, currentTime, validationContext) {
    if (!target || !validationContext) {
        return '\nPemain melakukan interaksi umum tanpa target spesifik.';
    }

    let context = `\n\nKONTEKS INTERAKSI DENGAN ${target.toUpperCase()}:`;
    context += `\nLokasi ${target}: ${validationContext.location}`;
    context += `\nAktivitas saat ini: ${validationContext.activity}`;
    context += `\nMood ${target}: ${validationContext.mood}`;
    context += `\nAvailability: ${validationContext.availability}`;

    // Tambahkan deskripsi lokasi berdasarkan waktu
    const locationStatus = getLocationStatus(validationContext.location);
    if (locationStatus.atmosphere) {
        context += `\nSuasana di ${validationContext.location}: ${locationStatus.atmosphere}`;
    }

    // Tambahkan konteks availability
    if (validationContext.availability === 'limited') {
        context += `\n⚠️ CATATAN: ${target} sedang sibuk dengan ${validationContext.activity.toLowerCase()}, jadi interaksi akan terbatas dan singkat.`;
    } else if (validationContext.availability === 'available') {
        context += `\n✅ ${target} tersedia untuk interaksi penuh dan bisa diajak bicara dengan santai.`;
    }

    // Tambahkan karakter lain di lokasi yang sama
    const charactersAtLocation = getCharactersAtLocation(validationContext.location);
    const otherCharacters = charactersAtLocation.filter(char => char.name !== target);
    if (otherCharacters.length > 0) {
        context += `\nKarakter lain di ${validationContext.location}: ${otherCharacters.map(char => `${char.name} (${char.activity})`).join(', ')}`;
    }

    return context;
}

/**
 * Membangun konteks untuk aksi terstruktur
 * @param {string} action - Jenis aksi
 * @param {Object} currentTime - Waktu saat ini
 * @param {Object} validationContext - Konteks validasi
 * @returns {string} Konteks aksi terstruktur
 */
function buildActActionContext(action, currentTime, validationContext) {
    let context = `\n\nKONTEKS AKTIVITAS:`;
    
    // Konteks berdasarkan jenis aksi
    switch (action) {
        case 'latihan_gitar':
            context += `\nAktivitas: Latihan gitar sendiri`;
            context += `\nLokasi: Rumah atau tempat latihan pribadi`;
            if (validationContext?.optimality) {
                context += `\nOptimalitas waktu: ${validationContext.optimality}`;
                context += `\nBonus kreativitas: ${validationContext.creativityBonus}`;
            }
            context += `\nSuasana: Tenang dan fokus, perfect untuk berlatih musik`;
            break;

        case 'bekerja_starry':
            context += `\nAktivitas: Bekerja part-time di live house STARRY`;
            context += `\nLokasi: STARRY Live House`;
            if (validationContext?.atmosphere) {
                context += `\nSuasana STARRY: ${validationContext.atmosphere}`;
            }
            if (validationContext?.charactersPresent && validationContext.charactersPresent.length > 0) {
                context += `\nKarakter di STARRY: ${validationContext.charactersPresent.map(char => `${char.name} (${char.activity})`).join(', ')}`;
            }
            break;

        case 'menulis_lagu':
            context += `\nAktivitas: Menulis lirik atau komposisi lagu`;
            context += `\nLokasi: Tempat yang tenang dan inspiratif`;
            if (validationContext?.optimality) {
                context += `\nOptimalitas waktu: ${validationContext.optimality}`;
                context += `\nTingkat kreativitas: ${validationContext.creativityBonus}`;
            }
            break;

        case 'jalan_shimokitazawa':
            context += `\nAktivitas: Jalan-jalan santai di Shimokitazawa`;
            context += `\nLokasi: Distrik Shimokitazawa`;
            if (validationContext?.atmosphere) {
                context += `\nSuasana Shimokitazawa: ${validationContext.atmosphere}`;
            }
            if (validationContext?.charactersPresent && validationContext.charactersPresent.length > 0) {
                context += `\nKemungkinan bertemu: ${validationContext.charactersPresent.map(char => char.name).join(', ')}`;
            }
            break;

        default:
            context += `\nAktivitas: ${action}`;
            break;
    }

    return context;
}

/**
 * Membangun konteks atmosphere cuaca
 * @param {Object} weatherInfo - Informasi cuaca
 * @param {Object} currentTime - Waktu saat ini
 * @returns {string} Konteks atmosphere cuaca
 */
function buildWeatherAtmosphereContext(weatherInfo, currentTime) {
    if (!weatherInfo) {
        return '';
    }

    let context = `\n\nEFEK CUACA PADA SUASANA:`;
    
    const weatherEffects = getWeatherEffects(weatherInfo);
    const weatherMood = getWeatherMood(weatherInfo);

    // Deskripsi visual cuaca berdasarkan waktu
    const weatherName = weatherInfo.name || 'Tidak diketahui';
    const period = currentTime.period;

    switch (weatherName) {
        case 'Cerah':
            context += `\nCuaca cerah ${period}: ${period === 'pagi' ? 'Sinar matahari pagi yang hangat, langit biru jernih' : period === 'siang' ? 'Matahari bersinar terang, bayangan tajam di jalanan' : period === 'sore' ? 'Golden hour yang indah, cahaya keemasan' : 'Malam yang jernih, bintang terlihat jelas'}`;
            break;
        case 'Hujan Ringan':
            context += `\nHujan ringan ${period}: ${period === 'pagi' ? 'Gerimis pagi yang segar, aroma tanah basah' : period === 'siang' ? 'Hujan ringan menyejukkan udara siang' : period === 'sore' ? 'Gerimis sore yang romantis, lampu jalan memantul di aspal basah' : 'Hujan ringan malam, suara tetesan air yang menenangkan'}`;
            break;
        case 'Hujan Deras':
            context += `\nHujan deras ${period}: Suara hujan yang keras, orang-orang berlindung di bawah atap toko. Jalanan basah dan berkilau memantulkan cahaya lampu.`;
            break;
        case 'Mendung':
            context += `\nCuaca mendung ${period}: Langit tertutup awan gelap, suasana agak suram tapi cozy. Angin sepoi-sepoi membawa aroma hujan.`;
            break;
        default:
            context += `\nCuaca ${weatherName.toLowerCase()} ${period}: Suasana yang unik sesuai dengan kondisi cuaca saat ini.`;
    }

    // Efek mood cuaca
    context += `\nMood yang tercipta: ${weatherMood} - ${getMoodDescription(weatherMood)}`;

    return context;
}

/**
 * Membangun konteks aktivitas dunia sekitar
 * @param {Object} currentTime - Waktu saat ini
 * @returns {string} Konteks aktivitas dunia
 */
function buildWorldActivityContext(currentTime) {
    const isWeekend = currentTime.dayOfWeek === 6 || currentTime.dayOfWeek === 7;
    const hour = currentTime.hour;
    
    let context = `\n\nAKTIVITAS DUNIA SEKITAR:`;

    // Aktivitas berdasarkan waktu dan hari
    if (isWeekend) {
        if (hour >= 8 && hour < 12) {
            context += `\nWeekend pagi: Orang-orang jogging di taman, kafe-kafe mulai ramai dengan brunch crowd, suasana santai dan rileks.`;
        } else if (hour >= 12 && hour < 17) {
            context += `\nWeekend siang: Keluarga-keluarga piknik, pasangan berkencan, shopping district ramai, street musicians bermain.`;
        } else if (hour >= 17 && hour < 22) {
            context += `\nWeekend sore-malam: Live house mulai ramai, bar dan restoran penuh, nightlife mulai hidup.`;
        } else {
            context += `\nWeekend malam-dini hari: Suasana tenang, hanya beberapa tempat hiburan yang masih buka.`;
        }
    } else {
        if (hour >= 7 && hour < 9) {
            context += `\nPagi hari kerja: Rush hour pagi, pelajar dan pekerja bergegas, stasiun kereta ramai, kafe-kafe sibuk melayani takeaway coffee.`;
        } else if (hour >= 9 && hour < 17) {
            context += `\nJam kerja/sekolah: Jalanan relatif sepi, hanya ibu-ibu belanja dan orang tua jalan-jalan, suasana tenang di residential area.`;
        } else if (hour >= 17 && hour < 19) {
            context += `\nRush hour sore: Orang-orang pulang kerja/sekolah, stasiun ramai, jalanan macet, after-work crowd mulai muncul.`;
        } else if (hour >= 19 && hour < 22) {
            context += `\nMalam weekday: Orang-orang dinner, hang out setelah kerja, live house mulai ramai, suasana lebih santai.`;
        } else {
            context += `\nMalam-dini hari weekday: Suasana tenang, kebanyakan orang sudah di rumah, hanya night owl yang masih aktif.`;
        }
    }

    return context;
}

/**
 * Mendapatkan deskripsi mood yang detail
 * @param {string} mood - Mood cuaca
 * @returns {string} Deskripsi mood
 */
function getMoodDescription(mood) {
    const moodDescriptions = {
        'cheerful': 'Suasana ceria dan optimis, energi positif mengalir',
        'pleasant': 'Suasana nyaman dan menyenangkan, perfect untuk aktivitas santai',
        'melancholic': 'Suasana melankolis dan introspektif, cocok untuk refleksi',
        'romantic': 'Suasana romantis dan dreamy, perfect untuk momen spesial',
        'intimate': 'Suasana intim dan hangat, cocok untuk bonding',
        'dramatic': 'Suasana dramatis dan intens, penuh emosi',
        'cozy': 'Suasana hangat dan nyaman, seperti pelukan',
        'intense': 'Suasana intens dan mendebarkan, adrenaline tinggi'
    };
    
    return moodDescriptions[mood] || 'Suasana normal dan seimbang';
}

module.exports = {
    buildDetailedSituationContext,
    getTimeAtmosphereDescription,
    buildSayActionContext,
    buildActActionContext,
    buildWeatherAtmosphereContext,
    buildWorldActivityContext,
    getMoodDescription
};
