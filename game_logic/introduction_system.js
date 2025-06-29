// Introduction System - Sistem Perkenalan Resmi untuk Fase 4.7
// Menangani deteksi momen perkenalan dan reveal karakter

const { EmbedBuilder } = require('discord.js');
const { addKnownCharacter, isCharacterKnown } = require('../database');
const { buildCharacterDescriptionForPrompt } = require('./character_descriptions');

/**
 * Deteksi apakah terjadi momen perkenalan dalam respons LLM
 * @param {Object} llmResponse - Respons dari LLM yang sudah diparsing
 * @returns {string|null} - Nama karakter yang direveal atau null
 */
function detectCharacterReveal(llmResponse) {
    // Cek flag character_revealed dalam respons
    if (llmResponse.character_revealed) {
        return llmResponse.character_revealed;
    }
    
    // Deteksi alternatif berdasarkan narasi (fallback)
    const narration = llmResponse.narration || '';
    
    // Pattern untuk deteksi perkenalan
    const introductionPatterns = [
        /aku\s+([A-Z][a-z]+)/i,                    // "aku Nijika"
        /nama\s*ku\s+([A-Z][a-z]+)/i,              // "namaku Nijika"
        /panggil\s*aku\s+([A-Z][a-z]+)/i,          // "panggil aku Nijika"
        /([A-Z][a-z]+)\s*Ijichi/i,                 // "Nijika Ijichi"
        /([A-Z][a-z]+)\s*Hitori/i,                 // "Bocchi Hitori"
        /([A-Z][a-z]+)\s*Yamada/i,                 // "Ryo Yamada"
        /([A-Z][a-z]+)\s*Ikuyo/i,                  // "Kita Ikuyo"
        /perkenalkan.*([A-Z][a-z]+)/i              // "perkenalkan, aku Nijika"
    ];
    
    for (const pattern of introductionPatterns) {
        const match = narration.match(pattern);
        if (match) {
            const characterName = match[1];
            // Validasi nama karakter yang valid
            const validCharacters = ['Nijika', 'Bocchi', 'Ryo', 'Kita', 'Seika'];
            if (validCharacters.includes(characterName)) {
                console.log(`[INTRODUCTION] Detected character reveal through pattern: ${characterName}`);
                return characterName;
            }
        }
    }
    
    return null;
}

/**
 * Proses reveal karakter dan update database
 * @param {Object} interaction - Discord interaction
 * @param {string} characterName - Nama karakter yang direveal
 * @param {string} playerId - ID pemain
 * @returns {Promise<boolean>} - Berhasil atau tidak
 */
