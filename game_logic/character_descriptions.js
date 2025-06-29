// Character Descriptions - Sistem Deskripsi Fisik untuk Karakter yang Belum Dikenal
// Fase 4.7: Implementasi sistem perkenalan berbasis clue visual

/**
 * Database deskripsi fisik dan clue visual untuk setiap karakter
 * Digunakan sebelum pemain secara resmi berkenalan dengan karakter
 */
const CHARACTER_DESCRIPTIONS = {
    'Nijika': {
        physical_description: 'seorang gadis ceria dengan rambut pirang dan pita segitiga kuning',
        alternative_descriptions: [
            'gadis berambut pirang dengan pita kuning yang mencolok',
            'seorang gadis energik dengan rambut blonde dan aksesoris pita',
            'gadis ceria berpita kuning dengan senyum yang hangat',
            'seorang gadis dengan rambut pirang bob dan pita segitiga khas'
        ],
        personality_clues: [
            'terlihat seperti seseorang yang bisa diandalkan',
            'memiliki aura kepemimpinan yang natural',
            'tampak seperti orang yang peduli dengan orang lain',
            'memberikan kesan seperti kakak yang supportive'
        ],
        activity_clues: [
            'sering terlihat mengatur sesuatu',
            'tampak familiar dengan equipment musik',
            'terlihat seperti seseorang yang berpengalaman di live house',
            'sering membantu orang lain dengan setup alat musik'
        ],
        mystery_level: 'medium', // Seberapa mudah ditebak identitasnya
        reveal_hints: [
            'Dia sepertinya drummer yang berpengalaman',
            'Cara dia mengatur stick drum terlihat profesional',
            'Sepertinya dia yang mengkoordinasi band ini'
        ]
    },
    
    'Bocchi': {
        physical_description: 'gadis berambut pink yang selalu tampak cemas',
        alternative_descriptions: [
            'seorang gadis dengan tracksuit pink yang terlihat nervous',
            'gadis berambut pink panjang yang sering menunduk',
            'seorang gadis pemalu dengan rambut pink dan mata yang sering menghindar',
            'gadis dengan hoodie pink yang tampak ingin bersembunyi'
        ],
        personality_clues: [
            'terlihat sangat pemalu dan nervous',
            'sering menghindar dari kontak mata',
            'tampak seperti seseorang yang mudah cemas',
            'memberikan kesan seperti introvert yang ekstrem'
        ],
        activity_clues: [
            'sering bersembunyi di sudut ruangan',
            'terlihat membawa gitar dengan hati-hati',
            'tampak seperti seseorang yang lebih nyaman sendirian',
            'sering terlihat berlatih di tempat yang sepi'
        ],
        mystery_level: 'low', // Mudah ditebak karena sangat khas
        reveal_hints: [
            'Cara dia memegang gitar terlihat sangat berpengalaman',
            'Meskipun pemalu, skill gitarnya sepertinya luar biasa',
            'Dia sepertinya guitarist yang sangat berbakat tapi introvert'
        ]
    },
    
    'Ryo': {
        physical_description: 'gadis jangkung berambiru yang terlihat cuek',
        alternative_descriptions: [
            'seorang gadis tinggi dengan rambut biru dan ekspresi datar',
            'gadis berambut biru dengan tatapan kosong yang khas',
            'seorang gadis cool dengan rambut biru dan aura mysterious',
            'gadis jangkung berambut biru yang tampak tidak peduli dengan sekitar'
        ],
        personality_clues: [
            'memiliki aura yang cool dan mysterious',
            'terlihat seperti seseorang yang sulit ditebak',
            'tampak cuek tapi mungkin sebenarnya perhatian',
            'memberikan kesan seperti orang yang unik dan eksentrik'
        ],
        activity_clues: [
            'sering terlihat dengan bass guitar',
            'tampak seperti seseorang yang ahli musik',
            'terlihat seperti orang yang punya taste musik yang unik',
            'sering membuat komentar yang tidak terduga'
        ],
        mystery_level: 'high', // Sulit ditebak karena mysterious
        reveal_hints: [
            'Cara dia main bass terlihat sangat natural',
            'Sepertinya dia bassist yang sangat skilled',
            'Meskipun terlihat cuek, dia sepertinya sangat passionate tentang musik'
        ]
    },
    
    'Kita': {
        physical_description: 'gadis populer dengan rambut merah menyala dan aura yang bersinar',
        alternative_descriptions: [
            'seorang gadis dengan rambut merah cerah dan senyum yang menawan',
            'gadis berambut merah dengan kepercayaan diri yang tinggi',
            'seorang gadis energik dengan rambut merah dan personality yang outgoing',
            'gadis dengan rambut merah menyala yang tampak sangat sosial'
        ],
        personality_clues: [
            'terlihat sangat percaya diri dan outgoing',
            'memiliki aura yang menarik dan charismatic',
            'tampak seperti seseorang yang mudah bergaul',
            'memberikan kesan seperti orang yang populer dan friendly'
        ],
        activity_clues: [
            'sering terlihat berinteraksi dengan banyak orang',
            'tampak familiar dengan dunia musik',
            'terlihat seperti seseorang yang berpengalaman perform',
            'sering terlihat dengan gitar dan tampak confident'
        ],
        mystery_level: 'medium', // Cukup mudah ditebak karena outgoing
        reveal_hints: [
            'Cara dia berinteraksi menunjukkan pengalaman di dunia musik',
            'Sepertinya dia guitarist yang berpengalaman dan confident',
            'Dia tampak seperti seseorang yang sudah terbiasa dengan spotlight'
        ]
    },
    
    'Seika': {
        physical_description: 'wanita dewasa berambut pirang dengan tatapan tajam',
        alternative_descriptions: [
            'seorang wanita dewasa dengan rambut pirang dan aura profesional',
            'wanita berambut pirang yang terlihat berpengalaman',
            'seorang wanita dewasa dengan tatapan yang tegas dan authoritative',
            'wanita berambut pirang yang tampak seperti pemilik tempat ini'
        ],
        personality_clues: [
            'memiliki aura otoritas dan pengalaman',
            'terlihat seperti seseorang yang bertanggung jawab',
            'tampak seperti orang yang sudah lama di industri musik',
            'memberikan kesan seperti mentor atau boss'
        ],
        activity_clues: [
            'sering terlihat mengatur operasional live house',
            'tampak seperti pemilik atau manager tempat ini',
            'terlihat seperti seseorang yang sangat berpengalaman',
            'sering memberikan arahan kepada staff dan musisi'
        ],
        mystery_level: 'low', // Mudah ditebak karena jelas sebagai authority figure
        reveal_hints: [
            'Sepertinya dia yang menjalankan live house ini',
            'Cara dia mengatur semuanya menunjukkan dia pemilik atau manager',
            'Dia tampak seperti seseorang yang sangat berpengalaman di dunia musik'
        ]
    }
};

