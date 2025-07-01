// Situation Director - Advanced AI system for generating contextual action choices
// Implements sophisticated logic for creating dynamic, relevant, and engaging action options

const { getCurrentJST } = require('../utils/time');
const { getWeatherEffects } = require('./weather');

/**
 * Advanced Situation Director for generating contextual action choices
 */
class SituationDirector {
    
    /**
     * Build comprehensive Situation Director prompt
     * @param {Object} context - Complete situation context
     * @returns {string} - Advanced prompt for LLM
     */
    static buildAdvancedPrompt(context) {
        const timeAnalysis = this.analyzeTimeContext(context.time);
        const locationAnalysis = this.analyzeLocationContext(context.location, context.time);
        const socialAnalysis = this.analyzeSocialContext(context.characters_present, context.player_stats);
        const weatherAnalysis = this.analyzeWeatherContext(context.weather);
        const progressionAnalysis = this.analyzeProgressionContext(context.player_stats, context.origin_story);
        const energyAnalysis = this.analyzeEnergyContext(context.player_stats.energy || 100);

        return `🎭 SITUATION DIRECTOR - BOCCHI THE ROCK! DYNAMIC ACTION SYSTEM

Anda adalah Sutradara Situasi tingkat ahli untuk game simulasi immersive "Bocchi the Rock!". Tugas Anda adalah menganalisis konteks situasi secara mendalam dan menghasilkan 3-5 pilihan aksi yang:
- Sangat relevan dengan situasi saat ini
- Menawarkan variasi gameplay yang menarik
- Mempertimbangkan semua aspek konteks
- Memberikan pilihan yang meaningful dan impactful

═══════════════════════════════════════════════════════════════

📍 ANALISIS KONTEKS SITUASI:

${timeAnalysis}

${locationAnalysis}

${socialAnalysis}

${weatherAnalysis}

${progressionAnalysis}

${energyAnalysis}

═══════════════════════════════════════════════════════════════

🎯 ATURAN PEMBUATAN AKSI LANJUTAN:

KATEGORI AKSI:
1. 🎵 MUSIK: Latihan, komposisi, performance, jam session
2. 💬 SOSIAL: Dialog, interaksi grup, networking, bonding
3. 🔍 EKSPLORASI: Jelajahi lokasi, temukan hal baru, observasi
4. 💭 REFLEKTIF: Introspeksi, planning, journaling, meditasi
5. ⚡ PEMULIHAN: Istirahat, makan, minum, relaksasi (FASE 3.1)
5. 🎯 PRODUKTIF: Kerja, belajar, skill development, achievement
6. 🎪 SPONTAN: Aksi unik berdasarkan situasi khusus

BIAYA AP GUIDELINES:
- 1 AP: Aksi ringan, observasi, chat singkat
- 2 AP: Aksi standar, latihan ringan, eksplorasi
- 3 AP: Aksi menengah, interaksi mendalam, latihan serius
- 4 AP: Aksi berat, performance, kerja intensif
- 5+ AP: Aksi khusus, event besar, tantangan signifikan

KUALITAS AKSI:
- Setiap aksi harus memiliki konsekuensi yang jelas
- Pertimbangkan personality pemain dan karakter
- Buat aksi yang bisa mempengaruhi relationship dynamics
- Sertakan aksi yang sesuai dengan mood dan atmosphere
- Berikan mix antara safe choices dan risk/reward options

═══════════════════════════════════════════════════════════════

📋 TEMPLATE RESPONS:

WAJIB: Keluarkan HANYA array JSON tanpa teks tambahan apapun.

[
  {
    "id": "action_id_unique",
    "label": "Nama Aksi yang Menarik dan Deskriptif",
    "ap_cost": [1-5],
    "category": "musik|sosial|eksplorasi|reflektif|produktif|spontan",
    "risk_level": "safe|medium|risky",
    "potential_characters": ["character_names_if_applicable"]
  }
]

CONTOH RESPONS BERKUALITAS:
[
  {
    "id": "practice_guitar_corner",
    "label": "Latihan Gitar di Sudut Tenang",
    "ap_cost": 2,
    "category": "musik",
    "risk_level": "safe",
    "potential_characters": []
  },
  {
    "id": "approach_nijika_drums",
    "label": "Dekati Nijika yang Sedang Setup Drum",
    "ap_cost": 1,
    "category": "sosial",
    "risk_level": "safe",
    "potential_characters": ["nijika"]
  },
  {
    "id": "explore_starry_backstage",
    "label": "Jelajahi Area Backstage STARRY",
    "ap_cost": 3,
    "category": "eksplorasi",
    "risk_level": "medium",
    "potential_characters": []
  }
]`;
    }
    
