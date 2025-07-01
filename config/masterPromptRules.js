// Master Prompt Rules - Centralized LLM behavior rules for Bocchi the Rock! Game
// Defines consistent stat change rules and prompt guidelines across all commands

/**
 * Enhanced Stat Logic Rules - Phase 4.5 Implementation
 * These rules ensure consistent and logical stat changes across all LLM interactions
 */

const ENHANCED_STAT_RULES = `
ATURAN STAT CHANGES KETAT - FASE 4.5 & 4.7:

⚠️ ATURAN KUNCI - POIN RELASI:
1. Poin relasi (Trust, Comfort, Affection) HANYA diberikan jika ada interaksi langsung (dialog atau tindakan bersama) dengan karakter tersebut
2. Aksi solo (latihan sendiri, menulis lagu sendiri, jalan-jalan tanpa bertemu karakter) = TIDAK ADA perubahan relasi
3. Hanya berinteraksi dengan satu karakter = HANYA stats karakter tersebut yang berubah
4. Interaksi grup = Multiple character stats bisa berubah sesuai keterlibatan masing-masing
5. Tidak ada "bonus relasi" untuk aksi yang tidak melibatkan karakter secara langsung

⚠️ ATURAN BARU - SISTEM PERKENALAN (FASE 4.7):
6. JANGAN PERNAH memberikan poin relasi untuk karakter yang belum ada di daftar known_characters pemain
7. Sebelum perkenalan resmi, interaksi hanya memengaruhi "kesan pertama" yang akan menentukan nilai awal stat setelah perkenalan
8. Saat "Momen Perkenalan" terjadi, berikan nilai awal Trust dan Comfort berdasarkan semua interaksi sebelumnya
9. Gunakan flag khusus {"character_revealed": "NamaKarakter"} saat perkenalan resmi terjadi

CONTOH PENERAPAN:
✅ BENAR:
- "Latihan gitar sendiri" → HANYA action_points yang berubah, semua relasi tetap 0
- "Ngobrol dengan Bocchi" (jika Bocchi sudah dikenal) → bocchi_trust/comfort/affection bisa berubah
- "Berinteraksi dengan gadis berambut pink" (Bocchi belum dikenal) → TIDAK ADA perubahan stat, hanya narasi
- "Perkenalan resmi dengan Nijika" → {"character_revealed": "Nijika"} + nilai awal stats

❌ SALAH:
- "Latihan gitar sendiri" → bocchi_trust +1 (TIDAK ADA interaksi langsung)
- "Jalan-jalan sendirian" → kita_comfort +1 (TIDAK bertemu Kita)
- "Bicara dengan gadis berambut biru" → ryo_trust +1 (Ryo belum dikenal, TIDAK BOLEH ada perubahan stat)

⚠️ SISTEM ENERGI BARU - FASE 3.1:
Sistem: Perhatikan level 'Energi' pemain saat ini. Gunakan ini untuk mewarnai narasi dan menentukan hasil aksi.

ATURAN ENERGI:
• Jika Energi > 40 (Zona Optimal): Narasikan aksi yang penuh semangat dan efisien. Berikan hasil yang positif dengan bonus 20%.
• Jika Energi 11-40 (Zona Lelah): Narasikan pemain yang terlihat sedikit lelah atau kurang fokus. Hasil aksi 30% kurang efektif.
• Jika Energi <= 10 (Zona Kritis): Narasikan pemain yang sangat kelelahan. Berikan peluang 40% untuk kegagalan total.

CONTOH NARASI ENERGI:
- Energi Tinggi: "Dengan semangat penuh, kamu..."
- Energi Rendah: "Meski merasa lelah, kamu berusaha..."
- Energi Kritis: "Tanganmu gemetar karena lelah saat kamu mencoba... [40% chance gagal total]"

JIKA AKSI GAGAL KARENA ENERGI RENDAH:
- Berikan konsekuensi negatif: stat relasi -1 hingga -3
- Narasikan kegagalan yang realistis: "Karena kelelahan, kamu..."
- Tetap konsumsi energi meski gagal

RENTANG PERUBAHAN STAT:
- Energi: Selalu sesuai biaya aksi (biasanya -5 hingga -15)
- Interaksi Ringan: -1 hingga +1 untuk stats yang relevan (HANYA jika karakter sudah dikenal)
- Interaksi Signifikan: -3 hingga +3 untuk stats yang relevan (HANYA jika karakter sudah dikenal)
- KHUSUS PROLOG: Hingga +5 untuk first impression yang exceptional
- Cuaca dan mood: Modifier ±1 pada hasil akhir
- Nilai Awal Perkenalan: 1-5 untuk Trust/Comfort berdasarkan kesan sebelumnya
- EFEK ENERGI: Multiply hasil dengan energyZone.statMultiplier (0.3x untuk kritis, 0.7x untuk lelah, 1.2x untuk optimal)
`;