/**
 * Dapatkan deskripsi fisik karakter untuk yang belum dikenal
 * @param {string} characterName - Nama karakter
 * @param {boolean} useAlternative - Gunakan deskripsi alternatif
 * @returns {string} - Deskripsi fisik
 */
function getCharacterPhysicalDescription(characterName, useAlternative = false) {
    const charData = CHARACTER_DESCRIPTIONS[characterName];
    if (!charData) return `seseorang yang tidak dikenal`;
    
    if (useAlternative && charData.alternative_descriptions.length > 0) {
        const randomIndex = Math.floor(Math.random() * charData.alternative_descriptions.length);
        return charData.alternative_descriptions[randomIndex];
    }
    
    return charData.physical_description;
}

/**
 * Dapatkan clue kepribadian untuk karakter
 * @param {string} characterName - Nama karakter
 * @returns {string} - Clue kepribadian
 */
function getCharacterPersonalityClue(characterName) {
    const charData = CHARACTER_DESCRIPTIONS[characterName];
    if (!charData || !charData.personality_clues.length) return '';
    
    const randomIndex = Math.floor(Math.random() * charData.personality_clues.length);
    return charData.personality_clues[randomIndex];
}

/**
 * Dapatkan clue aktivitas untuk karakter
 * @param {string} characterName - Nama karakter
 * @returns {string} - Clue aktivitas
 */