    /**
     * Analyze time context for action generation
     */
    static analyzeTimeContext(timeContext) {
        const { day, time_string, period, hour } = timeContext;
        
        let analysis = `⏰ ANALISIS WAKTU:
- Hari: ${day}, ${time_string} JST (${period})
- Jam: ${hour}:00`;

        // Time-specific insights
        if (hour >= 6 && hour < 12) {
            analysis += `
- Suasana: Pagi hari, energi fresh, cocok untuk aktivitas produktif
- Karakter: Kemungkinan baru bangun atau persiapan hari
- Aksi Cocok: Latihan ringan, planning, persiapan`;
        } else if (hour >= 12 && hour < 17) {
            analysis += `
- Suasana: Siang hari, aktivitas peak, banyak interaksi
- Karakter: Aktif, available untuk kolaborasi
- Aksi Cocok: Sosial, kerja, latihan intensif`;
        } else if (hour >= 17 && hour < 22) {
            analysis += `
- Suasana: Sore/malam, prime time untuk musik dan performance
- Karakter: Siap untuk jam session, performance
- Aksi Cocok: Musik, performance, deep conversation`;
        } else {
            analysis += `
- Suasana: Malam larut, atmosfer intimate, reflektif
- Karakter: Mungkin terbatas, mood lebih personal
- Aksi Cocok: Refleksi, latihan solo, conversation mendalam`;
        }

        // Day-specific insights
        if (['Sabtu', 'Minggu'].includes(day)) {
            analysis += `
- Weekend: Lebih santai, waktu untuk eksplorasi dan fun activities`;
        } else {
            analysis += `
- Weekday: Lebih terstruktur, fokus pada produktivitas dan development`;
        }

        return analysis;
    }
    
    /**
     * Analyze location context for action generation
     */
    static analyzeLocationContext(location, timeContext) {
        let analysis = `📍 ANALISIS LOKASI: ${location}`;
        
        switch (location) {
            case 'STARRY':
                analysis += `
- Tipe: Live house profesional, pusat musik indie
- Fasilitas: Stage, sound system, instrumen, backstage
- Atmosphere: Energik, kreatif, kolaboratif
- Aksi Tersedia: Performance, latihan band, networking, kerja
- Karakter Umum: Staff STARRY, musisi, Kessoku Band members
- Waktu ${timeContext.period}: ${this.getLocationTimeSpecific('STARRY', timeContext.hour)}`;
                break;
                
            case 'School':
                analysis += `
- Tipe: Sekolah menengah atas, lingkungan akademik
- Fasilitas: Kelas, koridor, kantin, klub musik
- Atmosphere: Terstruktur, sosial, youth energy
- Aksi Tersedia: Belajar, sosial, klub activities, eksplorasi
- Karakter Umum: Siswa, guru, teman sekelas
- Waktu ${timeContext.period}: ${this.getLocationTimeSpecific('School', timeContext.hour)}`;
                break;
                
            case 'Shimokitazawa_Street':
                analysis += `
- Tipe: Jalanan indie culture district, area publik
- Fasilitas: Toko musik, cafe, street performance spots
- Atmosphere: Bohemian, artistic, dinamis
- Aksi Tersedia: Eksplorasi, street performance, shopping, observasi
- Karakter Umum: Musisi jalanan, shopkeeper, random encounters
- Waktu ${timeContext.period}: ${this.getLocationTimeSpecific('Shimokitazawa_Street', timeContext.hour)}`;
                break;
                
            default:
                analysis += `
- Tipe: Lokasi umum
- Atmosphere: Netral, berbagai kemungkinan
- Aksi Tersedia: Tergantung konteks spesifik`;
        }
        
        return analysis;
    }
    
