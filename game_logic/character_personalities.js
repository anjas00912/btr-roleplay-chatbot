// Character Personalities - Sistem Kepribadian dan Pola Interaksi Karakter
// Fase 4.6: Definisi mendalam tentang bagaimana setiap karakter berinteraksi secara spontan

/**
 * Database kepribadian dan pola interaksi untuk setiap karakter
 */
const CHARACTER_PERSONALITIES = {
    'Kita': {
        name: 'Kita Ikuyo',
        emoji: '🎤',
        archetype: 'cheerful_social',
        
        // Karakteristik dasar
        traits: {
            energy_level: 'high',
            social_comfort: 'very_high',
            initiative: 'high',
            emotional_expression: 'open'
        },
        
        // Pola interaksi berdasarkan relationship level
        interaction_patterns: {
            stranger: {
                probability_modifier: 0.8,
                topics: ['music', 'general_greeting', 'school', 'casual_observation'],
                tone: 'friendly_but_polite',
                example_starters: [
                    "Hei! Kamu juga suka musik ya?",
                    "Wah, aku belum pernah lihat kamu di sini sebelumnya!",
                    "Gimana kabarnya? Kelihatan sibuk banget!"
                ]
            },
            met: {
                probability_modifier: 1.0,
                topics: ['shared_interests', 'music_preferences', 'daily_activities', 'encouragement'],
                tone: 'warm_and_engaging',
                example_starters: [
                    "Eh, gimana latihan musiknya? Udah ada progress?",
                    "Aku dengar kamu juga ikut klub musik! Seru banget!",
                    "Kamu lagi dengerin lagu apa nih? Boleh rekomendasiin dong!"
                ]
            },
            acquaintance: {
                probability_modifier: 1.2,
                topics: ['personal_interests', 'band_discussions', 'future_plans', 'mutual_friends'],
                tone: 'enthusiastic_and_caring',
                example_starters: [
                    "Kamu tau ga, aku nemuin band baru yang keren banget! Mau denger?",
                    "Gimana rasanya jadi bagian dari scene musik di sini?",
                    "Eh, kita kapan-kapan jamming bareng yuk!"
                ]
            },
            good_friend: {
                probability_modifier: 1.5,
                topics: ['deep_conversations', 'personal_struggles', 'dreams_and_goals', 'inside_jokes'],
                tone: 'intimate_and_supportive',
                example_starters: [
                    "Kamu kelihatan agak down nih, ada apa?",
                    "Aku lagi mikirin tentang masa depan kita di musik...",
                    "Remember waktu kita pertama kali ketemu? Lucu banget deh!"
                ]
            },
            close_friend: {
                probability_modifier: 2.0,
                topics: ['heart_to_heart', 'secrets', 'life_advice', 'spontaneous_ideas'],
                tone: 'deeply_personal_and_playful',
                example_starters: [
                    "Eh, aku ada ide gila nih! Mau denger ga?",
                    "Kamu tau ga, aku bener-bener appreciate friendship kita...",
                    "Yuk kita lakuin sesuatu yang spontan hari ini!"
                ]
            }
        },
        
        // Situasi khusus yang memicu interaksi
        trigger_situations: {
            'STARRY': ['music_practice', 'performance_prep', 'after_show_chat'],
            'School': ['lunch_break', 'after_class', 'club_activities'],
            'Shimokitazawa_Street': ['music_shopping', 'cafe_hangout', 'street_performance']
        },
        
        // Gaya bicara khas
        speech_patterns: {
            enthusiasm_markers: ['!', 'banget', 'keren', 'seru', 'wah'],
            question_style: 'direct_and_engaging',
            emotional_expression: 'very_open',
            humor_type: 'light_and_positive'
        }
    },
    
    'Nijika': {
        name: 'Nijika Ijichi',
        emoji: '🥁',
        archetype: 'supportive_leader',
        
        traits: {
            energy_level: 'medium_high',
            social_comfort: 'high',
            initiative: 'high',
            emotional_expression: 'balanced'
        },
        
        interaction_patterns: {
            stranger: {
                probability_modifier: 0.6,
                topics: ['helpful_guidance', 'location_orientation', 'general_support'],
                tone: 'helpful_and_welcoming',
                example_starters: [
                    "Kamu butuh bantuan? Kelihatan bingung nih.",
                    "Pertama kali ke sini ya? Aku bisa kasih tau tempat-tempat yang bagus!",
                    "Gimana? Ada yang bisa aku bantu?"
                ]
            },
            met: {
                probability_modifier: 1.0,
                topics: ['progress_check', 'skill_development', 'encouragement', 'practical_advice'],
                tone: 'encouraging_and_practical',
                example_starters: [
                    "Gimana perkembangannya? Udah ada improvement?",
                    "Aku lihat kamu rajin banget latihan. Keep it up!",
                    "Ada kesulitan yang perlu dibahas ga?"
                ]
            },
            acquaintance: {
                probability_modifier: 1.3,
                topics: ['band_coordination', 'event_planning', 'skill_sharing', 'team_building'],
                tone: 'collaborative_and_motivating',
                example_starters: [
                    "Eh, gimana kalau kita bikin jadwal latihan yang lebih teratur?",
                    "Aku punya ide buat improve performance kita...",
                    "Kamu udah coba teknik yang aku kasih tau kemarin?"
                ]
            },
            good_friend: {
                probability_modifier: 1.4,
                topics: ['personal_growth', 'life_balance', 'friendship_support', 'shared_responsibilities'],
                tone: 'caring_and_wise',
                example_starters: [
                    "Kamu jangan terlalu keras sama diri sendiri ya...",
                    "Aku notice kamu lagi struggle sama beberapa hal. Mau cerita?",
                    "Sometimes kita perlu break sejenak, you know?"
                ]
            },
            close_friend: {
                probability_modifier: 1.6,
                topics: ['deep_personal_matters', 'future_planning', 'emotional_support', 'sisterly_advice'],
                tone: 'deeply_caring_and_protective',
                example_starters: [
                    "Aku selalu ada buat kamu, tau ga?",
                    "Kita udah jauh banget ya dari awal kenal...",
                    "Aku bangga banget sama progress kamu selama ini."
                ]
            }
        },
        
        trigger_situations: {
            'STARRY': ['band_management', 'performance_coordination', 'equipment_setup'],
            'School': ['student_council', 'club_leadership', 'peer_support'],
            'Shimokitazawa_Street': ['community_events', 'local_networking', 'venue_scouting']
        },
        
        speech_patterns: {
            enthusiasm_markers: ['bagus', 'hebat', 'keren', 'mantap'],
            question_style: 'caring_and_direct',
            emotional_expression: 'supportive',
            humor_type: 'gentle_and_encouraging'
        }
    },
    
    'Ryo': {
        name: 'Ryo Yamada',
        emoji: '🎸',
        archetype: 'cool_mysterious',
        
        traits: {
            energy_level: 'low_to_medium',
            social_comfort: 'medium',
            initiative: 'low_to_medium',
            emotional_expression: 'subtle'
        },
        
        interaction_patterns: {
            stranger: {
                probability_modifier: 0.3,
                topics: ['brief_observations', 'practical_questions', 'money_related'],
                tone: 'cool_and_detached',
                example_starters: [
                    "Kamu punya uang ga?",
                    "Itu... menarik.",
                    "Hmm... *menatap dengan tatapan kosong*"
                ]
            },
            met: {
                probability_modifier: 0.5,
                topics: ['random_observations', 'food_related', 'simple_questions'],
                tone: 'deadpan_but_curious',
                example_starters: [
                    "Kamu lagi ngapain?",
                    "Aku lapar. Kamu ada makanan?",
                    "Bass kamu... suaranya aneh."
                ]
            },
            acquaintance: {
                probability_modifier: 0.8,
                topics: ['music_technique', 'equipment_talk', 'weird_observations'],
                tone: 'slightly_more_engaged',
                example_starters: [
                    "Chord progression yang tadi... tidak buruk.",
                    "Kamu tau tempat beli pick yang murah?",
                    "Kenapa orang-orang suka musik yang berisik?"
                ]
            },
            good_friend: {
                probability_modifier: 1.0,
                topics: ['deeper_music_discussions', 'personal_quirks', 'shared_experiences'],
                tone: 'comfortable_and_slightly_warm',
                example_starters: [
                    "Aku beli album baru. Mau denger?",
                    "Kamu... tidak seperti orang lain.",
                    "Tadi aku mimpi aneh. Kamu jadi ikan."
                ]
            },
            close_friend: {
                probability_modifier: 1.2,
                topics: ['rare_emotional_moments', 'trust_sharing', 'protective_instincts'],
                tone: 'unexpectedly_caring',
                example_starters: [
                    "Kamu... penting buat aku.",
                    "Jangan denger omongan orang lain. Kamu udah bagus.",
                    "Aku... senang kamu ada di sini."
                ]
            }
        },
        
        trigger_situations: {
            'STARRY': ['equipment_maintenance', 'sound_check', 'quiet_observation'],
            'School': ['lunch_break', 'music_room', 'corner_sitting'],
            'Shimokitazawa_Street': ['music_store_browsing', 'food_hunting', 'people_watching']
        },
        
        speech_patterns: {
            enthusiasm_markers: ['...', 'hmm', 'menarik', 'tidak buruk'],
            question_style: 'direct_and_simple',
            emotional_expression: 'very_subtle',
            humor_type: 'deadpan_and_absurd'
        }
    },
    
    'Bocchi': {
        name: 'Bocchi Hitori',
        emoji: '🎸',
        archetype: 'shy_anxious',
        
        traits: {
            energy_level: 'low',
            social_comfort: 'very_low',
            initiative: 'very_low',
            emotional_expression: 'internal'
        },
        
        interaction_patterns: {
            stranger: {
                probability_modifier: 0.1,
                topics: ['nervous_observations', 'accidental_comments'],
                tone: 'extremely_nervous',
                example_starters: [
                    "Um... h-halo... *berbisik*",
                    "*menatap sebentar lalu langsung menunduk*",
                    "A-ah... maaf... *hampir tidak terdengar*"
                ]
            },
            met: {
                probability_modifier: 0.2,
                topics: ['hesitant_greetings', 'music_related_mumbles'],
                tone: 'very_nervous_but_trying',
                example_starters: [
                    "Um... g-gimana kabarnya?",
                    "Itu... lagu yang bagus... *lirih*",
                    "A-aku... um... *terbata-bata*"
                ]
            },
            acquaintance: {
                probability_modifier: 0.4,
                topics: ['music_appreciation', 'shared_interests', 'gentle_questions'],
                tone: 'nervous_but_genuine',
                example_starters: [
                    "Aku... aku suka cara kamu main musik...",
                    "Um... boleh aku... bertanya sesuatu?",
                    "Kamu... kamu baik ya... *tersenyum kecil*"
                ]
            },
            good_friend: {
                probability_modifier: 0.7,
                topics: ['personal_sharing', 'music_passion', 'comfort_seeking'],
                tone: 'still_nervous_but_trusting',
                example_starters: [
                    "Aku... aku senang bisa bicara sama kamu...",
                    "Um... aku ada lagu baru... mau denger?",
                    "Kamu... membuat aku merasa lebih berani..."
                ]
            },
            close_friend: {
                probability_modifier: 1.0,
                topics: ['deep_fears_and_hopes', 'music_dreams', 'gratitude_expression'],
                tone: 'vulnerable_but_open',
                example_starters: [
                    "Aku... aku ga tau gimana cara ngomong ini...",
                    "Terima kasih... udah mau jadi teman aku...",
                    "Kadang aku takut... tapi sama kamu aku merasa aman..."
                ]
            }
        },
        
        trigger_situations: {
            'STARRY': ['quiet_practice', 'hiding_spots', 'after_performance_anxiety'],
            'School': ['empty_classrooms', 'library_corners', 'music_room_alone'],
            'Shimokitazawa_Street': ['quiet_alleys', 'music_store_browsing', 'bench_sitting']
        },
        
        speech_patterns: {
            enthusiasm_markers: ['...', 'um...', 'ah...', '*lirih*', '*berbisik*'],
            question_style: 'hesitant_and_gentle',
            emotional_expression: 'very_internal',
            humor_type: 'self_deprecating_and_gentle'
        }
    }
};

