// Modul Validasi untuk Core Interaction Logic
// Memastikan semua aksi realistis berdasarkan jadwal dunia dan waktu JST

const { getCurrentJST } = require('./time');
const { getCharacterActivity, getLocationStatus, getCharactersAtLocation } = require('../game_logic/schedules');

/**
 * Fungsi utama untuk memvalidasi apakah aksi terhadap target memungkinkan
 * @param {string} action - Jenis aksi ('bicara', 'latihan_gitar', 'bekerja_starry', dll)
 * @param {string} target - Target aksi (nama karakter atau lokasi)
 * @param {string} userId - ID user yang melakukan aksi
 * @returns {Object} { possible: boolean, reason?: string, context?: Object }
 */
function isActionPossible(action, target, userId) {
    try {
        const currentTime = getCurrentJST();
        
        // Validasi berdasarkan jenis aksi
        switch (action) {
            case 'bicara':
            case 'say':
                return validateSayAction(target, currentTime);
                
            case 'latihan_gitar':
                return validateGuitarPractice(currentTime);
                
            case 'bekerja_starry':
                return validateStarryWork(currentTime);
                
            case 'menulis_lagu':
                return validateSongwriting(currentTime);
                
            case 'jalan_shimokitazawa':
                return validateShimokitazawaWalk(currentTime);
                
            default:
                return {
                    possible: false,
                    reason: `Aksi '${action}' tidak dikenali oleh sistem.`,
                    context: { action, target, currentTime: currentTime.fullDateTimeString }
                };
        }
    } catch (error) {
        console.error('[VALIDATOR] Error in isActionPossible:', error);
        return {
            possible: false,
            reason: 'Terjadi kesalahan sistem saat memvalidasi aksi.',
            context: { error: error.message }
        };
    }
}

/**
 * Validasi untuk aksi bicara/say dengan karakter
 * @param {string} target - Nama karakter target
 * @param {Object} currentTime - Waktu JST saat ini
 * @returns {Object} Hasil validasi
 */
