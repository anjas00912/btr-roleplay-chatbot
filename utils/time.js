// Modul untuk menangani waktu JST (Japan Standard Time)
// Menggunakan Intl.DateTimeFormat untuk handling timezone yang akurat dan built-in

// Konstanta untuk timezone JST
const JST_TIMEZONE = 'Asia/Tokyo';

// Konstanta untuk reset harian (jam 5 pagi JST)
const DAILY_RESET_HOUR = 5;
const DAILY_RESET_MINUTE = 0;

/**
 * Mendapatkan waktu saat ini dalam JST
 * @returns {Object} Objek yang berisi informasi waktu JST lengkap
 */
function getCurrentJST() {
    try {
        // Dapatkan waktu UTC saat ini
        const now = new Date();

        // Buat formatter untuk JST
        const jstFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: JST_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        // Format waktu JST
        const jstParts = jstFormatter.formatToParts(now);
        const jstPartsObj = {};
        jstParts.forEach(part => {
            jstPartsObj[part.type] = part.value;
        });

        // Ekstrak komponen waktu
        const year = parseInt(jstPartsObj.year);
        const month = parseInt(jstPartsObj.month);
        const date = parseInt(jstPartsObj.day);
        const hour = parseInt(jstPartsObj.hour);
        const minute = parseInt(jstPartsObj.minute);
        const second = parseInt(jstPartsObj.second);

        // Buat Date object untuk JST (approximation untuk dayOfWeek)
        const jstDate = new Date(year, month - 1, date, hour, minute, second);

        // Hitung hari dalam seminggu (1 = Senin, 7 = Minggu)
        const dayOfWeek = jstDate.getDay() === 0 ? 7 : jstDate.getDay();

        // Format string untuk display
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
        const dateString = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
        const fullDateTimeString = `${dateString} ${timeString}`;

        // Nama hari dalam bahasa Indonesia
        const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        const dayName = dayNames[dayOfWeek];

        // Periode hari (pagi, siang, sore, malam)
        const period = getTimePeriod(hour);

        // Informasi apakah ini waktu reset harian
        const isResetTime = (hour === DAILY_RESET_HOUR && minute === DAILY_RESET_MINUTE);

        return {
            // Raw Date object dalam JST (approximation)
            jstDate: jstDate,

            // Komponen waktu individual
            year,
            month,
            date,
            hour,
            minute,
            second,
            dayOfWeek,
            dayName,

            // String format
            timeString,
            dateString,
            fullDateTimeString,

            // Informasi tambahan
            period,
            isResetTime,
            timezone: JST_TIMEZONE,

            // Untuk debugging
            utcTime: now,
            utcString: now.toISOString()
        };
    } catch (error) {
        console.error('[TIME] Error getting current JST:', error);

        // Fallback ke waktu lokal jika ada error
        const fallbackTime = new Date();
        return {
            jstDate: fallbackTime,
            year: fallbackTime.getFullYear(),
            month: fallbackTime.getMonth() + 1,
            date: fallbackTime.getDate(),
            hour: fallbackTime.getHours(),
            minute: fallbackTime.getMinutes(),
            second: fallbackTime.getSeconds(),
            dayOfWeek: fallbackTime.getDay() === 0 ? 7 : fallbackTime.getDay(),
            dayName: 'Unknown',
            timeString: fallbackTime.toTimeString().substring(0, 8),
            dateString: fallbackTime.toISOString().substring(0, 10),
            fullDateTimeString: fallbackTime.toISOString().replace('T', ' ').substring(0, 19),
            period: 'unknown',
            isResetTime: false,
            timezone: 'fallback',
            utcTime: fallbackTime,
            utcString: fallbackTime.toISOString(),
            error: error.message
        };
    }
}

/**
 * Mendapatkan periode hari berdasarkan jam
 * @param {number} hour - Jam dalam format 24 jam (0-23)
 * @returns {string} Periode hari
 */
function getTimePeriod(hour) {
    if (hour >= 5 && hour < 12) {
        return 'pagi';
    } else if (hour >= 12 && hour < 17) {
        return 'siang';
    } else if (hour >= 17 && hour < 21) {
        return 'sore';
    } else {
        return 'malam';
    }
}

/**
 * Mendapatkan tanggal reset harian berikutnya dalam JST
 * Reset terjadi setiap hari jam 5 pagi JST
 * @returns {Date} Waktu reset berikutnya dalam JST
 */
function getNextResetTime() {
    try {
        const currentJST = getCurrentJST();
        const resetTime = new Date(currentJST.jstDate);
        
        // Set ke jam reset (5 pagi)
        resetTime.setHours(DAILY_RESET_HOUR, DAILY_RESET_MINUTE, 0, 0);
        
        // Jika waktu reset hari ini sudah lewat, ambil reset besok
        if (resetTime <= currentJST.jstDate) {
            resetTime.setDate(resetTime.getDate() + 1);
        }
        
        return resetTime;
    } catch (error) {
        console.error('[TIME] Error getting next reset time:', error);
        
        // Fallback: reset 24 jam dari sekarang
        const fallback = new Date();
        fallback.setHours(fallback.getHours() + 24);
        return fallback;
    }
}

/**
 * Mengecek apakah tanggal berubah di JST sejak timestamp terakhir
 * @param {string} lastPlayedDate - Tanggal terakhir bermain (format YYYY-MM-DD)
 * @returns {boolean} True jika sudah hari baru di JST
 */
function isNewDayInJST(lastPlayedDate) {
    try {
        if (!lastPlayedDate) {
            return true; // Jika belum pernah bermain, anggap hari baru
        }
        
        const currentJST = getCurrentJST();
        const currentDateString = currentJST.dateString;
        
        // Bandingkan tanggal string
        return currentDateString !== lastPlayedDate;
    } catch (error) {
        console.error('[TIME] Error checking new day:', error);
        return true; // Default ke true jika ada error
    }
}