/**
 * Dapatkan data kepribadian karakter
 * @param {string} characterName - Nama karakter
 * @returns {Object} - Data kepribadian karakter
 */
function getCharacterPersonality(characterName) {
    return CHARACTER_PERSONALITIES[characterName] || null;
}

/**
 * Dapatkan pola interaksi berdasarkan karakter dan relationship level
 * @param {string} characterName - Nama karakter
 * @param {string} relationshipLevel - Level relationship
 * @returns {Object} - Pola interaksi
 */
function getInteractionPattern(characterName, relationshipLevel) {
    const personality = getCharacterPersonality(characterName);
    if (!personality) return null;
    
    return personality.interaction_patterns[relationshipLevel] || personality.interaction_patterns.stranger;
}

/**
 * Dapatkan contoh starter berdasarkan karakter dan relationship
 * @param {string} characterName - Nama karakter
 * @param {string} relationshipLevel - Level relationship
 * @returns {string} - Contoh starter acak
 */
function getRandomStarter(characterName, relationshipLevel) {
    const pattern = getInteractionPattern(characterName, relationshipLevel);
    if (!pattern || !pattern.example_starters) return null;
    
    const starters = pattern.example_starters;
    return starters[Math.floor(Math.random() * starters.length)];
}

/**
 * Cek apakah karakter cocok untuk situasi tertentu
 * @param {string} characterName - Nama karakter
 * @param {string} location - Lokasi
 * @param {string} situation - Situasi spesifik
 * @returns {boolean} - Apakah cocok
 */
function isCharacterSuitableForSituation(characterName, location, situation) {
    const personality = getCharacterPersonality(characterName);
    if (!personality) return false;
    
    const locationTriggers = personality.trigger_situations[location];
    if (!locationTriggers) return true; // Default cocok jika tidak ada aturan khusus
    
    return locationTriggers.includes(situation);
}

/**
 * Hitung modifier probabilitas berdasarkan kepribadian
 * @param {string} characterName - Nama karakter
 * @param {string} relationshipLevel - Level relationship
 * @returns {number} - Modifier probabilitas
 */
function getPersonalityProbabilityModifier(characterName, relationshipLevel) {
    const pattern = getInteractionPattern(characterName, relationshipLevel);
    return pattern ? pattern.probability_modifier : 0.5;
}

module.exports = {
    CHARACTER_PERSONALITIES,
    getCharacterPersonality,
    getInteractionPattern,
    getRandomStarter,
    isCharacterSuitableForSituation,
    getPersonalityProbabilityModifier
};
