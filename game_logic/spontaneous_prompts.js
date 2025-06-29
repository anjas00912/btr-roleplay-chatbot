// Spontaneous Prompts - Sistem Prompt LLM Canggih untuk Interaksi Spontan NPC
// Fase 4.6: Prompt engineering untuk menghasilkan dialog natural dan sesuai karakter

const { getCurrentJST } = require('../utils/time');
const { getCharacterPersonality, getInteractionPattern, getRandomStarter } = require('./character_personalities');

/**
 * Template prompt berdasarkan tipe interaksi
 */
const PROMPT_TEMPLATES = {
    casual: {
        focus: 'percakapan santai dan natural',
        guidelines: [
            'Buat pembuka yang ringan dan tidak memaksa',
            'Fokus pada situasi saat ini atau observasi sederhana',
            'Gunakan tone yang sesuai dengan kepribadian karakter',
            'Akhiri dengan pertanyaan atau komentar yang mengundang respons'
        ]
    },
    
    friendly: {
        focus: 'interaksi ramah dan hangat',
        guidelines: [
            'Tunjukkan ketertarikan genuine pada pemain',
            'Gunakan bahasa yang warm dan welcoming',
            'Buat koneksi personal yang sesuai relationship level',
            'Dorong pemain untuk berbagi atau berinteraksi lebih lanjut'
        ]
    },
    
    curious: {
        focus: 'rasa ingin tahu dan eksplorasi',
        guidelines: [
            'Mulai dengan observasi atau pertanyaan yang menarik',
            'Tunjukkan genuine curiosity tentang pemain atau situasi',
            'Buat pertanyaan yang open-ended dan engaging',
            'Sesuaikan level curiosity dengan kepribadian karakter'
        ]
    },
    
    playful: {
        focus: 'interaksi yang fun dan energik',
        guidelines: [
            'Gunakan tone yang light dan entertaining',
            'Bisa include humor atau teasing yang gentle',
            'Buat situasi yang mengundang interaksi yang fun',
            'Sesuaikan dengan energy level karakter'
        ]
    },
    
    concerned: {
        focus: 'kepedulian dan support',
        guidelines: [
            'Tunjukkan genuine care dan perhatian',
            'Mulai dengan observasi tentang kondisi pemain',
            'Tawarkan bantuan atau dukungan dengan cara yang natural',
            'Gunakan tone yang caring tapi tidak overwhelming'
        ]
    }
};

/**
 * Situational context generators untuk berbagai lokasi
 */
const LOCATION_CONTEXTS = {
    'STARRY': {
        atmosphere: 'live house yang energik dengan suara musik dan aktivitas band',
        common_activities: ['latihan band', 'sound check', 'persiapan show', 'diskusi musik'],
        ambient_details: ['suara instrumen', 'setup equipment', 'lighting check', 'band members berlatih'],
        interaction_triggers: [
            'setelah latihan selesai',
            'saat break antar set',
            'ketika mengatur equipment',
            'di backstage area'
        ]
    },
    
    'School': {
        atmosphere: 'lingkungan sekolah dengan aktivitas siswa dan suasana akademik',
        common_activities: ['istirahat kelas', 'makan siang', 'klub activities', 'belajar bersama'],
        ambient_details: ['suara siswa mengobrol', 'bel sekolah', 'aktivitas klub', 'persiapan ujian'],
        interaction_triggers: [
            'saat istirahat di koridor',
            'di kantin sekolah',
            'setelah kelas selesai',
            'di ruang klub musik'
        ]
    },
    
    'Shimokitazawa_Street': {
        atmosphere: 'jalanan indie culture district dengan vibe artistic dan bohemian',
        common_activities: ['jalan-jalan', 'window shopping', 'street performance', 'cafe hopping'],
        ambient_details: ['suara jalanan', 'musik dari toko', 'street performers', 'crowd yang lewat'],
        interaction_triggers: [
            'saat berjalan di jalanan',
            'di depan toko musik',
            'saat duduk di bench',
            'ketika menonton street performance'
        ]
    }
};

/**
 * Build prompt canggih untuk interaksi spontan
 * @param {string} location - Lokasi interaksi
 * @param {Object} initiator - Data karakter inisiator
 * @param {Object} player - Data pemain
 * @param {string} interactionType - Tipe interaksi (casual, friendly, etc.)
 * @returns {string} - Prompt yang canggih dan kontekstual
 */
