// Jadwal Dunia Game - Kehidupan Dinamis Karakter dan Lokasi
// Menggunakan sistem waktu JST untuk sinkronisasi real-time

const schedules = {
    // Jadwal operasional lokasi (jam buka/tutup dalam JST)
    locations: {
        "STARRY": {
            open: 17,  // 5 sore JST
            close: 23, // 11 malam JST
            description: "Live house tempat Kessoku Band berlatih",
            type: "entertainment",
            atmosphere: {
                17: "Persiapan sound check",
                18: "Mulai ramai dengan band-band",
                20: "Peak time - banyak pertunjukan",
                22: "Mulai sepi, cleaning up",
                23: "Tutup"
            }
        },
        "SMA Shuka": {
            open: 8,   // 8 pagi JST
            close: 16, // 4 sore JST
            description: "Sekolah menengah atas tempat Bocchi dan teman-teman belajar",
            type: "school",
            atmosphere: {
                8: "Pelajaran pagi dimulai",
                10: "Istirahat pertama",
                12: "Makan siang",
                14: "Pelajaran siang",
                15: "Kegiatan ekstrakurikuler",
                16: "Pulang sekolah"
            }
        },
        "Shimokitazawa": {
            open: 6,   // 6 pagi JST
            close: 24, // 24 jam (selalu buka)
            description: "Distrik musik dan budaya yang hidup 24 jam",
            type: "district",
            atmosphere: {
                6: "Pagi yang tenang, toko-toko mulai buka",
                9: "Aktivitas pagi, kafe mulai ramai",
                12: "Lunch time, restoran ramai",
                15: "Sore yang santai, street musicians",
                18: "Golden hour, suasana romantis",
                21: "Malam yang hidup, bar dan live house",
                24: "Midnight vibes, hanya beberapa tempat buka"
            }
        },
        "Taman Yoyogi": {
            open: 5,   // 5 pagi JST
            close: 20, // 8 malam JST
            description: "Taman besar untuk olahraga dan relaksasi",
            type: "park",
            atmosphere: {
                5: "Jogging pagi, udara segar",
                8: "Aktivitas pagi, tai chi",
                12: "Piknik siang, keluarga berkumpul",
                15: "Sore santai, anak-anak bermain",
                18: "Golden hour, pasangan berjalan",
                20: "Tutup untuk umum"
            }
        },
        "Rumah Bocchi": {
            open: 0,   // Selalu tersedia
            close: 24,
            description: "Rumah keluarga Gotoh, tempat Bocchi berlatih",
            type: "residence",
            atmosphere: {
                0: "Malam yang tenang",
                6: "Pagi keluarga",
                8: "Sarapan bersama",
                12: "Makan siang",
                18: "Makan malam keluarga",
                22: "Waktu santai keluarga"
            }
        }
    },

    // Jadwal aktivitas karakter berdasarkan hari (weekday vs weekend)
    characters: {
        "Bocchi": {
            weekday: [
                { 
                    start: 0, end: 6, 
                    location: "Rumah Bocchi", 
                    activity: "Tidur (Bermimpi tentang pertunjukan)",
                    mood: "peaceful",
                    availability: "unavailable"
                },
                { 
                    start: 6, end: 7, 
                    location: "Rumah Bocchi", 
                    activity: "Bangun pagi, sarapan dengan keluarga",
                    mood: "sleepy",
                    availability: "limited"
                },
                { 
                    start: 8, end: 15, 
                    location: "SMA Shuka", 
                    activity: "Belajar (Sering melamun tentang musik)",
                    mood: "anxious",
                    availability: "unavailable"
                },
                { 
                    start: 15, end: 16, 
                    location: "SMA Shuka", 
                    activity: "Pulang sekolah (Kadang ngobrol dengan Kita)",
                    mood: "relieved",
                    availability: "limited"
                },
                { 
                    start: 17, end: 21, 
                    location: "STARRY", 
                    activity: "Latihan band dengan Kessoku Band",
                    mood: "focused",
                    availability: "available"
                },
                { 
                    start: 22, end: 24, 
                    location: "Rumah Bocchi", 
                    activity: "Latihan gitar sendiri, posting video",
                    mood: "creative",
                    availability: "available"
                }
            ],
            weekend: [
                { 
                    start: 0, end: 8, 
                    location: "Rumah Bocchi", 
                    activity: "Tidur lebih lama (Weekend vibes)",
                    mood: "peaceful",
                    availability: "unavailable"
                },
                { 
                    start: 9, end: 12, 
                    location: "Rumah Bocchi", 
                    activity: "Latihan gitar intensif",
                    mood: "motivated",
                    availability: "limited"
                },
                { 
                    start: 13, end: 16, 
                    location: "Shimokitazawa", 
                    activity: "Jalan-jalan, cari inspirasi musik",
                    mood: "curious",
                    availability: "available"
                },
                { 
                    start: 17, end: 22, 
                    location: "STARRY", 
                    activity: "Latihan band atau nonton pertunjukan",
                    mood: "excited",
                    availability: "available"
                },
                { 
                    start: 23, end: 24, 
                    location: "Rumah Bocchi", 
                    activity: "Refleksi hari, tulis lirik lagu",
                    mood: "contemplative",
                    availability: "available"
                }
            ]
        },

        "Nijika": {
            weekday: [
                { 
                    start: 0, end: 6, 
                    location: "Rumah Nijika", 
                    activity: "Tidur (Mimpi tentang kesuksesan band)",
                    mood: "peaceful",
                    availability: "unavailable"
                },
                { 
                    start: 6, end: 7, 
                    location: "Rumah Nijika", 
                    activity: "Bangun pagi, olahraga ringan",
                    mood: "energetic",
                    availability: "limited"
                },
                { 
                    start: 8, end: 15, 
                    location: "SMA Shuka", 
                    activity: "Belajar (Aktif di kelas, populer)",
                    mood: "cheerful",
                    availability: "limited"
                },
                { 
                    start: 16, end: 17, 
                    location: "Shimokitazawa", 
                    activity: "Persiapan ke STARRY, beli snack",
                    mood: "excited",
                    availability: "available"
                },
                { 
                    start: 17, end: 21, 
                    location: "STARRY", 
                    activity: "Latihan drum, koordinasi band",
                    mood: "focused",
                    availability: "available"
                },
                { 
                    start: 22, end: 24, 
                    location: "Rumah Nijika", 
                    activity: "Belajar, chat dengan teman band",
                    mood: "social",
                    availability: "available"
                }
            ],
            weekend: [
                { 
                    start: 0, end: 7, 
                    location: "Rumah Nijika", 
                    activity: "Tidur nyenyak",
                    mood: "peaceful",
                    availability: "unavailable"
                },
                { 
                    start: 8, end: 11, 
                    location: "Taman Yoyogi", 
                    activity: "Jogging pagi, olahraga",
                    mood: "energetic",
                    availability: "limited"
                },
                { 
                    start: 12, end: 15, 
                    location: "Shimokitazawa", 
                    activity: "Hang out, eksplorasi musik baru",
                    mood: "curious",
                    availability: "available"
                },
                { 
                    start: 16, end: 22, 
                    location: "STARRY", 
                    activity: "Latihan intensif atau pertunjukan",
                    mood: "passionate",
                    availability: "available"
                },
                { 
                    start: 23, end: 24, 
                    location: "Rumah Nijika", 
                    activity: "Planning untuk band, social media",
                    mood: "productive",
                    availability: "available"
                }
            ]
        },

        "Ryo": {
            weekday: [
                { 
                    start: 0, end: 8, 
                    location: "Rumah Ryo", 
                    activity: "Tidur (Bermimpi tentang bass lines)",
                    mood: "peaceful",
                    availability: "unavailable"
                },
                { 
                    start: 9, end: 15, 
                    location: "SMA Shuka", 
                    activity: "Sekolah (Sering tidur di kelas)",
                    mood: "sleepy",
                    availability: "unavailable"
                },
                { 
                    start: 16, end: 17, 
                    location: "Shimokitazawa", 
                    activity: "Cari makan murah, window shopping",
                    mood: "practical",
                    availability: "limited"
                },
                { 
                    start: 17, end: 21, 
                    location: "STARRY", 
                    activity: "Latihan bass dengan serius",
                    mood: "focused",
                    availability: "available"
                },
                { 
                    start: 22, end: 24, 
                    location: "Rumah Ryo", 
                    activity: "Latihan bass, dengar musik",
                    mood: "contemplative",
                    availability: "limited"
                }
            ],
            weekend: [
                { 
                    start: 0, end: 10, 
                    location: "Rumah Ryo", 
                    activity: "Tidur panjang (Weekend mood)",
                    mood: "peaceful",
                    availability: "unavailable"
                },
                { 
                    start: 11, end: 14, 
                    location: "Rumah Ryo", 
                    activity: "Latihan bass, eksperimen sound",
                    mood: "creative",
                    availability: "limited"
                },
                { 
                    start: 15, end: 17, 
                    location: "Shimokitazawa", 
                    activity: "Hunting alat musik bekas",
                    mood: "excited",
                    availability: "available"
                },
                { 
                    start: 18, end: 23, 
                    location: "STARRY", 
                    activity: "Latihan band atau nonton live",
                    mood: "passionate",
                    availability: "available"
                },
                { 
                    start: 24, end: 24, 
                    location: "Rumah Ryo", 
                    activity: "Late night bass session",
                    mood: "focused",
                    availability: "limited"
                }
            ]
        },

        "Kita": {
            weekday: [
                { 
                    start: 0, end: 6, 
                    location: "Rumah Kita", 
                    activity: "Tidur (Mimpi tentang performance)",
                    mood: "peaceful",
                    availability: "unavailable"
                },
                { 
                    start: 7, end: 8, 
                    location: "Rumah Kita", 
                    activity: "Persiapan pagi, vocal warm-up",
                    mood: "energetic",
                    availability: "limited"
                },
                { 
                    start: 8, end: 15, 
                    location: "SMA Shuka", 
                    activity: "Sekolah (Aktif, ceria, populer)",
                    mood: "cheerful",
                    availability: "limited"
                },
                { 
                    start: 16, end: 17, 
                    location: "Shimokitazawa", 
                    activity: "Shopping, cari aksesoris musik",
                    mood: "excited",
                    availability: "available"
                },
                { 
                    start: 17, end: 21, 
                    location: "STARRY", 
                    activity: "Latihan vokal dan gitar",
                    mood: "passionate",
                    availability: "available"
                },
                { 
                    start: 22, end: 24, 
                    location: "Rumah Kita", 
                    activity: "Latihan vokal, social media",
                    mood: "social",
                    availability: "available"
                }
            ],
            weekend: [
                { 
                    start: 0, end: 7, 
                    location: "Rumah Kita", 
                    activity: "Tidur beauty sleep",
                    mood: "peaceful",
                    availability: "unavailable"
                },
                { 
                    start: 8, end: 12, 
                    location: "Shimokitazawa", 
                    activity: "Brunch, foto-foto aesthetic",
                    mood: "cheerful",
                    availability: "available"
                },
                { 
                    start: 13, end: 16, 
                    location: "Taman Yoyogi", 
                    activity: "Busking, latihan perform di publik",
                    mood: "confident",
                    availability: "available"
                },
                { 
                    start: 17, end: 22, 
                    location: "STARRY", 
                    activity: "Latihan intensif atau show",
                    mood: "excited",
                    availability: "available"
                },
                { 
                    start: 23, end: 24, 
                    location: "Rumah Kita", 
                    activity: "Skincare, planning outfit besok",
                    mood: "relaxed",
                    availability: "available"
                }
            ]
        },

        "Kikuri": {
            weekday: [
                {
                    start: 0, end: 15,
                    location: "Tidak Diketahui",
                    activity: "Tidur (Lokasi misterius)",
                    mood: "mysterious",
                    availability: "unavailable"
                },
                {
                    start: 16, end: 19,
                    location: "Shimokitazawa",
                    activity: "Berkeliaran, cari inspirasi",
                    mood: "wandering",
                    availability: "limited"
                },
                {
                    start: 20, end: 24,
                    location: "STARRY",
                    activity: "Nongkrong, kadang jam session",
                    mood: "cool",
                    availability: "available"
                }
            ],
            weekend: [
                {
                    start: 0, end: 12,
                    location: "Tidak Diketahui",
                    activity: "Tidur panjang (Weekend vibes)",
                    mood: "mysterious",
                    availability: "unavailable"
                },
                {
                    start: 13, end: 18,
                    location: "Shimokitazawa",
                    activity: "Eksplorasi, hunting musik vintage",
                    mood: "curious",
                    availability: "available"
                },
                {
                    start: 19, end: 24,
                    location: "STARRY",
                    activity: "Live session, mentoring junior",
                    mood: "wise",
                    availability: "available"
                }
            ]
        },

        "Seika": {
            weekday: [
                {
                    start: 0, end: 9,
                    location: "Apartemen di atas STARRY",
                    activity: "Tidur (Mungkin juga mengerjakan pembukuan sampai larut)",
                    mood: "tired",
                    availability: "unavailable"
                },
                {
                    start: 10, end: 12,
                    location: "Apartemen di atas STARRY",
                    activity: "Mengurus administrasi STARRY, membalas email band",
                    mood: "focused",
                    availability: { type: "limited", difficulty: "very_hard", reason: "Sangat sibuk dengan pekerjaan manajerial." }
                },
                {
                    start: 12, end: 13,
                    location: "Apartemen di atas STARRY",
                    activity: "Makan siang sederhana sambil bekerja",
                    mood: "neutral",
                    availability: "unavailable"
                },
                {
                    start: 14, end: 17,
                    location: "STARRY",
                    activity: "Persiapan teknis untuk pertunjukan malam: sound system, lighting, dll.",
                    mood: "professional",
                    availability: { type: "limited", difficulty: "hard", reason: "Fokus pada persiapan teknis, tidak suka diganggu." }
                },
                {
                    start: 17, end: 23,
                    location: "STARRY",
                    activity: "Mengelola jalannya live house, mengawasi pertunjukan",
                    mood: "intimidating",
                    availability: { type: "available", difficulty: "hard", reason: "Bisa ditemui, tapi selalu terlihat sibuk dan waspada." }
                },
                {
                    start: 23, end: 24,
                    location: "STARRY",
                    activity: "Menutup live house, bersih-bersih, bicara dengan Nijika",
                    mood: "calm_after_storm",
                    availability: { type: "limited", difficulty: "medium", reason: "Momen langka untuk bicara lebih santai, tapi hanya jika Nijika ada." }
                }
            ],
            weekend: [
                {
                    start: 0, end: 10,
                    location: "Apartemen di atas STARRY",
                    activity: "Istirahat setelah malam yang panjang",
                    mood: "exhausted",
                    availability: "unavailable"
                },
                {
                    start: 11, end: 15,
                    location: "Shimokitazawa",
                    activity: "Belanja kebutuhan STARRY atau mencari band baru untuk direkrut",
                    mood: "scouting",
                    availability: { type: "limited", difficulty: "very_hard", reason: "Bergerak cepat dan punya tujuan, sulit untuk diajak bicara." }
                },
                {
                    start: 16, end: 23,
                    location: "STARRY",
                    activity: "Mengelola pertunjukan akhir pekan yang ramai",
                    mood: "high_stress",
                    availability: { type: "available", difficulty: "very_hard", reason: "Sangat sibuk dan tidak punya waktu untuk obrolan basa-basi." }
                },
                {
                    start: 23, end: 24,
                    location: "Apartemen di atas STARRY",
                    activity: "Menghitung pemasukan, akhirnya bisa santai sedikit",
                    mood: "relieved",
                    availability: { type: "limited", difficulty: "easy", reason: "Momen terbaik untuk bicara, jika Anda berhasil mendapat akses ke apartemennya." }
                }
            ]
        }
    },

    // Metadata untuk sistem jadwal
    metadata: {
        timezone: "Asia/Tokyo",
        resetHour: 5, // Reset harian jam 5 pagi JST
        version: "1.0.0",
        lastUpdated: "2025-06-28"
    }
};

