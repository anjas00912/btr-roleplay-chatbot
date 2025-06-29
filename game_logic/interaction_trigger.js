// Interaction Trigger - Sistem Interaksi Spontan NPC
// Fase 4.6: Implementasi sistem dimana NPC dapat memulai percakapan secara spontan

const { EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getCurrentJST } = require('../utils/time');
const {
    getCharacterPersonality,
    getInteractionPattern,
    getPersonalityProbabilityModifier,
    getRandomStarter
} = require('./character_personalities');
const { buildAdvancedSpontaneousPrompt } = require('./spontaneous_prompts');
const {
    buildCharacterContextForPrompt,
    processLLMResponseWithIntroduction
} = require('./introduction_system');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Konfigurasi probabilitas dan perilaku interaksi spontan
 */
const INTERACTION_CONFIG = {
    // Probabilitas dasar untuk interaksi spontan (30%)
    BASE_PROBABILITY: 0.3,
    
    // Modifier probabilitas berdasarkan relationship level
    RELATIONSHIP_MODIFIERS: {
        stranger: 0.1,      // 10% dari base (3% total)
        met: 0.5,          // 50% dari base (15% total)
        acquaintance: 1.0,  // 100% dari base (30% total)
        good_friend: 1.5,   // 150% dari base (45% total)
        close_friend: 2.0   // 200% dari base (60% total)
    },
    
    // Modifier berdasarkan availability karakter
    AVAILABILITY_MODIFIERS: {
        available: 1.0,     // Normal chance
        limited: 0.6,       // Reduced chance
        busy: 0.3,          // Very low chance
        unavailable: 0.0    // No chance
    },
    
    // Cooldown untuk mencegah spam (dalam menit)
    INTERACTION_COOLDOWN: 10
};

/**
 * Cache untuk tracking cooldown interaksi
 */
const interactionCooldowns = new Map();

/**
 * Fungsi utama untuk mengecek dan memicu interaksi spontan
 * @param {Object} interaction - Discord interaction object
 * @param {string} location - Lokasi saat ini
 * @param {Array} charactersPresent - Daftar karakter yang ada di lokasi
 * @param {Object} player - Data pemain
 */
async function checkForSpontaneousInteraction(interaction, location, charactersPresent, player) {
    console.log(`[SPONTANEOUS] Checking interaction for location: ${location}, characters: ${charactersPresent.length}`);
    
    // Jika tidak ada karakter di lokasi, skip
    if (!charactersPresent || charactersPresent.length === 0) {
        console.log(`[SPONTANEOUS] No characters present, skipping`);
        return;
    }
    
    // Cek cooldown
    const playerId = player.discord_id;
    const now = Date.now();
    const lastInteraction = interactionCooldowns.get(playerId);
    
    if (lastInteraction && (now - lastInteraction) < (INTERACTION_CONFIG.INTERACTION_COOLDOWN * 60 * 1000)) {
        console.log(`[SPONTANEOUS] Player ${playerId} still in cooldown, skipping`);
        return;
    }
    
    // Lemparan dadu probabilitas
    const randomRoll = Math.random();
    console.log(`[SPONTANEOUS] Probability roll: ${randomRoll.toFixed(3)}`);
    
    // Pilih karakter yang akan memulai interaksi
    const initiator = selectInteractionInitiator(charactersPresent, player, randomRoll);
    
    if (!initiator) {
        console.log(`[SPONTANEOUS] No suitable initiator found`);
        return;
    }
    
    console.log(`[SPONTANEOUS] Interaction triggered! Initiator: ${initiator.character.name}`);
    
    // Set cooldown
    interactionCooldowns.set(playerId, now);
    
    // Generate dan kirim interaksi spontan
    await generateAndSendSpontaneousInteraction(interaction, location, initiator, player);
}

/**
 * Pilih karakter yang akan memulai interaksi berdasarkan probabilitas
 * @param {Array} charactersPresent - Karakter yang ada
 * @param {Object} player - Data pemain
 * @param {number} randomRoll - Hasil random roll
 * @returns {Object|null} - Karakter yang terpilih atau null
 */