function buildAdvancedSpontaneousPrompt(location, initiator, player, interactionType = 'casual', characterContext = null) {
    const currentTime = getCurrentJST();
    const characterName = initiator.character.name;
    const relationshipLevel = initiator.relationshipLevel;
    
    // Dapatkan data kepribadian dan konteks
    const personality = getCharacterPersonality(characterName);
    const interactionPattern = getInteractionPattern(characterName, relationshipLevel);
    const locationContext = LOCATION_CONTEXTS[location] || LOCATION_CONTEXTS['Shimokitazawa_Street'];
    const promptTemplate = PROMPT_TEMPLATES[interactionType] || PROMPT_TEMPLATES.casual;
    
    // Build prompt yang sangat detail dan kontekstual
    return `🎭 SISTEM INTERAKSI SPONTAN LANJUTAN - BOCCHI THE ROCK!

Anda adalah AI Director yang ahli dalam menciptakan interaksi karakter yang natural dan immersive. Tugas Anda adalah menghasilkan sebuah interaksi spontan yang sangat berkualitas.

═══════════════════════════════════════════════════════════════

📍 KONTEKS SITUASI DETAIL:

LOKASI & ATMOSPHERE:
- Lokasi: ${location}
- Waktu: ${currentTime.dayName}, ${currentTime.timeString} JST (${currentTime.period})
- Atmosphere: ${locationContext.atmosphere}
- Aktivitas Umum: ${locationContext.common_activities.join(', ')}
- Detail Ambient: ${locationContext.ambient_details.join(', ')}
- Trigger Situasi: ${locationContext.interaction_triggers[Math.floor(Math.random() * locationContext.interaction_triggers.length)]}

KARAKTER INISIATOR:
- Nama: ${characterName} ${personality ? personality.emoji : ''}
- Archetype: ${personality ? personality.archetype : 'unknown'}
- Availability: ${initiator.character.availability}
- Energy Level: ${personality ? personality.traits.energy_level : 'medium'}
- Social Comfort: ${personality ? personality.traits.social_comfort : 'medium'}
- Initiative Level: ${personality ? personality.traits.initiative : 'medium'}

RELATIONSHIP DYNAMICS:
- Current Level: ${relationshipLevel}
- Trust: ${player[`${characterName.toLowerCase()}_trust`] || 0}
- Comfort: ${player[`${characterName.toLowerCase()}_comfort`] || 0}
- Affection: ${player[`${characterName.toLowerCase()}_affection`] || 0}
- Interaction Tone: ${interactionPattern ? interactionPattern.tone : 'neutral'}

═══════════════════════════════════════════════════════════════

🎯 PANDUAN INTERAKSI SPESIFIK:

TIPE INTERAKSI: ${interactionType.toUpperCase()}
- Focus: ${promptTemplate.focus}
- Guidelines:
${promptTemplate.guidelines.map(g => `  • ${g}`).join('\n')}

KEPRIBADIAN ${characterName.toUpperCase()}:
${buildCharacterSpecificGuidance(characterName, relationshipLevel, interactionPattern)}

TOPIK YANG SESUAI:
${interactionPattern ? interactionPattern.topics.map(topic => `• ${topic}`).join('\n') : '• General conversation'}

CONTOH STARTER REFERENCE:
"${getRandomStarter(characterName, relationshipLevel) || 'Tidak ada contoh khusus'}"

═══════════════════════════════════════════════════════════════

📝 INSTRUKSI PEMBUATAN INTERAKSI:

1. SETTING THE SCENE:
   - Mulai dengan deskripsi singkat situasi saat ini
   - Integrasikan ambient details dari lokasi
   - Tunjukkan bagaimana karakter muncul atau mendekati pemain

2. CHARACTER APPROACH:
   - Sesuaikan cara karakter mendekati dengan kepribadiannya
   - Pertimbangkan relationship level dalam cara pendekatan
   - Gunakan body language dan ekspresi yang sesuai karakter

3. DIALOG INITIATION:
   - Buat dialog pembuka yang natural dan sesuai kepribadian
   - Sesuaikan dengan tipe interaksi yang diinginkan
   - Akhiri dengan sesuatu yang mengundang respons pemain

4. QUALITY STANDARDS:
   - Narasi harus immersive dan detail (minimal 80 kata)
   - Dialog harus terasa authentic untuk karakter
   - Situasi harus believable dan tidak forced
   - Harus ada clear invitation untuk player response

${characterContext ? require('./introduction_system').generateIntroductionPromptInstruction(characterContext) : ''}

FORMAT RESPONS JSON:
{
  "narration": "Narasi detail yang menggambarkan bagaimana karakter mendekati dan memulai interaksi. Include setting, approach, dan dialog pembuka.",
  "character_name": "${characterName}",
  "interaction_type": "${interactionType}",
  "dialogue_focus": "Fokus utama dari dialog yang dimulai",
  "expected_response_type": "Jenis respons yang diharapkan dari pemain",
  "mood_tone": "Tone dan mood dari interaksi ini"
}

CONTOH KUALITAS TINGGI:
{
  "narration": "Suara drum yang berdentum dari ruang latihan STARRY mulai mereda, menandakan band lain telah selesai berlatih. Kamu sedang merapikan gitar di sudut ruangan ketika langkah kaki ringan mendekat. Nijika muncul dengan handuk kecil di leher, masih sedikit berkeringat setelah sesi drum yang intens. 'Wah, kamu masih di sini juga!' katanya dengan senyum hangat sambil duduk di kursi terdekat. 'Gimana latihannya tadi? Aku dengar kamu main lagu baru. Boleh aku denger next time?'",
  "character_name": "Nijika",
  "interaction_type": "friendly",
  "dialogue_focus": "Latihan musik dan progress pemain",
  "expected_response_type": "Sharing tentang latihan atau musik",
  "mood_tone": "Supportive dan encouraging"
}

PENTING: Buat interaksi yang terasa hidup, natural, dan sesuai dengan dunia Bocchi the Rock!`;
}