// Helper functions untuk menggunakan jadwal
const { getCurrentJST } = require('../utils/time');

/**
 * Mendapatkan status lokasi saat ini (buka/tutup)
 * @param {string} locationName - Nama lokasi
 * @returns {Object} Status lokasi dengan informasi detail
 */
function getLocationStatus(locationName) {
    const location = schedules.locations[locationName];
    if (!location) {
        return {
            isOpen: false,
            status: 'unknown',
            message: 'Lokasi tidak ditemukan',
            nextChange: null
        };
    }

    const currentTime = getCurrentJST();
    const currentHour = currentTime.hour;

    // Cek apakah lokasi buka 24 jam
    if (location.open === 0 && location.close === 24) {
        return {
            isOpen: true,
            status: 'open_24h',
            message: 'Buka 24 jam',
            atmosphere: location.atmosphere[currentHour] || 'Suasana normal',
            nextChange: null
        };
    }

    // Logika buka/tutup normal
    const isOpen = currentHour >= location.open && currentHour < location.close;

    // Hitung waktu perubahan status berikutnya
    let nextChangeHour;
    let nextStatus;

    if (isOpen) {
        nextChangeHour = location.close;
        nextStatus = 'close';
    } else {
        if (currentHour < location.open) {
            nextChangeHour = location.open;
            nextStatus = 'open';
        } else {
            // Sudah lewat jam tutup, buka besok
            nextChangeHour = location.open + 24;
            nextStatus = 'open';
        }
    }

    const hoursUntilChange = nextChangeHour - currentHour;

    return {
        isOpen,
        status: isOpen ? 'open' : 'closed',
        message: isOpen ?
            `Buka sampai ${location.close}:00` :
            `Tutup, buka jam ${location.open}:00`,
        atmosphere: isOpen ? (location.atmosphere[currentHour] || 'Suasana normal') : 'Tutup',
        nextChange: {
            hour: nextChangeHour % 24,
            status: nextStatus,
            hoursUntil: hoursUntilChange
        },
        description: location.description,
        type: location.type
    };
}