function validateSayAction(target, currentTime) {
    // Daftar karakter yang valid
    const validCharacters = ['Bocchi', 'Nijika', 'Ryo', 'Kita', 'Kikuri', 'Seika'];

    // Cek apakah target adalah karakter yang valid
    if (!validCharacters.includes(target)) {
        return {
            possible: false,
            reason: `Karakter '${target}' tidak ditemukan. Karakter yang tersedia: ${validCharacters.join(', ')}.`,
            context: { target, validCharacters, currentTime: currentTime.fullDateTimeString }
        };
    }
    
    // Dapatkan aktivitas karakter saat ini
    const characterActivity = getCharacterActivity(target);
    
    if (!characterActivity.found) {
        return {
            possible: false,
            reason: `${target} tidak memiliki jadwal yang terdefinisi untuk saat ini.`,
            context: { target, currentTime: currentTime.fullDateTimeString }
        };
    }
    
    const activity = characterActivity.current;

    // Handle complex availability object (untuk Seika) atau simple string
    const availability = typeof activity.availability === 'object' ? activity.availability : { type: activity.availability };
    const availabilityType = availability.type || activity.availability;

    // Cek availability karakter
    switch (availabilityType) {
        case 'unavailable':
            return {
                possible: false,
                reason: `${target} sedang ${activity.activity.toLowerCase()} dan tidak bisa diganggu saat ini.`,
                context: {
                    target,
                    location: activity.location,
                    activity: activity.activity,
                    mood: activity.mood,
                    timeRemaining: activity.timeRemaining,
                    currentTime: currentTime.fullDateTimeString
                }
            };

        case 'limited':
            // Untuk Seika, cek difficulty level
            if (availability.difficulty) {
                const difficultyMessages = {
                    'very_hard': `${target} sangat sulit didekati saat ini. ${availability.reason}`,
                    'hard': `${target} terlihat sibuk dan tidak mudah diajak bicara. ${availability.reason}`,
                    'medium': `${target} bisa diajak bicara tapi dengan hati-hati. ${availability.reason}`,
                    'easy': `${target} terlihat lebih santai dan bisa diajak bicara. ${availability.reason}`
                };

                return {
                    possible: true,
                    reason: difficultyMessages[availability.difficulty] || `${target} sedang ${activity.activity.toLowerCase()} tapi masih bisa diajak bicara sebentar.`,
                    context: {
                        target,
                        location: activity.location,
                        activity: activity.activity,
                        mood: activity.mood,
                        availability: 'limited',
                        difficulty: availability.difficulty,
                        timeRemaining: activity.timeRemaining,
                        currentTime: currentTime.fullDateTimeString
                    }
                };
            } else {
                // Availability limited biasa
                return {
                    possible: true,
                    reason: `${target} sedang ${activity.activity.toLowerCase()} tapi masih bisa diajak bicara sebentar.`,
                    context: {
                        target,
                        location: activity.location,
                        activity: activity.activity,
                        mood: activity.mood,
                        availability: 'limited',
                        timeRemaining: activity.timeRemaining,
                        currentTime: currentTime.fullDateTimeString
                    }
                };
            }

        case 'available':
            // Untuk Seika, cek difficulty level
            if (availability.difficulty) {
                const difficultyMessages = {
                    'very_hard': `${target} tersedia tapi sangat sibuk dan mudah tersinggung. ${availability.reason}`,
                    'hard': `${target} tersedia tapi terlihat waspada dan profesional. ${availability.reason}`,
                    'medium': `${target} tersedia dan bisa diajak bicara dengan normal. ${availability.reason}`,
                    'easy': `${target} tersedia dan terlihat lebih santai dari biasanya. ${availability.reason}`
                };

                return {
                    possible: true,
                    reason: difficultyMessages[availability.difficulty] || `${target} sedang ${activity.activity.toLowerCase()} dan tersedia untuk diajak bicara.`,
                    context: {
                        target,
                        location: activity.location,
                        activity: activity.activity,
                        mood: activity.mood,
                        availability: 'available',
                        difficulty: availability.difficulty,
                        timeRemaining: activity.timeRemaining,
                        currentTime: currentTime.fullDateTimeString
                    }
                };
            } else {
                // Availability available biasa
                return {
                    possible: true,
                    reason: `${target} sedang ${activity.activity.toLowerCase()} dan tersedia untuk diajak bicara.`,
                    context: {
                        target,
                        location: activity.location,
                        activity: activity.activity,
                        mood: activity.mood,
                        availability: 'available',
                        timeRemaining: activity.timeRemaining,
                        currentTime: currentTime.fullDateTimeString
                    }
                };
            }

        default:
            return {
                possible: false,
                reason: `Status availability ${target} tidak dikenali.`,
                context: { target, availability: activity.availability }
            };
    }
}

/**
 * Validasi untuk aksi latihan gitar
 * @param {Object} currentTime - Waktu JST saat ini
 * @returns {Object} Hasil validasi
 */
function validateGuitarPractice(currentTime) {
    const hour = currentTime.hour;
    
    // Cek apakah waktu cocok untuk latihan gitar (tidak terlalu pagi/malam)
    if (hour >= 22 || hour < 6) {
        return {
            possible: false,
            reason: `Terlalu ${hour >= 22 ? 'malam' : 'pagi'} untuk latihan gitar (${currentTime.timeString}). Tetangga bisa terganggu.`,
            context: {
                currentTime: currentTime.fullDateTimeString,
                period: currentTime.period,
                suggestedTime: 'Coba lagi antara jam 06:00-22:00'
            }
        };
    }
    
    // Cek apakah di rumah atau tempat yang cocok
    // Untuk sekarang, anggap selalu bisa latihan di rumah pada jam yang tepat
    return {
        possible: true,
        reason: `Waktu yang tepat untuk latihan gitar (${currentTime.timeString}).`,
        context: {
            currentTime: currentTime.fullDateTimeString,
            period: currentTime.period,
            location: 'Rumah atau tempat latihan'
        }
    };
}

/**
 * Validasi untuk aksi bekerja di STARRY
 * @param {Object} currentTime - Waktu JST saat ini
 * @returns {Object} Hasil validasi
 */