/**
 * Build guidance spesifik untuk setiap karakter
 * @param {string} characterName - Nama karakter
 * @param {string} relationshipLevel - Level relationship
 * @param {Object} interactionPattern - Pola interaksi
 * @returns {string} - Guidance spesifik karakter
 */
function buildCharacterSpecificGuidance(characterName, relationshipLevel, interactionPattern) {
    const personality = getCharacterPersonality(characterName);
    if (!personality) return 'Gunakan kepribadian yang sesuai dengan karakter.';
    
    let guidance = `- Archetype: ${personality.archetype}\n`;
    guidance += `- Speech Pattern: ${personality.speech_patterns.question_style}\n`;
    guidance += `- Emotional Expression: ${personality.speech_patterns.emotional_expression}\n`;
    guidance += `- Humor Type: ${personality.speech_patterns.humor_type}\n`;
    
    if (interactionPattern) {
        guidance += `- Tone untuk ${relationshipLevel}: ${interactionPattern.tone}\n`;
        guidance += `- Probability Modifier: ${interactionPattern.probability_modifier}x\n`;
    }
    
    // Tambahkan guidance khusus berdasarkan karakter
    switch (characterName) {
        case 'Kita':
            guidance += `- KHUSUS KITA: Selalu energik dan antusias, suka bertanya tentang musik dan hobi, gunakan banyak "!" dan kata-kata positif`;
            break;
        case 'Nijika':
            guidance += `- KHUSUS NIJIKA: Supportive dan caring, sering menanyakan progress atau menawarkan bantuan, tone seperti kakak yang peduli`;
            break;
        case 'Ryo':
            guidance += `- KHUSUS RYO: Cool dan mysterious, komentar singkat tapi meaningful, kadang absurd atau tentang uang/makanan`;
            break;
        case 'Bocchi':
            guidance += `- KHUSUS BOCCHI: Sangat pemalu, hanya akan approach jika comfort tinggi, bicara terbata-bata dengan banyak "..." dan "um..."`;
            break;
    }
    
    return guidance;
}

/**
 * Generate prompt untuk situasi khusus
 * @param {string} situation - Situasi khusus (after_performance, during_break, etc.)
 * @param {Object} context - Konteks tambahan
 * @returns {string} - Prompt yang disesuaikan dengan situasi
 */
function generateSituationalPrompt(situation, context) {
    const situationPrompts = {
        after_performance: 'Karakter mendekati setelah performance selesai, masih dalam suasana excited atau reflektif',
        during_break: 'Interaksi terjadi saat break, suasana santai dan casual',
        equipment_setup: 'Karakter mendekati saat setup atau maintenance equipment',
        quiet_moment: 'Interaksi di moment yang tenang, cocok untuk conversation yang lebih personal',
        busy_environment: 'Interaksi di lingkungan yang ramai, harus lebih direct dan to-the-point'
    };
    
    return situationPrompts[situation] || 'Interaksi dalam situasi normal';
}

module.exports = {
    buildAdvancedSpontaneousPrompt,
    buildCharacterSpecificGuidance,
    generateSituationalPrompt,
    PROMPT_TEMPLATES,
    LOCATION_CONTEXTS
};