/**
 * Mengecek apakah sudah melewati waktu reset harian (5 AM JST) sejak timestamp terakhir
 * @param {string} lastResetTimestamp - Timestamp terakhir reset (ISO string)
 * @returns {boolean} True jika sudah melewati waktu reset
 */
function shouldResetDaily(lastResetTimestamp) {
    try {
        if (!lastResetTimestamp) {
            return true; // Jika belum pernah reset, lakukan reset
        }

        const currentJST = getCurrentJST();
        const lastReset = new Date(lastResetTimestamp);

        // Konversi last reset ke JST menggunakan Intl.DateTimeFormat
        const lastResetJSTFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: JST_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const lastResetJSTParts = lastResetJSTFormatter.formatToParts(lastReset);
        const lastResetJSTObj = {};
        lastResetJSTParts.forEach(part => {
            lastResetJSTObj[part.type] = part.value;
        });

        const lastResetJST = new Date(
            parseInt(lastResetJSTObj.year),
            parseInt(lastResetJSTObj.month) - 1,
            parseInt(lastResetJSTObj.day),
            parseInt(lastResetJSTObj.hour),
            parseInt(lastResetJSTObj.minute),
            parseInt(lastResetJSTObj.second)
        );

        // Hitung waktu reset terakhir yang seharusnya terjadi
        const todayResetTime = new Date(currentJST.jstDate);
        todayResetTime.setHours(DAILY_RESET_HOUR, DAILY_RESET_MINUTE, 0, 0);

        // Jika waktu reset hari ini belum terjadi, cek reset kemarin
        if (currentJST.jstDate < todayResetTime) {
            todayResetTime.setDate(todayResetTime.getDate() - 1);
        }

        // Reset diperlukan jika last reset lebih lama dari waktu reset terakhir
        return lastResetJST < todayResetTime;
    } catch (error) {
        console.error('[TIME] Error checking daily reset:', error);
        return true; // Default ke true jika ada error
    }
}

/**
 * Mendapatkan informasi waktu untuk display user-friendly
 * @returns {Object} Informasi waktu yang mudah dibaca
 */
function getDisplayTimeInfo() {
    try {
        const jst = getCurrentJST();
        const nextReset = getNextResetTime();
        
        // Hitung waktu sampai reset berikutnya
        const timeUntilReset = nextReset.getTime() - jst.jstDate.getTime();
        const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
        const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));

        // Konversi nextReset ke JST untuk display menggunakan Intl.DateTimeFormat
        const nextResetJSTFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: JST_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const nextResetTimeString = nextResetJSTFormatter.format(nextReset);

        return {
            currentTime: `${jst.timeString} JST`,
            currentDate: jst.dateString,
            dayName: jst.dayName,
            period: jst.period,
            nextResetTime: nextResetTimeString,
            timeUntilReset: `${hoursUntilReset}j ${minutesUntilReset}m`,
            isNearReset: hoursUntilReset < 1, // Kurang dari 1 jam sampai reset
            fullDateTime: jst.fullDateTimeString
        };
    } catch (error) {
        console.error('[TIME] Error getting display time info:', error);
        return {
            currentTime: 'Error',
            currentDate: 'Error',
            dayName: 'Error',
            period: 'Error',
            nextResetTime: 'Error',
            timeUntilReset: 'Error',
            isNearReset: false,
            fullDateTime: 'Error',
            error: error.message
        };
    }
}

/**
 * Utility function untuk testing - set waktu custom (hanya untuk development)
 * @param {Date} customTime - Waktu custom untuk testing
 * @returns {Object} Informasi waktu JST dari waktu custom
 */
function getJSTFromCustomTime(customTime) {
    try {
        // Buat formatter untuk JST
        const jstFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: JST_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        // Format waktu JST
        const jstParts = jstFormatter.formatToParts(customTime);
        const jstPartsObj = {};
        jstParts.forEach(part => {
            jstPartsObj[part.type] = part.value;
        });

        // Ekstrak komponen waktu
        const year = parseInt(jstPartsObj.year);
        const month = parseInt(jstPartsObj.month);
        const date = parseInt(jstPartsObj.day);
        const hour = parseInt(jstPartsObj.hour);
        const minute = parseInt(jstPartsObj.minute);
        const second = parseInt(jstPartsObj.second);

        // Buat Date object untuk JST (approximation untuk dayOfWeek)
        const jstDate = new Date(year, month - 1, date, hour, minute, second);

        // Hitung hari dalam seminggu (1 = Senin, 7 = Minggu)
        const dayOfWeek = jstDate.getDay() === 0 ? 7 : jstDate.getDay();

        // Format string untuk display
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
        const dateString = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
        const fullDateTimeString = `${dateString} ${timeString}`;

        return {
            jstDate: jstDate,
            year,
            month,
            date,
            hour,
            minute,
            second,
            dayOfWeek,
            timeString,
            dateString,
            fullDateTimeString,
            period: getTimePeriod(hour),
            timezone: JST_TIMEZONE
        };
    } catch (error) {
        console.error('[TIME] Error converting custom time to JST:', error);
        return null;
    }
}

module.exports = {
    getCurrentJST,
    getNextResetTime,
    isNewDayInJST,
    shouldResetDaily,
    getDisplayTimeInfo,
    getJSTFromCustomTime,
    getTimePeriod,
    
    // Konstanta yang bisa digunakan di modul lain
    JST_TIMEZONE,
    DAILY_RESET_HOUR,
    DAILY_RESET_MINUTE
};