function getCharacterActivityClue(characterName) {
    const charData = CHARACTER_DESCRIPTIONS[characterName];
    if (!charData || !charData.activity_clues.length) return '';
    
    const randomIndex = Math.floor(Math.random() * charData.activity_clues.length);
    return charData.activity_clues[randomIndex];
}

/**
 * Dapatkan hint untuk reveal identitas karakter
 * @param {string} characterName - Nama karakter
 * @returns {string} - Hint untuk reveal
 */
function getCharacterRevealHint(characterName) {
    const charData = CHARACTER_DESCRIPTIONS[characterName];
    if (!charData || !charData.reveal_hints.length) return '';
    
    const randomIndex = Math.floor(Math.random() * charData.reveal_hints.length);
    return charData.reveal_hints[randomIndex];
}

/**
 * Dapatkan deskripsi lengkap untuk karakter yang belum dikenal
 * @param {string} characterName - Nama karakter
 * @param {string} context - Konteks situasi ('casual', 'activity', 'interaction')
 * @returns {Object} - Objek dengan berbagai deskripsi
 */
function getCharacterFullDescription(characterName, context = 'casual') {
    const charData = CHARACTER_DESCRIPTIONS[characterName];
    if (!charData) {
        return {
            physical: 'seseorang yang tidak dikenal',
            personality: '',
            activity: '',
            mystery_level: 'unknown'
        };
    }
    
    return {
        physical: getCharacterPhysicalDescription(characterName, Math.random() > 0.5),
        personality: getCharacterPersonalityClue(characterName),
        activity: context === 'activity' ? getCharacterActivityClue(characterName) : '',
        reveal_hint: context === 'interaction' ? getCharacterRevealHint(characterName) : '',
        mystery_level: charData.mystery_level
    };
}

/**
 * Build deskripsi karakter untuk prompt AI
 * @param {string} characterName - Nama karakter
 * @param {boolean} isKnown - Apakah karakter sudah dikenal
 * @param {string} context - Konteks situasi
 * @returns {string} - Deskripsi untuk prompt
 */
function buildCharacterDescriptionForPrompt(characterName, isKnown, context = 'casual') {
    if (isKnown) {
        return characterName; // Gunakan nama langsung jika sudah dikenal
    }
    
    const description = getCharacterFullDescription(characterName, context);
    let result = description.physical;
    
    if (description.personality) {
        result += ` yang ${description.personality}`;
    }
    
    if (description.activity) {
        result += `. ${description.activity}`;
    }
    
    return result;
}

/**
 * Dapatkan semua karakter dengan status known/unknown
 * @param {Array} knownCharacters - Daftar karakter yang sudah dikenal
 * @returns {Object} - Mapping karakter dengan status dan deskripsi
 */
function getAllCharactersWithStatus(knownCharacters = []) {
    const allCharacters = Object.keys(CHARACTER_DESCRIPTIONS);
    const result = {};
    
    allCharacters.forEach(charName => {
        const isKnown = knownCharacters.includes(charName);
        result[charName] = {
            name: charName,
            isKnown: isKnown,
            displayName: isKnown ? charName : '???',
            description: isKnown ? charName : getCharacterPhysicalDescription(charName),
            mystery_level: CHARACTER_DESCRIPTIONS[charName].mystery_level
        };
    });
    
    return result;
}

module.exports = {
    CHARACTER_DESCRIPTIONS,
    getCharacterPhysicalDescription,
    getCharacterPersonalityClue,
    getCharacterActivityClue,
    getCharacterRevealHint,
    getCharacterFullDescription,
    buildCharacterDescriptionForPrompt,
    getAllCharactersWithStatus
};