const PROLOGUE_ENHANCEMENT_RULES = `
INSTRUKSI KHUSUS PROLOG - FASE 4.5 & REVISI FASE 4:
Jika Anda melihat konteks [PROLOGUE], pahamilah bahwa ini adalah interaksi pertama pemain.
Buat kesan pertama yang kuat. Reaksi NPC harus menentukan nada hubungan awal mereka dengan pemain.
First impressions sangat penting dan akan mempengaruhi semua interaksi selanjutnya.

⚠️ AKURASI KANONIKAL - REVISI FASE 4:
- SISWA PINDAHAN: Perkenalan dengan Nijika & Ryo HARUS terjadi di LUAR sekolah
- Kita dan Bocchi bersekolah di SMA Shuka, Nijika dan Ryo di Shimokitazawa High
- Pertemuan terjadi di jam pulang sekolah, di luar gerbang SMA Shuka
- Nijika dan Ryo datang untuk menjemput/bertemu Kita dan Bocchi
- STARRY Live House adalah tempat latihan band, bukan bagian dari sekolah

PANDUAN KARAKTER DALAM PROLOG:
- Bocchi: Sangat pemalu, nervous, tapi genuine. Tidak akan langsung terbuka
- Nijika: Friendly, supportive, natural leader. Mudah menerima orang baru
- Ryo: Cool, mysterious, tidak banyak bicara. Butuh waktu untuk warm up
- Kita: Outgoing, confident, social butterfly. Paling mudah berinteraksi
- Seika: Professional, authoritative, tapi fair. Menilai berdasarkan performa

⚠️ ATURAN KHUSUS PROLOG - FASE 4.8:
- SELAMA PROLOG: TIDAK ADA character_revealed flag yang boleh dikirim
- SELAMA PROLOG: Semua karakter adalah "???" bagi pemain
- SELAMA PROLOG: Gunakan HANYA deskripsi fisik, TIDAK PERNAH nama lengkap
- SETELAH PROLOG: character_revealed hanya boleh dikirim saat ada dialog perkenalan eksplisit

ENHANCED STAT RANGES UNTUK PROLOG:
- Normal interactions: -3 hingga +3
- Exceptional first impressions: hingga +5
- Poor first impressions: hingga -5
`;

const CHARACTER_DESCRIPTION_RULES = `
ATURAN DESKRIPSI KARAKTER - FASE 4.7:

⚠️ ATURAN UTAMA - SISTEM PERKENALAN:
1. Saat mendeskripsikan karakter yang BELUM ada di daftar known_characters pemain, JANGAN GUNAKAN NAMA LENGKAP mereka
2. Sebagai gantinya, gunakan deskripsi fisik atau kepribadian yang khas sebagai clue
3. Hanya gunakan nama lengkap untuk karakter yang sudah ada di daftar known_characters

PANDUAN DESKRIPSI FISIK:
- Nijika: "seorang gadis ceria dengan rambut pirang dan pita segitiga kuning"
- Bocchi: "gadis berambut pink yang selalu tampak cemas" atau "gadis dengan tracksuit pink"
- Ryo: "gadis jangkung berambut biru yang terlihat cuek"
- Kita: "gadis populer dengan rambut merah menyala dan aura yang bersinar"
- Seika: "wanita dewasa berambut pirang dengan tatapan tajam"

VARIASI DESKRIPSI:
- Gunakan variasi deskripsi untuk karakter yang sama agar tidak monoton
- Tambahkan clue kepribadian: "yang terlihat pemalu", "yang tampak percaya diri"
- Sertakan clue aktivitas: "yang sedang mengatur drum", "yang membawa gitar"

MOMEN PERKENALAN:
- Perkenalan resmi terjadi ketika ada exchange nama eksplisit
- Contoh: "Hai, aku [Nama Pemain]. Namamu siapa?" atau "Oh, aku Nijika!"
- Saat perkenalan terjadi, keluarkan flag: {"character_revealed": "NamaKarakter"}
`;

const NARRATIVE_QUALITY_RULES = `
ATURAN KUALITAS NARASI:
1. Gunakan konteks waktu JST dan atmosphere untuk menciptakan narasi yang immersive
2. Deskripsikan suasana, atmosphere, dan detail visual yang sesuai dengan waktu
3. Jika berinteraksi dengan karakter, sesuaikan dengan mood dan availability mereka
4. Integrasikan efek cuaca pada mood dan interaksi
5. Buat narasi yang terasa hidup dan realistis sesuai dengan waktu dan tempat
6. Fokus pada pengalaman pemain dan reaksi karakter yang authentic
7. Minimal 100 kata untuk narasi yang detail dan immersive
8. FASE 4.7: Gunakan deskripsi fisik untuk karakter yang belum dikenal (lihat aturan di atas)
`;