function validateStarryWork(currentTime) {
    // Cek status STARRY
    const starryStatus = getLocationStatus('STARRY');
    
    if (!starryStatus.isOpen) {
        return {
            possible: false,
            reason: `STARRY sedang tutup saat ini. ${starryStatus.message}`,
            context: {
                currentTime: currentTime.fullDateTimeString,
                starryStatus: starryStatus,
                nextOpen: starryStatus.nextChange
            }
        };
    }
    
    // Cek apakah ada karakter lain di STARRY (untuk interaksi yang lebih hidup)
    const charactersAtStarry = getCharactersAtLocation('STARRY');
    
    return {
        possible: true,
        reason: `STARRY sedang buka dan siap untuk bekerja. ${starryStatus.atmosphere}`,
        context: {
            currentTime: currentTime.fullDateTimeString,
            starryStatus: starryStatus,
            charactersPresent: charactersAtStarry,
            atmosphere: starryStatus.atmosphere
        }
    };
}

/**
 * Validasi untuk aksi menulis lagu
 * @param {Object} currentTime - Waktu JST saat ini
 * @returns {Object} Hasil validasi
 */
function validateSongwriting(currentTime) {
    const hour = currentTime.hour;
    
    // Menulis lagu bisa dilakukan kapan saja, tapi ada waktu yang lebih optimal
    let optimality = 'normal';
    let reason = `Waktu yang baik untuk menulis lagu (${currentTime.timeString}).`;
    
    // Waktu optimal untuk kreativitas
    if ((hour >= 20 && hour <= 23) || (hour >= 6 && hour <= 9)) {
        optimality = 'optimal';
        reason = `Waktu yang sangat baik untuk menulis lagu (${currentTime.timeString}). ${hour >= 20 ? 'Suasana malam yang inspiratif' : 'Pagi yang segar dan kreatif'}.`;
    }
    
    // Waktu kurang optimal (siang hari yang ramai)
    if (hour >= 12 && hour <= 16) {
        optimality = 'suboptimal';
        reason = `Bisa menulis lagu tapi mungkin kurang fokus (${currentTime.timeString}). Siang hari cenderung ramai dan kurang inspiratif.`;
    }
    
    return {
        possible: true,
        reason: reason,
        context: {
            currentTime: currentTime.fullDateTimeString,
            period: currentTime.period,
            optimality: optimality,
            creativityBonus: optimality === 'optimal' ? 'high' : optimality === 'normal' ? 'medium' : 'low'
        }
    };
}

/**
 * Validasi untuk aksi jalan-jalan di Shimokitazawa
 * @param {Object} currentTime - Waktu JST saat ini
 * @returns {Object} Hasil validasi
 */
function validateShimokitazawaWalk(currentTime) {
    // Cek status Shimokitazawa
    const shimokitazawaStatus = getLocationStatus('Shimokitazawa');
    
    if (!shimokitazawaStatus.isOpen) {
        return {
            possible: false,
            reason: `Shimokitazawa sedang sepi/tutup saat ini. ${shimokitazawaStatus.message}`,
            context: {
                currentTime: currentTime.fullDateTimeString,
                locationStatus: shimokitazawaStatus
            }
        };
    }
    
    // Cek cuaca (jika hujan, mungkin kurang nyaman)
    // Untuk sekarang, anggap selalu bisa jalan-jalan
    
    // Cek karakter lain yang mungkin ada di Shimokitazawa
    const charactersAtShimokitazawa = getCharactersAtLocation('Shimokitazawa');
    
    let encounterInfo = '';
    if (charactersAtShimokitazawa.length > 0) {
        const characterNames = charactersAtShimokitazawa.map(char => char.name).join(', ');
        encounterInfo = ` Kamu mungkin akan bertemu dengan ${characterNames} di sana.`;
    }
    
    return {
        possible: true,
        reason: `Waktu yang bagus untuk jalan-jalan di Shimokitazawa. ${shimokitazawaStatus.atmosphere}${encounterInfo}`,
        context: {
            currentTime: currentTime.fullDateTimeString,
            locationStatus: shimokitazawaStatus,
            charactersPresent: charactersAtShimokitazawa,
            atmosphere: shimokitazawaStatus.atmosphere
        }
    };
}