function selectInteractionInitiator(charactersPresent, player, randomRoll) {
    const candidates = [];
    
    for (const character of charactersPresent) {
        const charName = character.name.toLowerCase();
        
        // Hitung relationship level
        const relationshipLevel = calculateRelationshipLevel(player, charName);

        // Hitung probabilitas untuk karakter ini dengan sistem kepribadian
        const baseProbability = INTERACTION_CONFIG.BASE_PROBABILITY;
        const relationshipModifier = INTERACTION_CONFIG.RELATIONSHIP_MODIFIERS[relationshipLevel] || 0.5;
        const availabilityModifier = INTERACTION_CONFIG.AVAILABILITY_MODIFIERS[character.availability] || 0.5;

        // Tambahkan modifier kepribadian karakter
        const personalityModifier = getPersonalityProbabilityModifier(character.name, relationshipLevel);

        const finalProbability = baseProbability * relationshipModifier * availabilityModifier * personalityModifier;
        
        console.log(`[SPONTANEOUS] ${character.name}: relationship=${relationshipLevel}, availability=${character.availability}, probability=${finalProbability.toFixed(3)}`);
        
        if (randomRoll < finalProbability) {
            candidates.push({
                character: character,
                probability: finalProbability,
                relationshipLevel: relationshipLevel
            });
        }
    }
    
    if (candidates.length === 0) {
        return null;
    }
    
    // Jika ada beberapa kandidat, pilih yang probabilitasnya tertinggi
    candidates.sort((a, b) => b.probability - a.probability);
    return candidates[0];
}

/**
 * Hitung level relationship dengan karakter
 * @param {Object} player - Data pemain
 * @param {string} characterName - Nama karakter
 * @returns {string} - Level relationship
 */
function calculateRelationshipLevel(player, characterName) {
    const trust = player[`${characterName}_trust`] || 0;
    const comfort = player[`${characterName}_comfort`] || 0;
    const affection = player[`${characterName}_affection`] || 0;
    const total = trust + comfort + affection;
    
    if (total >= 15) return 'close_friend';
    if (total >= 10) return 'good_friend';
    if (total >= 5) return 'acquaintance';
    if (total >= 1) return 'met';
    return 'stranger';
}

/**
 * Generate dan kirim interaksi spontan menggunakan LLM
 * @param {Object} interaction - Discord interaction
 * @param {string} location - Lokasi
 * @param {Object} initiator - Karakter yang memulai
 * @param {Object} player - Data pemain
 */
async function generateAndSendSpontaneousInteraction(interaction, location, initiator, player) {
    try {
        console.log(`[SPONTANEOUS] Generating interaction for ${initiator.character.name} at ${location}`);
        
        // Build character context dengan sistem perkenalan (Fase 4.7)
        const characterContext = await buildCharacterContextForPrompt(player.discord_id, [initiator.character]);

        // Tentukan tipe interaksi berdasarkan kepribadian dan relationship
        const interactionType = determineInteractionType(initiator.character.name, initiator.relationshipLevel);

        // Build prompt canggih untuk LLM dengan konteks perkenalan
        const prompt = buildAdvancedSpontaneousPrompt(location, initiator, player, interactionType, characterContext);
        
        // Panggil LLM
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const llmResponse = response.text();
        
        console.log(`[SPONTANEOUS] LLM response received: ${llmResponse.substring(0, 100)}...`);
        
        // Parse response
        let parsedResponse;
        try {
            const cleanResponse = llmResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedResponse = JSON.parse(cleanResponse);
        } catch (parseError) {
            console.error(`[SPONTANEOUS] Error parsing LLM response:`, parseError);
            // Fallback ke response sederhana
            parsedResponse = {
                narration: llmResponse,
                character_name: initiator.character.name,
                interaction_type: "casual"
            };
        }
        
        // Proses character reveal jika ada (Fase 4.7)
        const introductionResult = await processLLMResponseWithIntroduction(
            interaction,
            parsedResponse,
            player.discord_id,
            location,
            [initiator.character]
        );

        if (introductionResult.characterRevealed) {
            console.log(`[SPONTANEOUS] Character revealed: ${introductionResult.characterRevealed}, success: ${introductionResult.revealSuccess}`);
        }

        // Kirim interaksi spontan ke pemain
        await sendSpontaneousInteractionMessage(interaction, parsedResponse, initiator.character.name);
        
    } catch (error) {
        console.error('[SPONTANEOUS] Error generating spontaneous interaction:', error);
    }
}