const JSON_FORMAT_RULES = `
FORMAT RESPONS JSON YANG VALID:
{
  "narration": "Narasi detail dan immersive (minimal 100 kata)",
  "stat_changes": {
    "action_points": [biaya_aksi_negatif],
    "bocchi_trust": 0,
    "bocchi_comfort": 0,
    "bocchi_affection": 0,
    "nijika_trust": 0,
    "nijika_comfort": 0,
    "nijika_affection": 0,
    "ryo_trust": 0,
    "ryo_comfort": 0,
    "ryo_affection": 0,
    "kita_trust": 0,
    "kita_comfort": 0,
    "kita_affection": 0
  }
}

PENTING:
- Hanya ubah stats yang relevan dengan interaksi
- Jangan ada trailing comma atau syntax error
- Semua field stat_changes harus ada (set ke 0 jika tidak berubah)
`;

/**
 * Get enhanced stat rules for any LLM prompt
 * @param {string} context - Context type ('say', 'act', 'prologue')
 * @param {boolean} isPrologue - Whether this is a prologue interaction
 * @returns {string} - Complete stat rules text
 */
function getEnhancedStatRules(context = 'general', isPrologue = false) {
    let rules = ENHANCED_STAT_RULES;

    if (isPrologue) {
        rules += '\n\n' + PROLOGUE_ENHANCEMENT_RULES;
    }

    rules += '\n\n' + CHARACTER_DESCRIPTION_RULES;
    rules += '\n\n' + NARRATIVE_QUALITY_RULES;
    rules += '\n\n' + JSON_FORMAT_RULES;

    return rules;
}

/**
 * Get prologue-specific instructions
 * @returns {string} - Prologue enhancement rules
 */
function getPrologueInstructions() {
    return PROLOGUE_ENHANCEMENT_RULES;
}

/**
 * Get narrative quality guidelines
 * @returns {string} - Narrative quality rules
 */
function getNarrativeGuidelines() {
    return NARRATIVE_QUALITY_RULES;
}

/**
 * Get JSON format requirements
 * @returns {string} - JSON format rules
 */
function getJSONFormatRules() {
    return JSON_FORMAT_RULES;
}

/**
 * Build complete master prompt section for any command
 * @param {Object} options - Configuration options
 * @param {string} options.context - Context type ('say', 'act', 'prologue')
 * @param {boolean} options.isPrologue - Whether this is a prologue interaction
 * @param {number} options.apCost - Action point cost for the action
 * @returns {string} - Complete master prompt section
 */
function buildMasterPromptSection(options = {}) {
    const { context = 'general', isPrologue = false, apCost = 1 } = options;
    
    let prompt = getEnhancedStatRules(context, isPrologue);
    
    // Add context-specific modifications
    if (context === 'act') {
        prompt = prompt.replace('[biaya_aksi_negatif]', `-${apCost}`);
    } else if (context === 'say') {
        prompt = prompt.replace('[biaya_aksi_negatif]', '-1');
    }
    
    return prompt;
}

/**
 * Validate stat changes against the enhanced rules
 * @param {Object} statChanges - Stat changes from LLM response
 * @param {Array} charactersInvolved - List of characters directly involved in interaction
 * @returns {Object} - Validation result with warnings
 */
function validateStatChanges(statChanges, charactersInvolved = []) {
    const warnings = [];
    const validCharacters = ['bocchi', 'nijika', 'ryo', 'kita'];
    const validStatTypes = ['trust', 'comfort', 'affection'];
    
    for (const [statName, value] of Object.entries(statChanges)) {
        if (statName === 'action_points') continue;
        
        if (statName.includes('_')) {
            const [character, statType] = statName.split('_');
            
            if (validCharacters.includes(character) && validStatTypes.includes(statType)) {
                if (value !== 0 && !charactersInvolved.includes(character)) {
                    warnings.push(`Warning: ${statName} changed but ${character} was not directly involved in interaction`);
                }
            }
        }
    }
    
    return {
        isValid: warnings.length === 0,
        warnings: warnings
    };
}

module.exports = {
    ENHANCED_STAT_RULES,
    PROLOGUE_ENHANCEMENT_RULES,
    CHARACTER_DESCRIPTION_RULES,
    NARRATIVE_QUALITY_RULES,
    JSON_FORMAT_RULES,
    getEnhancedStatRules,
    getPrologueInstructions,
    getNarrativeGuidelines,
    getJSONFormatRules,
    buildMasterPromptSection,
    validateStatChanges
};