    /**
     * Get location-specific insights based on time
     */
    static getLocationTimeSpecific(location, hour) {
        const timeInsights = {
            'STARRY': {
                morning: 'Sepi, persiapan, cleaning, setup',
                afternoon: 'Latihan band, sound check, persiapan show',
                evening: 'Prime time, live shows, audience, energi tinggi',
                night: 'After party, intimate sessions, cleanup'
            },
            'School': {
                morning: 'Kelas aktif, siswa energik, aktivitas akademik',
                afternoon: 'Klub activities, after school, sosial time',
                evening: 'Sepi, mungkin ada klub malam, security',
                night: 'Tutup, tidak accessible'
            },
            'Shimokitazawa_Street': {
                morning: 'Tenang, toko buka, commuter traffic',
                afternoon: 'Ramai, shopping, street performance',
                evening: 'Peak activity, live music, crowd',
                night: 'Bar scene, intimate venues, night life'
            }
        };
        
        let period;
        if (hour >= 6 && hour < 12) period = 'morning';
        else if (hour >= 12 && hour < 17) period = 'afternoon';
        else if (hour >= 17 && hour < 22) period = 'evening';
        else period = 'night';
        
        return timeInsights[location]?.[period] || 'Aktivitas normal sesuai waktu';
    }
    
    /**
     * Analyze social context and character availability
     */
    static analyzeSocialContext(charactersPresent, playerStats) {
        let analysis = `👥 ANALISIS SOSIAL:`;
        
        if (charactersPresent.length === 0) {
            analysis += `
- Status: Solo, tidak ada karakter khusus di sekitar
- Opportunity: Fokus pada self-development, introspeksi
- Aksi Cocok: Solo activities, skill building, exploration`;
        } else {
            analysis += `
- Karakter Hadir: ${charactersPresent.length} orang`;
            
            charactersPresent.forEach(char => {
                const charStats = this.getCharacterStats(char.name, playerStats);
                analysis += `
  • ${char.name} (${char.availability}): Trust ${charStats.trust}, Comfort ${charStats.comfort}, Affection ${charStats.affection}`;
            });
            
            analysis += `
- Opportunity: Interaksi sosial, relationship building
- Aksi Cocok: Dialog, kolaborasi, group activities`;
        }
        
        // Relationship analysis
        const relationshipInsights = this.analyzeRelationshipLevels(playerStats);
        analysis += `\n\n💝 RELATIONSHIP INSIGHTS:\n${relationshipInsights}`;
        
        return analysis;
    }
    
    /**
     * Get character stats from player stats
     */
    static getCharacterStats(characterName, playerStats) {
        const charKey = characterName.toLowerCase();
        return {
            trust: playerStats[`${charKey}_trust`] || 0,
            comfort: playerStats[`${charKey}_comfort`] || 0,
            affection: playerStats[`${charKey}_affection`] || 0
        };
    }
    
    /**
     * Analyze relationship levels for insights
     */
    static analyzeRelationshipLevels(playerStats) {
        const characters = ['bocchi', 'nijika', 'ryo', 'kita'];
        let insights = '';
        
        characters.forEach(char => {
            const trust = playerStats[`${char}_trust`] || 0;
            const comfort = playerStats[`${char}_comfort`] || 0;
            const affection = playerStats[`${char}_affection`] || 0;
            const total = trust + comfort + affection;
            
            let level = 'Stranger';
            if (total >= 15) level = 'Close Friend';
            else if (total >= 10) level = 'Good Friend';
            else if (total >= 5) level = 'Acquaintance';
            else if (total >= 1) level = 'Met';
            
            insights += `- ${char.charAt(0).toUpperCase() + char.slice(1)}: ${level} (Total: ${total})\n`;
        });
        
        return insights;
    }
    