/**
 * Mendapatkan aktivitas karakter saat ini
 * @param {string} characterName - Nama karakter
 * @returns {Object} Aktivitas karakter dengan detail
 */
function getCharacterActivity(characterName) {
    const character = schedules.characters[characterName];
    if (!character) {
        return {
            found: false,
            message: 'Karakter tidak ditemukan',
            activity: null
        };
    }

    const currentTime = getCurrentJST();
    const currentHour = currentTime.hour;
    const isWeekend = currentTime.dayOfWeek === 6 || currentTime.dayOfWeek === 7; // Sabtu atau Minggu

    const schedule = isWeekend ? character.weekend : character.weekday;

    // Cari aktivitas yang sesuai dengan jam saat ini
    const currentActivity = schedule.find(activity =>
        currentHour >= activity.start && currentHour < activity.end
    );

    if (!currentActivity) {
        return {
            found: false,
            message: 'Tidak ada aktivitas yang terdefinisi untuk jam ini',
            activity: null
        };
    }

    // Cari aktivitas berikutnya
    const nextActivity = schedule.find(activity =>
        activity.start > currentHour
    ) || schedule[0]; // Jika tidak ada, ambil aktivitas pertama (besok)

    return {
        found: true,
        character: characterName,
        current: {
            ...currentActivity,
            timeRemaining: currentActivity.end - currentHour
        },
        next: nextActivity,
        schedule: isWeekend ? 'weekend' : 'weekday',
        dayType: isWeekend ? 'Akhir Pekan' : 'Hari Kerja'
    };
}