async function processCharacterReveal(interaction, characterName, playerId) {
    try {
        // Cek apakah karakter sudah dikenal sebelumnya
        const alreadyKnown = await isCharacterKnown(playerId, characterName);
        
        if (alreadyKnown) {
            console.log(`[INTRODUCTION] Character ${characterName} already known by ${playerId}`);
            return false;
        }
        
        // Tambahkan karakter ke known_characters
        const success = await addKnownCharacter(playerId, characterName);
        
        if (success) {
            // Kirim pesan konfirmasi yang memuaskan
            await sendCharacterRevealMessage(interaction, characterName);
            console.log(`[INTRODUCTION] Successfully revealed ${characterName} to ${playerId}`);
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('[INTRODUCTION] Error processing character reveal:', error);
        return false;
    }
}

/**
 * Kirim pesan konfirmasi reveal karakter
 * @param {Object} interaction - Discord interaction
 * @param {string} characterName - Nama karakter yang direveal
 */
async function sendCharacterRevealMessage(interaction, characterName) {
    const characterEmojis = {
        'Nijika': '🥁',
        'Bocchi': '🎸',
        'Ryo': '🎸',
        'Kita': '🎤',
        'Seika': '🎭'
    };
    
    const characterFullNames = {
        'Nijika': 'Nijika Ijichi',
        'Bocchi': 'Bocchi Hitori',
        'Ryo': 'Ryo Yamada',
        'Kita': 'Kita Ikuyo',
        'Seika': 'Seika Ijichi'
    };
    
    const characterDescriptions = {
        'Nijika': 'Drummer energik dari Kessoku Band dan adik dari Seika. Dia yang sering mengkoordinasi band dan memberikan semangat kepada semua orang.',
        'Bocchi': 'Guitarist berbakat tapi sangat pemalu. Meskipun introvert, skill gitarnya luar biasa dan dia memiliki hati yang baik.',
        'Ryo': 'Bassist cool dan mysterious dengan kepribadian yang unik. Sering membuat komentar yang tidak terduga tapi sangat skilled.',
        'Kita': 'Guitarist populer dan outgoing dengan kepercayaan diri tinggi. Dia mudah bergaul dan memiliki pengalaman perform.',
        'Seika': 'Pemilik dan manager STARRY Live House. Kakak dari Nijika yang berpengalaman di industri musik.'
    };
    
    const emoji = characterEmojis[characterName] || '✨';
    const fullName = characterFullNames[characterName] || characterName;
    const description = characterDescriptions[characterName] || 'Karakter yang menarik dalam dunia Bocchi the Rock!';
    
    const embed = new EmbedBuilder()
        .setColor('#ff6b9d')
        .setTitle(`${emoji} Karakter Baru Dikenal!`)
        .setDescription(`**${fullName}** telah memperkenalkan diri kepadamu!`)
        .addFields(
            { name: '🎭 Karakter', value: fullName, inline: true },
            { name: '📊 Status', value: 'Baru Dikenal', inline: true },
            { name: '💫 Pencapaian', value: 'Perkenalan Resmi Berhasil!', inline: true },
            { name: '📝 Tentang', value: description, inline: false },
            { name: '🎯 Apa Selanjutnya?', value: 'Kamu sekarang bisa melihat status hubunganmu dengan ' + characterName + ' di `/profile`. Relationship stats akan mulai berkembang dari interaksi selanjutnya!', inline: false }
        )
        .setFooter({ text: 'Sistem Perkenalan v4.7 • Gunakan /profile untuk melihat relationship status' })
        .setTimestamp();

    await interaction.followUp({ embeds: [embed] });
}

/**
 * Build konteks karakter untuk prompt LLM dengan sistem known/unknown
 * @param {string} playerId - ID pemain
 * @param {Array} charactersPresent - Daftar karakter yang ada
 * @returns {Promise<Object>} - Konteks karakter untuk prompt
 */
async function buildCharacterContextForPrompt(playerId, charactersPresent) {
    const context = {
        known_characters: [],
        unknown_characters: [],
        character_descriptions: {}
    };
    
    try {
        for (const character of charactersPresent) {
            const characterName = character.name;
            const isKnown = await isCharacterKnown(playerId, characterName);
            
            if (isKnown) {
                context.known_characters.push(characterName);
                context.character_descriptions[characterName] = characterName; // Gunakan nama langsung
            } else {
                context.unknown_characters.push(characterName);
                context.character_descriptions[characterName] = buildCharacterDescriptionForPrompt(
                    characterName, 
                    false, 
                    'interaction'
                );
            }
        }
        
        console.log(`[INTRODUCTION] Character context built - Known: ${context.known_characters.length}, Unknown: ${context.unknown_characters.length}`);
        return context;
        
    } catch (error) {
        console.error('[INTRODUCTION] Error building character context:', error);
        return context;
    }
}

/**
 * Validasi apakah perkenalan masuk akal berdasarkan konteks
 * @param {string} characterName - Nama karakter
 * @param {string} location - Lokasi saat ini
 * @param {Array} charactersPresent - Karakter yang ada di lokasi
 * @returns {boolean} - Apakah perkenalan valid
 */
function validateIntroductionContext(characterName, location, charactersPresent) {
    // Cek apakah karakter memang ada di lokasi
    const characterPresent = charactersPresent.some(char => char.name === characterName);
    
    if (!characterPresent) {
        console.warn(`[INTRODUCTION] Invalid introduction: ${characterName} not present at ${location}`);
        return false;
    }
    
    // Validasi lokasi yang masuk akal untuk perkenalan
    const validIntroductionLocations = ['STARRY', 'School', 'Shimokitazawa_Street'];
    
    if (!validIntroductionLocations.includes(location)) {
        console.warn(`[INTRODUCTION] Unusual introduction location: ${location}`);
        // Tidak return false, hanya warning
    }
    
    return true;
}

/**
 * Generate prompt instruction untuk sistem perkenalan
 * @param {Object} characterContext - Konteks karakter dari buildCharacterContextForPrompt
 * @returns {string} - Instruksi untuk prompt
 */
function generateIntroductionPromptInstruction(characterContext) {
    let instruction = '\n\nSISTEM PERKENALAN - FASE 4.7:\n';
    
    if (characterContext.known_characters.length > 0) {
        instruction += `KARAKTER YANG SUDAH DIKENAL (gunakan nama langsung): ${characterContext.known_characters.join(', ')}\n`;
    }
    
    if (characterContext.unknown_characters.length > 0) {
        instruction += `KARAKTER YANG BELUM DIKENAL (gunakan deskripsi fisik):\n`;
        characterContext.unknown_characters.forEach(charName => {
            instruction += `- ${charName}: "${characterContext.character_descriptions[charName]}"\n`;
        });
    }
    
    instruction += '\nJIKA TERJADI PERKENALAN RESMI (exchange nama eksplisit), tambahkan flag: {"character_revealed": "NamaKarakter"}\n';
    instruction += 'HANYA berikan poin relasi untuk karakter yang sudah ada di daftar known_characters!\n';
    
    return instruction;
}

/**
 * Proses respons LLM dan handle character reveal jika ada
 * @param {Object} interaction - Discord interaction
 * @param {Object} llmResponse - Respons LLM yang sudah diparsing
 * @param {string} playerId - ID pemain
 * @param {string} location - Lokasi saat ini
 * @param {Array} charactersPresent - Karakter yang ada
 * @returns {Promise<Object>} - Hasil processing dengan info reveal
 */
async function processLLMResponseWithIntroduction(interaction, llmResponse, playerId, location, charactersPresent) {
    const result = {
        originalResponse: llmResponse,
        characterRevealed: null,
        revealSuccess: false
    };
    
    // Deteksi character reveal
    const revealedCharacter = detectCharacterReveal(llmResponse);
    
    if (revealedCharacter) {
        // Validasi konteks perkenalan
        const isValidIntroduction = validateIntroductionContext(revealedCharacter, location, charactersPresent);
        
        if (isValidIntroduction) {
            // Proses reveal karakter
            const success = await processCharacterReveal(interaction, revealedCharacter, playerId);
            
            result.characterRevealed = revealedCharacter;
            result.revealSuccess = success;
            
            // Hapus flag dari respons untuk menghindari konflik
            if (llmResponse.character_revealed) {
                delete llmResponse.character_revealed;
            }
        } else {
            console.warn(`[INTRODUCTION] Invalid introduction context for ${revealedCharacter}`);
        }
    }
    
    return result;
}

module.exports = {
    detectCharacterReveal,
    processCharacterReveal,
    sendCharacterRevealMessage,
    buildCharacterContextForPrompt,
    validateIntroductionContext,
    generateIntroductionPromptInstruction,
    processLLMResponseWithIntroduction
};