/**
 * Tentukan tipe interaksi berdasarkan karakter dan relationship level
 * @param {string} characterName - Nama karakter
 * @param {string} relationshipLevel - Level relationship
 * @returns {string} - Tipe interaksi
 */
function determineInteractionType(characterName, relationshipLevel) {
    const personality = getCharacterPersonality(characterName);
    if (!personality) return 'casual';

    // Tentukan berdasarkan archetype dan relationship level
    switch (personality.archetype) {
        case 'cheerful_social':
            return relationshipLevel === 'stranger' ? 'friendly' : 'playful';
        case 'supportive_leader':
            return relationshipLevel === 'stranger' ? 'friendly' : 'concerned';
        case 'cool_mysterious':
            return relationshipLevel === 'close_friend' ? 'friendly' : 'casual';
        case 'shy_anxious':
            return relationshipLevel === 'good_friend' || relationshipLevel === 'close_friend' ? 'curious' : 'casual';
        default:
            return 'casual';
    }
}

/**
 * Build prompt untuk LLM interaksi spontan (legacy function, akan diganti)
 * @param {string} location - Lokasi
 * @param {Object} initiator - Karakter inisiator
 * @param {Object} player - Data pemain
 * @returns {string} - Prompt untuk LLM
 */
function buildSpontaneousInteractionPrompt(location, initiator, player) {
    const currentTime = getCurrentJST();
    const characterName = initiator.character.name;
    const relationshipLevel = initiator.relationshipLevel;

    // Dapatkan data kepribadian karakter
    const personality = getCharacterPersonality(characterName);
    const interactionPattern = getInteractionPattern(characterName, relationshipLevel);
    const exampleStarter = getRandomStarter(characterName, relationshipLevel);

    return `🎭 SISTEM INTERAKSI SPONTAN - BOCCHI THE ROCK!

Sebuah interaksi spontan telah terpicu! Seorang karakter akan memulai percakapan dengan pemain.

KONTEKS SITUASI:
- Lokasi: ${location}
- Waktu: ${currentTime.dayName}, ${currentTime.timeString} JST (${currentTime.period})
- Karakter Inisiator: ${characterName} ${personality ? personality.emoji : ''}
- Availability: ${initiator.character.availability}
- Relationship Level: ${relationshipLevel}

DATA RELATIONSHIP:
- ${characterName} Trust: ${player[`${characterName.toLowerCase()}_trust`] || 0}
- ${characterName} Comfort: ${player[`${characterName.toLowerCase()}_comfort`] || 0}
- ${characterName} Affection: ${player[`${characterName.toLowerCase()}_affection`] || 0}

KEPRIBADIAN ${characterName.toUpperCase()}:
${personality ? `
- Archetype: ${personality.archetype}
- Energy Level: ${personality.traits.energy_level}
- Social Comfort: ${personality.traits.social_comfort}
- Initiative: ${personality.traits.initiative}
- Emotional Expression: ${personality.traits.emotional_expression}
` : ''}

POLA INTERAKSI UNTUK LEVEL ${relationshipLevel.toUpperCase()}:
${interactionPattern ? `
- Tone: ${interactionPattern.tone}
- Topics: ${interactionPattern.topics.join(', ')}
- Example Starter: "${exampleStarter || 'Tidak ada contoh'}"
` : ''}

${getCharacterPersonalityGuide(characterName)}

TUGAS ANDA:
Buat sebuah interaksi spontan yang natural dimana ${characterName} memulai percakapan dengan pemain. Interaksi harus:
1. Sesuai dengan kepribadian karakter
2. Relevan dengan lokasi dan waktu
3. Mempertimbangkan level relationship
4. Mengundang pemain untuk merespons
5. Terasa natural dan tidak dipaksakan

FORMAT RESPONS JSON:
{
  "narration": "Narasi detail tentang bagaimana ${characterName} mendekati dan memulai percakapan. Akhiri dengan dialog atau pertanyaan yang mengundang respons pemain.",
  "character_name": "${characterName}",
  "interaction_type": "casual|friendly|curious|playful|concerned",
  "expected_response": "Hint tentang jenis respons yang diharapkan dari pemain"
}

CONTOH YANG BAIK:
{
  "narration": "Saat kamu sedang merapikan barang-barangmu, Kita tiba-tiba muncul di sampingmu dengan senyum cerah. 'Hei! Aku lihat kamu sering sendirian akhir-akhir ini. Gimana kabarnya?' tanyanya sambil duduk di kursi sebelah. 'Oh ya, aku dengar kamu juga suka musik indie. Band favorit kamu apa?'",
  "character_name": "Kita",
  "interaction_type": "friendly",
  "expected_response": "Pemain bisa menjawab tentang kabar atau band favorit mereka"
}`;
}