    /**
     * Analyze weather context for action generation
     */
    static analyzeWeatherContext(weatherContext) {
        const { name, mood } = weatherContext;
        
        let analysis = `🌤️ ANALISIS CUACA:
- Cuaca: ${name} (${mood})`;
        
        // Weather-specific action suggestions
        switch (mood) {
            case 'cheerful':
                analysis += `
- Mood Impact: Positif, energik, optimis
- Aksi Cocok: Outdoor activities, social interaction, upbeat music
- Bonus: +1 untuk aksi sosial dan eksplorasi`;
                break;
            case 'melancholic':
                analysis += `
- Mood Impact: Reflektif, introspektif, emotional
- Aksi Cocok: Solo practice, deep conversation, emotional music
- Bonus: +1 untuk aksi reflektif dan musik emotional`;
                break;
            case 'cozy':
                analysis += `
- Mood Impact: Nyaman, intimate, warm
- Aksi Cocok: Indoor activities, close conversation, acoustic music
- Bonus: +1 untuk aksi indoor dan bonding`;
                break;
            default:
                analysis += `
- Mood Impact: Netral, balanced
- Aksi Cocok: Semua jenis aktivitas seimbang`;
        }
        
        return analysis;
    }
    
    /**
     * Analyze player progression context
     */
    static analyzeProgressionContext(playerStats, originStory) {
        let analysis = `📈 ANALISIS PROGRESSION:
- Origin Story: ${originStory}
- Action Points: ${playerStats.action_points}/10`;
        
        // Origin-specific insights
        switch (originStory) {
            case 'pekerja_starry':
                analysis += `
- Background: Staff STARRY, familiar dengan live house environment
- Strengths: Akses ke fasilitas, koneksi dengan staff
- Growth Areas: Skill musik, relationship dengan band members`;
                break;
            case 'siswa_pindahan':
                analysis += `
- Background: Transfer student, new to environment
- Strengths: Fresh perspective, academic background
- Growth Areas: Social integration, finding place in music scene`;
                break;
            case 'musisi_jalanan':
                analysis += `
- Background: Street musician, independent artist
- Strengths: Performance experience, street smart
- Growth Areas: Professional networking, studio experience`;
                break;
        }
        
        // AP-based recommendations
        if (playerStats.action_points <= 2) {
            analysis += `
- Energy Level: Low, recommend light activities (1-2 AP)`;
        } else if (playerStats.action_points <= 5) {
            analysis += `
- Energy Level: Medium, mix of light and moderate activities`;
        } else {
            analysis += `
- Energy Level: High, dapat handle aktivitas berat (3-5 AP)`;
        }
        
        return analysis;
    }

    /**
     * FASE 3.1: Analyze energy context for action generation
     */
    static analyzeEnergyContext(energy) {
        const { getEnergyZone } = require('../database');
        const energyZone = getEnergyZone(energy);

        let analysis = `⚡ ANALISIS ENERGI: ${energy}/100 (${energyZone.name})`;

        analysis += `
- Status: ${energyZone.description}
- Zona: ${energyZone.zone}
- Performa: ${Math.round(energyZone.statMultiplier * 100)}% dari normal
- Risiko Gagal: ${Math.round(energyZone.failureChance * 100)}%`;

        // Rekomendasi aksi berdasarkan energi
        if (energyZone.zone === 'optimal') {
            analysis += `
- Rekomendasi: Semua jenis aksi tersedia, performa optimal
- Fokus: Aksi produktif, interaksi sosial, tantangan baru`;
        } else if (energyZone.zone === 'tired') {
            analysis += `
- Rekomendasi: Aksi ringan hingga sedang, hindari yang terlalu berat
- Fokus: Aktivitas santai, pemulihan ringan, interaksi casual
- SERTAKAN: 1-2 opsi pemulihan energi (istirahat, minum, snack)`;
        } else {
            analysis += `
- Rekomendasi: PRIORITASKAN aksi pemulihan energi!
- Fokus: Istirahat, tidur, makan, relaksasi
- WAJIB SERTAKAN: 2-3 opsi pemulihan energi yang kuat
- Peringatan: Aksi berat sangat berisiko gagal dan merugikan`;
        }

        return analysis;
    }
}

module.exports = SituationDirector;