/**
 * Fungsi helper untuk mendapatkan saran waktu yang lebih baik
 * @param {string} action - Jenis aksi
 * @param {string} target - Target aksi
 * @returns {Object} Saran waktu dan lokasi
 */
function getSuggestions(action, target) {
    try {
        switch (action) {
            case 'bicara':
            case 'say':
                return getSayActionSuggestions(target);
                
            case 'bekerja_starry':
                return {
                    suggestedTimes: ['17:00-23:00 (STARRY buka)'],
                    tips: 'STARRY buka dari jam 5 sore sampai 11 malam. Waktu terbaik adalah jam 8-10 malam saat paling ramai.'
                };
                
            case 'latihan_gitar':
                return {
                    suggestedTimes: ['06:00-22:00 (tidak mengganggu tetangga)'],
                    tips: 'Hindari latihan terlalu pagi atau malam agar tidak mengganggu tetangga.'
                };
                
            default:
                return {
                    suggestedTimes: ['Tergantung aksi'],
                    tips: 'Gunakan /status untuk melihat jadwal karakter dan lokasi.'
                };
        }
    } catch (error) {
        console.error('[VALIDATOR] Error in getSuggestions:', error);
        return {
            suggestedTimes: ['Error'],
            tips: 'Terjadi kesalahan saat mendapatkan saran.'
        };
    }
}

/**
 * Saran untuk aksi bicara dengan karakter
 * @param {string} target - Nama karakter
 * @returns {Object} Saran waktu terbaik
 */
function getSayActionSuggestions(target) {
    const suggestions = {
        'Bocchi': {
            suggestedTimes: ['17:00-21:00 (STARRY)', '22:00-24:00 (Rumah)'],
            tips: 'Bocchi paling available di STARRY saat latihan band atau di rumah saat latihan gitar.'
        },
        'Nijika': {
            suggestedTimes: ['16:00-17:00 (Persiapan)', '17:00-21:00 (STARRY)', '22:00-24:00 (Chat)'],
            tips: 'Nijika sangat sosial dan mudah ditemui, terutama di STARRY atau saat persiapan.'
        },
        'Ryo': {
            suggestedTimes: ['16:00-17:00 (Shimokitazawa)', '17:00-21:00 (STARRY)'],
            tips: 'Ryo agak pendiam tapi bisa diajak bicara di STARRY atau saat hunting alat musik.'
        },
        'Kita': {
            suggestedTimes: ['16:00-17:00 (Shopping)', '17:00-21:00 (STARRY)', '22:00-24:00 (Social)'],
            tips: 'Kita sangat ramah dan mudah diajak bicara kapan saja, terutama saat shopping atau di STARRY.'
        },
        'Kikuri': {
            suggestedTimes: ['20:00-24:00 (STARRY)', '16:00-19:00 (Shimokitazawa)'],
            tips: 'Kikuri misterius dan lebih aktif di sore/malam hari. Coba cari di STARRY atau Shimokitazawa.'
        },
        'Seika': {
            suggestedTimes: ['23:00-24:00 (STARRY - Closing)', '17:00-23:00 (STARRY - Available tapi sulit)'],
            tips: 'Seika sangat sulit didekati dan selalu sibuk. Waktu terbaik adalah saat closing STARRY (23:00-24:00) atau coba keberuntungan saat dia mengelola live house. Bersikaplah profesional dan jangan buang-buang waktunya.'
        }
    };

    return suggestions[target] || {
        suggestedTimes: ['Karakter tidak dikenali'],
        tips: 'Pastikan nama karakter benar: Bocchi, Nijika, Ryo, Kita, Kikuri, atau Seika.'
    };
}

module.exports = {
    isActionPossible,
    validateSayAction,
    validateGuitarPractice,
    validateStarryWork,
    validateSongwriting,
    validateShimokitazawaWalk,
    getSuggestions,
    getSayActionSuggestions
};