/**
 * Mendapatkan semua karakter yang tersedia untuk interaksi di lokasi tertentu
 * @param {string} locationName - Nama lokasi
 * @returns {Array} Daftar karakter yang ada di lokasi tersebut
 */
function getCharactersAtLocation(locationName) {
    const charactersAtLocation = [];

    Object.keys(schedules.characters).forEach(characterName => {
        const activity = getCharacterActivity(characterName);
        if (activity.found && activity.current.location === locationName) {
            charactersAtLocation.push({
                name: characterName,
                activity: activity.current.activity,
                mood: activity.current.mood,
                availability: activity.current.availability,
                timeRemaining: activity.current.timeRemaining
            });
        }
    });

    return charactersAtLocation;
}

/**
 * Mendapatkan ringkasan dunia saat ini
 * @returns {Object} Status lengkap dunia game
 */
function getWorldStatus() {
    const currentTime = getCurrentJST();
    const locationStatuses = {};
    const characterActivities = {};

    // Status semua lokasi
    Object.keys(schedules.locations).forEach(locationName => {
        locationStatuses[locationName] = getLocationStatus(locationName);
    });

    // Aktivitas semua karakter
    Object.keys(schedules.characters).forEach(characterName => {
        characterActivities[characterName] = getCharacterActivity(characterName);
    });

    return {
        currentTime: {
            jst: currentTime.fullDateTimeString,
            period: currentTime.period,
            dayName: currentTime.dayName,
            isWeekend: currentTime.dayOfWeek === 6 || currentTime.dayOfWeek === 7
        },
        locations: locationStatuses,
        characters: characterActivities,
        metadata: schedules.metadata
    };
}

module.exports = {
    schedules,
    getLocationStatus,
    getCharacterActivity,
    getCharactersAtLocation,
    getWorldStatus
};