/**
 * Dapatkan panduan kepribadian karakter untuk prompt
 * @param {string} characterName - Nama karakter
 * @returns {string} - Panduan kepribadian
 */
function getCharacterPersonalityGuide(characterName) {
    const guides = {
        'Kita': `KEPRIBADIAN KITA IKUYO:
- Ceria, ramah, dan mudah bergaul
- Suka memulai percakapan dengan antusias
- Tertarik pada musik dan band
- Peduli dengan teman-temannya
- Kemungkinan bertanya tentang: musik, band favorit, hobi, kabar, rencana
- Gaya bicara: Energik, positif, menggunakan "!" sering`,

        'Nijika': `KEPRIBADIAN NIJIKA IJICHI:
- Bertanggung jawab, supportive, seperti kakak
- Sering memberikan semangat dan motivasi
- Peduli dengan perkembangan orang lain
- Praktis dan down-to-earth
- Kemungkinan bertanya tentang: progress, kesulitan, butuh bantuan, rencana latihan
- Gaya bicara: Hangat, mendukung, kadang sedikit menggurui`,

        'Ryo': `KEPRIBADIAN RYO YAMADA:
- Cool, mysterious, sedikit aneh
- Sering membuat komentar yang tidak terduga
- Obsesi dengan uang dan hal-hal praktis
- Tidak terlalu ekspresif tapi perhatian
- Kemungkinan bertanya tentang: uang, makanan, hal-hal random, observasi aneh
- Gaya bicara: Singkat, deadpan, kadang absurd`,

        'Bocchi': `KEPRIBADIAN BOCCHI HITORI:
- Pemalu, nervous, tapi baik hati
- Hanya akan memulai percakapan jika comfort level tinggi
- Sering gugup dan berbicara terbata-bata
- Mungkin hanya mengomentari sesuatu dengan lirih
- Kemungkinan bertanya tentang: hal sederhana, musik, atau hanya berkomentar
- Gaya bicara: Terbata-bata, lirih, sering menggunakan "..." dan "um..."`
    };
    
    return guides[characterName] || `KEPRIBADIAN ${characterName.toUpperCase()}:
- Karakter dengan kepribadian unik
- Sesuaikan dengan konteks yang ada`;
}

/**
 * Kirim pesan interaksi spontan ke pemain dengan format yang enhanced
 * @param {Object} interaction - Discord interaction
 * @param {Object} responseData - Data respons dari LLM
 * @param {string} characterName - Nama karakter
 */
async function sendSpontaneousInteractionMessage(interaction, responseData, characterName) {
    const personality = getCharacterPersonality(characterName);
    const characterEmoji = personality ? personality.emoji : '💬';

    const embed = new EmbedBuilder()
        .setColor('#ff6b9d')
        .setTitle(`${characterEmoji} Interaksi Spontan!`)
        .setDescription(responseData.narration)
        .addFields(
            { name: '🎭 Karakter', value: `${characterName} ${characterEmoji}`, inline: true },
            { name: '💭 Tipe Interaksi', value: responseData.interaction_type || 'casual', inline: true },
            { name: '🎯 Focus Dialog', value: responseData.dialogue_focus || 'Percakapan umum', inline: true },
            { name: '🎪 Mood & Tone', value: responseData.mood_tone || 'Natural', inline: true },
            { name: '💡 Cara Merespons', value: `Gunakan \`/say [dialog kamu]\` untuk menjawab!\n\n*Hint: ${responseData.expected_response_type || 'Respons natural sesuai situasi'}*`, inline: false }
        )
        .setFooter({ text: `${characterName} sedang menunggu responmu! • Sistem Interaksi Spontan v4.6` })
        .setTimestamp();

    await interaction.followUp({ embeds: [embed] });
    console.log(`[SPONTANEOUS] Enhanced spontaneous interaction sent for ${characterName} (${responseData.interaction_type})`);
}

module.exports = {
    checkForSpontaneousInteraction,
    selectInteractionInitiator,
    calculateRelationshipLevel,
    INTERACTION_CONFIG
};
