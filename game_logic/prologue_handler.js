// Prologue Handler - Sistem prolog bertahap dengan efek dramatis
// Menggunakan multiple messages dan jeda waktu untuk pengalaman cinematic

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getCurrentJST } = require('../utils/time');
const { getWeatherInfo, getWeatherMood } = require('./weather');
const { getPlayer, updatePlayer } = require('../database');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Fungsi utama untuk memulai prolog bertahap
 * @param {Object} interaction - Discord interaction object
 * @param {string} originStory - Origin story yang dipilih pemain
 * @param {Object} player - Data pemain yang baru dibuat
 */
async function startPrologue(interaction, originStory, player) {
    console.log(`[PROLOGUE_HANDLER] Starting dramatic prologue for ${interaction.user.id} with origin: ${originStory}`);
    
    try {
        // Kirim initial response untuk acknowledge command
        await interaction.reply({
            content: '🎭 **Memulai petualangan baru...**',
            ephemeral: false
        });
        
        // Jeda dramatis sebelum memulai
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mulai prolog berdasarkan origin story
        switch (originStory) {
            case 'pekerja_starry':
                await startPekerjaStarryPrologue(interaction, player);
                break;
            case 'siswa_pindahan':
                await startSiswaPindahanPrologue(interaction, player);
                break;
            case 'musisi_jalanan':
                await startMusisiJalananPrologue(interaction, player);
                break;
            default:
                await startDefaultPrologue(interaction, player, originStory);
                break;
        }
        
        console.log(`[PROLOGUE_HANDLER] Prologue completed for ${interaction.user.id}`);
        
    } catch (error) {
        console.error('[PROLOGUE_HANDLER] Error in startPrologue:', error);
        
        // Fallback message jika terjadi error
        await interaction.followUp({
            content: '❌ Terjadi kesalahan dalam prolog. Namun, petualangan Anda telah dimulai! Gunakan `/profile` untuk melihat status Anda.',
            ephemeral: true
        });
    }
}

/**
 * Prolog untuk Pekerja Baru di STARRY
 */
async function startPekerjaStarryPrologue(interaction, player) {
    const currentTime = getCurrentJST();
    
    // Pesan 1: Setting dan Seika's Introduction
    const embed1 = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('🎸 STARRY Live House - Hari Pertama')
        .setDescription(`**${currentTime.dayName}, ${currentTime.timeString} JST**\n\nPintu STARRY yang berat terasa dingin di tanganmu. Kamu menarik napas dalam-dalam. Ini hari pertamamu bekerja.\n\nDi dalam, musik yang keras berhenti. Semua mata tertuju padamu.\n\nSeorang wanita berambut pirang dengan tatapan tajam (Seika) menghampirimu.\n\n**"Kamu terlambat,"** katanya datar.`)
        .addFields(
            { name: '📍 Lokasi', value: 'STARRY Live House - Main Floor', inline: true },
            { name: '🌤️ Suasana', value: player.current_weather, inline: true },
            { name: '👥 Hadir', value: 'Seika Ijichi, Kessoku Band', inline: true }
        )
        .setFooter({ text: 'Jantungmu berdebar... Apa yang akan kamu katakan?' })
        .setTimestamp();
    
    await interaction.followUp({ embeds: [embed1] });
    
    // Jeda dramatis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Pesan 2: Kessoku Band Introduction dengan Pilihan
    const embed2 = new EmbedBuilder()
        .setColor('#4ecdc4')
        .setTitle('👀 Pandangan Pertama pada Kessoku Band')
        .setDescription(`Di belakang Seika, kamu melihat para anggota Kessoku Band:\n\n🥁 **Nijika** tersenyum ramah, mencoba mencairkan suasana\n🎤 **Kita** melambai penasaran dengan energi yang infectious\n🎸 **Ryo** tampak tidak peduli, fokus pada bass-nya\n🎸 **Bocchi** (gadis berambat pink) langsung bersembunyi di balik amplifier\n\nSeika menunggu jawabanmu dengan tatapan yang menilai...`)
        .setFooter({ text: 'Pilihan pertama yang akan menentukan kesan pertama...' });
    
    // Buttons untuk pilihan
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('prologue_choice_safe_pekerja_starry')
                .setLabel('😅 "Maaf, saya tersesat."')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('prologue_choice_neutral_pekerja_starry')
                .setLabel('😐 "Lalu lintasnya parah."')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('prologue_choice_risky_pekerja_starry')
                .setLabel('😏 "Saya tidak terlambat, saya datang lebih awal untuk besok."')
                .setStyle(ButtonStyle.Danger)
        );
    
    await interaction.followUp({ 
        embeds: [embed2], 
        components: [actionRow] 
    });
}

/**
 * Prolog untuk Siswa Pindahan
 */
async function startSiswaPindahanPrologue(interaction, player) {
    const currentTime = getCurrentJST();
    
    // Pesan 1: Hari Pertama di Sekolah
    const embed1 = new EmbedBuilder()
        .setColor('#ff9ff3')
        .setTitle('🏫 SMA Shuka - Hari Pertama')
        .setDescription(`**${currentTime.dayName}, ${currentTime.timeString} JST**\n\nHari pertama di SMA Shuka. Kamu masuk ke kelas baru, semua mata tertuju padamu.\n\nGuru menunjuk sebuah kursi kosong. "Silakan duduk di sana."\n\nSaat kamu berjalan, kamu melihat:\n🎤 Seorang gadis populer dengan rambut merah (**Kita**) tersenyum padamu\n🎸 Di sudut lain, seorang gadis berambut pink (**Bocchi**) dengan cepat menundukkan kepalanya`)
        .addFields(
            { name: '📍 Lokasi', value: 'SMA Shuka - Kelas 1-A', inline: true },
            { name: '🌤️ Cuaca', value: player.current_weather, inline: true },
            { name: '👥 Siswa', value: 'Kelas penuh dengan wajah baru', inline: true }
        )
        .setFooter({ text: 'Nervous tapi excited... Hari yang akan mengubah segalanya.' })
        .setTimestamp();
    
    await interaction.followUp({ embeds: [embed1] });
    
    // Jeda untuk build suspense
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Pesan 2: Lunch Break Encounter
    const embed2 = new EmbedBuilder()
        .setColor('#feca57')
        .setTitle('🍱 Istirahat Makan Siang')
        .setDescription(`Saat istirahat makan siang, **Kita** menghampirimu dengan senyum yang bright.\n\n**"Hai, anak baru! Namaku Kita Ikuyo!"**\n\nDia menunjuk ke arah Bocchi yang sedang gemetar di mejanya, makan sendirian.\n\n**"Mau makan siang bersama kami? Bocchi-chan itu pemalu, tapi dia orang yang baik!"**\n\nKamu melihat Bocchi mengintip nervously, sepertinya berharap tapi juga takut kamu akan menolak...`)
        .setFooter({ text: 'Kesempatan untuk berteman... Bagaimana responsmu?' });
    
    // Buttons untuk pilihan
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('prologue_choice_enthusiastic_siswa_pindahan')
                .setLabel('😊 "Tentu, dengan senang hati!"')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('prologue_choice_polite_siswa_pindahan')
                .setLabel('😌 "Terima kasih, tapi aku bawa bekal sendiri."')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('prologue_choice_shy_siswa_pindahan')
                .setLabel('😳 "Aku... aku tidak ingin mengganggu..."')
                .setStyle(ButtonStyle.Primary)
        );
    
    await interaction.followUp({ 
        embeds: [embed2], 
        components: [actionRow] 
    });
}

/**
 * Prolog untuk Musisi Jalanan
 */
async function startMusisiJalananPrologue(interaction, player) {
    const currentTime = getCurrentJST();
    
    // Pesan 1: Busking Session
    const embed1 = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🎵 Shimokitazawa Street - Sore Hari')
        .setDescription(`**${currentTime.dayName}, ${currentTime.timeString} JST**\n\nKamu baru saja selesai busking di sudut jalan yang biasa. Case gitar terbuka di depanmu berisi beberapa koin dari penonton yang lewat.\n\nTapi hari ini terasa berbeda...\n\nDari arah STARRY, kamu mendengar suara band yang tight - bass line yang complex, drum yang solid, dan... gitar yang familiar tapi nervous.\n\n**Ada sesuatu yang memanggilmu untuk mencari lebih dari sekedar bermain sendirian.**`)
        .addFields(
            { name: '📍 Lokasi', value: 'Shimokitazawa Street Corner', inline: true },
            { name: '🌤️ Suasana', value: player.current_weather, inline: true },
            { name: '🎸 Equipment', value: 'Gitar akustik, case terbuka', inline: true }
        )
        .setFooter({ text: 'Suara musik dari STARRY semakin menarik perhatianmu...' })
        .setTimestamp();
    
    await interaction.followUp({ embeds: [embed1] });
    
    // Jeda untuk build atmosphere
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Pesan 2: Decision Point
    const embed2 = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('🎸 Panggilan Musik')
        .setDescription(`Kamu pack up gitar dan berjalan menuju STARRY. Melalui jendela, kamu melihat:\n\n🥁 **Nijika** - drummer yang provide foundation yang solid\n🎸 **Ryo** - bassist dengan technique yang kamu admire\n🎤 **Kita** - vocalist dengan energy yang infectious\n🎸 **Bocchi** - guitarist yang remind kamu pada diri sendiri dulu\n\nMereka sedang latihan, dan ada magic yang terjadi ketika mereka bermain bersama.\n\n**Sebagai solo musician, kamu selalu wonder tentang band dynamic...**`)
        .setFooter({ text: 'Mungkin saatnya untuk step out dari comfort zone?' });
    
    // Buttons untuk pilihan
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('prologue_choice_approach_musisi_jalanan')
                .setLabel('🚪 "Masuk dan perkenalkan diri"')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('prologue_choice_observe_musisi_jalanan')
                .setLabel('👀 "Amati dulu dari luar"')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('prologue_choice_leave_musisi_jalanan')
                .setLabel('🚶 "Mungkin lain kali..."')
                .setStyle(ButtonStyle.Secondary)
        );
    
    await interaction.followUp({ 
        embeds: [embed2], 
        components: [actionRow] 
    });
}

/**
 * Prolog default untuk origin story yang tidak dikenali
 */
async function startDefaultPrologue(interaction, player, originStory) {
    const currentTime = getCurrentJST();
    
    const embed = new EmbedBuilder()
        .setColor('#95a5a6')
        .setTitle('🌟 Petualangan Baru Dimulai')
        .setDescription(`**${currentTime.dayName}, ${currentTime.timeString} JST**\n\nHidup baru telah dimulai dalam dunia Bocchi the Rock!\n\nSebagai **${originStory}**, kamu siap untuk memulai petualangan yang akan mengubah hidupmu.\n\nDunia musik indie Shimokitazawa menunggumu dengan segala kemungkinannya.`)
        .addFields(
            { name: '🎮 Langkah Selanjutnya', value: 'Gunakan `/profile` untuk melihat status lengkap\nGunakan `/say` untuk berinteraksi dengan karakter\nGunakan `/act` untuk melakukan aktivitas', inline: false }
        )
        .setFooter({ text: 'Selamat bermain!' })
        .setTimestamp();
    
    await interaction.followUp({ embeds: [embed] });
}

/**
 * Handler untuk button interactions dalam prolog dengan LLM integration
 */
async function handlePrologueChoice(interaction) {
    const customId = interaction.customId;

    if (!customId.startsWith('prologue_choice_')) {
        return false;
    }

    console.log(`[PROLOGUE_HANDLER] Choice made: ${customId} by ${interaction.user.id}`);

    try {
        await interaction.deferUpdate();

        // Parse choice dari customId
        const parts = customId.split('_');
        const choice = parts[2]; // safe, neutral, risky, etc.
        const originStory = parts.slice(3).join('_'); // pekerja_starry, siswa_pindahan, etc.

        // Get player data untuk context
        const player = await getPlayer(interaction.user.id);
        if (!player) {
            throw new Error('Player data tidak ditemukan');
        }

        // Build context untuk LLM
        const context = buildPrologueContext(player, originStory, choice);

        // Build prompt untuk LLM
        const prompt = buildPrologueLLMPrompt(context);
        console.log(`[PROLOGUE_HANDLER] Calling LLM for choice: ${choice} in ${originStory}`);

        // Call LLM API
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const llmResponse = response.text();

        console.log(`[PROLOGUE_HANDLER] LLM response received: ${llmResponse.substring(0, 100)}...`);

        // Process LLM response
        let parsedResponse;
        try {
            const cleanResponse = llmResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedResponse = JSON.parse(cleanResponse);

            if (!parsedResponse.narration || !parsedResponse.stat_changes) {
                throw new Error('Struktur respons LLM tidak valid');
            }

            console.log(`[PROLOGUE_HANDLER] Response successfully parsed`);
        } catch (parseError) {
            console.error(`[PROLOGUE_HANDLER] Error parsing LLM response:`, parseError);
            console.error(`[PROLOGUE_HANDLER] Raw response:`, llmResponse);

            // Fallback ke static response
            parsedResponse = getFallbackResponse(originStory, choice);
        }

        // Update database dengan stat changes
        await applyStatChanges(interaction.user.id, parsedResponse.stat_changes);

        // Send narration response
        await sendPrologueNarration(interaction, parsedResponse.narration, originStory, choice);

        // Jeda sebelum conclusion
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Send conclusion message
        await sendPrologueConclusion(interaction);

        return true;

    } catch (error) {
        console.error('[PROLOGUE_HANDLER] Error handling choice:', error);

        // Send error message
        try {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('🤖 Error AI')
                .setDescription('Maaf, terjadi kesalahan dalam memproses pilihan prolog. Namun, petualangan Anda telah dimulai!')
                .addFields(
                    { name: '🎮 Langkah Selanjutnya', value: 'Gunakan `/profile` untuk melihat status Anda\nGunakan `/say` untuk berinteraksi dengan karakter', inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed], components: [] });
        } catch (replyError) {
            console.error('[PROLOGUE_HANDLER] Error sending error message:', replyError);
        }

        return false;
    }
}

// Old static handlers removed - now using LLM integration for dynamic responses

// Old static handlers removed - now using LLM integration for dynamic responses

// Old static handlers removed - now using LLM integration for dynamic responses

/**
 * Build context untuk LLM berdasarkan origin story dan choice
 */
function buildPrologueContext(player, originStory, choice) {
    const currentTime = getCurrentJST();

    const contexts = {
        pekerja_starry: {
            setting: "STARRY Live House - hari pertama kerja",
            characters: "Seika Ijichi (manager), Nijika Yamada (drummer), Kita Ikuyo (vocalist), Ryo Yamada (bassist), Bocchi (guitarist)",
            situation: "Pemain baru saja tiba di STARRY untuk hari pertama kerja dan bertemu Seika yang mengatakan mereka terlambat",
            choices: {
                safe: "Pemain memilih menjawab 'Maaf, saya tersesat' - pilihan humble dan honest",
                neutral: "Pemain memilih menjawab 'Lalu lintasnya parah' - pilihan practical dan realistic",
                risky: "Pemain memilih menjawab 'Saya tidak terlambat, saya datang lebih awal untuk besok' - pilihan bold dan witty"
            }
        },
        siswa_pindahan: {
            setting: "SMA Shuka - hari pertama sebagai siswa pindahan",
            characters: "Kita Ikuyo (siswa populer), Bocchi/Gotou Hitori (siswa pemalu), Nijika Yamada, Ryo Yamada",
            situation: "Pemain adalah siswa pindahan baru dan Kita mengajak makan siang bersama dengan Bocchi yang pemalu",
            choices: {
                enthusiastic: "Pemain memilih 'Tentu, dengan senang hati!' - pilihan open dan friendly",
                polite: "Pemain memilih 'Terima kasih, tapi aku bawa bekal sendiri' - pilihan polite tapi distant",
                shy: "Pemain memilih 'Aku... aku tidak ingin mengganggu...' - pilihan vulnerable dan relatable"
            }
        },
        musisi_jalanan: {
            setting: "Shimokitazawa street corner dekat STARRY Live House",
            characters: "Kessoku Band (Nijika, Kita, Ryo, Bocchi) yang sedang latihan di STARRY",
            situation: "Pemain adalah street musician yang mendengar Kessoku Band latihan dan tertarik dengan band dynamics",
            choices: {
                approach: "Pemain memilih masuk dan perkenalkan diri - pilihan bold dan confident",
                observe: "Pemain memilih amati dulu dari luar - pilihan careful dan analytical",
                leave: "Pemain memilih 'Mungkin lain kali...' - pilihan safe tapi missed opportunity"
            }
        }
    };

    const context = contexts[originStory];
    if (!context) {
        return {
            setting: "Dunia Bocchi the Rock",
            characters: "Kessoku Band members",
            situation: "Pemain memulai petualangan baru",
            choice_made: choice
        };
    }

    return {
        setting: context.setting,
        characters: context.characters,
        situation: context.situation,
        choice_made: context.choices[choice] || choice,
        weather: player.current_weather,
        time: `${currentTime.dayName}, ${currentTime.timeString} JST`
    };
}

/**
 * Build prompt untuk LLM dalam konteks prolog
 */
function buildPrologueLLMPrompt(context) {
    return `[PROLOGUE] SISTEM PROLOG "BOCCHI THE ROCK!":
Ini adalah interaksi pertama pemain dalam prolog game. Kamu adalah AI yang menjalankan respons karakter dalam dunia Bocchi the Rock.

KONTEKS SITUASI:
- Setting: ${context.setting}
- Waktu: ${context.time}
- Cuaca: ${context.weather}
- Karakter yang hadir: ${context.characters}
- Situasi: ${context.situation}
- Pilihan yang dibuat pemain: ${context.choice_made}

INSTRUKSI:
1. Berikan respons yang menunjukkan reaksi setiap karakter terhadap pilihan pemain
2. Seika Ijichi: Manager yang strict tapi fair, menilai profesionalisme
3. Nijika Yamada: Drummer yang supportive dan empathetic, selalu positif
4. Kita Ikuyo: Vocalist yang energetic dan welcoming, suka humor
5. Ryo Yamada: Bassist yang cool dan practical, sulit diimpress tapi menghargai authenticity
6. Bocchi/Gotou Hitori: Guitarist yang sangat pemalu, relate dengan social anxiety

RESPONSE FORMAT (JSON):
{
    "narration": "Deskripsi detail reaksi setiap karakter terhadap pilihan pemain. Gunakan dialog langsung dan body language. Buat atmospheric dan immersive. Panjang 200-300 kata.",
    "stat_changes": {
        "seika_trust": [nilai -2 hingga +3],
        "nijika_trust": [nilai -1 hingga +2],
        "kita_trust": [nilai -1 hingga +3],
        "ryo_trust": [nilai -1 hingga +2],
        "bocchi_trust": [nilai -1 hingga +2],
        "bocchi_comfort": [nilai -1 hingga +3]
    }
}

PENTING:
- Buat narasi yang cinematic dan engaging
- Setiap karakter harus memiliki reaksi yang sesuai personality mereka
- Stat changes harus reflect consequences yang realistic dari pilihan
- Gunakan dialog langsung untuk membuat scene lebih hidup
- Fokus pada first impression yang akan mempengaruhi relationship ke depan`;
}

/**
 * Apply stat changes ke database dengan mapping yang benar
 */
async function applyStatChanges(discordId, statChanges) {
    try {
        console.log(`[PROLOGUE_HANDLER] Applying stat changes for ${discordId}:`, statChanges);

        // Mapping dari LLM response ke database columns
        const statMapping = {
            // Character relationships (friendship -> trust)
            'seika_trust': 'seika_trust',
            'nijika_friendship': 'nijika_trust',
            'kita_friendship': 'kita_trust',
            'ryo_respect': 'ryo_trust',
            'bocchi_comfort': 'bocchi_comfort',

            // Character specific stats
            'nijika_trust': 'nijika_trust',
            'kita_trust': 'kita_trust',
            'ryo_trust': 'ryo_trust',
            'bocchi_trust': 'bocchi_trust',

            // Player stats (need to be added to database)
            'confidence': 'confidence',
            'social_skills': 'social_skills'
        };

        // Build update query untuk relative changes
        const updates = [];
        const values = [];

        for (const [stat, change] of Object.entries(statChanges)) {
            if (typeof change === 'number' && change !== 0) {
                const dbColumn = statMapping[stat];
                if (dbColumn) {
                    // Check if column exists in database first
                    if (['bocchi_trust', 'bocchi_comfort', 'nijika_trust', 'ryo_trust', 'kita_trust'].includes(dbColumn)) {
                        updates.push(`${dbColumn} = ${dbColumn} + ?`);
                        values.push(change);
                    } else {
                        console.log(`[PROLOGUE_HANDLER] Skipping ${stat} - column ${dbColumn} not in database schema`);
                    }
                } else {
                    console.log(`[PROLOGUE_HANDLER] Skipping ${stat} - no mapping found`);
                }
            }
        }

        if (updates.length > 0) {
            values.push(discordId);
            const query = `UPDATE players SET ${updates.join(', ')} WHERE discord_id = ?`;

            console.log(`[PROLOGUE_HANDLER] Executing query: ${query}`);
            console.log(`[PROLOGUE_HANDLER] With values:`, values);

            // Use direct database access
            const { db } = require('../database');
            await new Promise((resolve, reject) => {
                db.run(query, values, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`[PROLOGUE_HANDLER] Successfully applied ${updates.length} stat changes`);
                        resolve();
                    }
                });
            });
        } else {
            console.log(`[PROLOGUE_HANDLER] No valid stat changes to apply`);
        }

    } catch (error) {
        console.error('[PROLOGUE_HANDLER] Error applying stat changes:', error);
        throw error;
    }
}

/**
 * Send narration response dengan formatting yang bagus
 */
async function sendPrologueNarration(interaction, narration, originStory, choice) {
    const choiceLabels = {
        safe: '😅 Pilihan Aman',
        neutral: '😐 Pilihan Netral',
        risky: '😏 Pilihan Berisiko',
        enthusiastic: '😊 Antusias dan Ramah',
        polite: '😌 Sopan dan Distant',
        shy: '😳 Shy dan Relatable',
        approach: '🚪 Berani Masuk',
        observe: '👀 Mengamati dari Luar',
        leave: '🚶 Mungkin Lain Kali'
    };

    const originLabels = {
        pekerja_starry: '🎸 STARRY Live House',
        siswa_pindahan: '🏫 SMA Shuka',
        musisi_jalanan: '🎵 Shimokitazawa Street'
    };

    const responseEmbed = new EmbedBuilder()
        .setColor('#4ecdc4')
        .setTitle(choiceLabels[choice] || '✨ Pilihan Dibuat')
        .setDescription(narration)
        .addFields(
            { name: '📍 Lokasi', value: originLabels[originStory] || 'Dunia Bocchi the Rock', inline: true },
            { name: '🎭 Fase', value: 'Prolog - First Impression', inline: true },
            { name: '💫 Status', value: 'Relationship dynamics sedang terbentuk...', inline: true }
        )
        .setFooter({ text: 'Pilihan Anda mempengaruhi bagaimana karakter melihat Anda...' })
        .setTimestamp();

    await interaction.editReply({
        embeds: [responseEmbed],
        components: []
    });
}

/**
 * Send conclusion message untuk mengakhiri prolog
 */
async function sendPrologueConclusion(interaction) {
    const conclusionEmbed = new EmbedBuilder()
        .setColor('#ff9ff3')
        .setTitle('🎉 Prolog Selesai')
        .setDescription(`**Selamat datang di kehidupan sehari-harimu dalam dunia Bocchi the Rock!**\n\nFirst impression telah terbentuk, dan petualangan sesungguhnya baru saja dimulai. Setiap interaksi selanjutnya akan dipengaruhi oleh pilihan yang baru saja kamu buat.\n\n**Dunia musik indie Shimokitazawa menunggumu dengan segala kemungkinannya!**`)
        .addFields(
            { name: '🎮 Commands Utama', value: '• `/profile` - Lihat status dan relationships lengkap\n• `/say [nama] [dialog]` - Bicara dengan karakter\n• `/act [aktivitas]` - Lakukan berbagai aktivitas\n• `/status` - Cek kondisi saat ini', inline: false },
            { name: '🎯 Tips Bermain', value: '• Perhatikan Action Points (AP) - reset setiap hari\n• Cuaca mempengaruhi mood dan interaksi\n• Relationship levels mempengaruhi response karakter\n• Explore berbagai lokasi dan aktivitas!', inline: false },
            { name: '🌟 Next Steps', value: 'Mulai berinteraksi dengan karakter favorit kamu atau explore dunia dengan `/act jalan_shimokitazawa`!', inline: false }
        )
        .setFooter({ text: 'Petualangan musikmu dimulai sekarang!' })
        .setTimestamp();

    await interaction.followUp({ embeds: [conclusionEmbed] });
}

/**
 * Fallback response jika LLM gagal
 */
function getFallbackResponse(originStory, choice) {
    const fallbacks = {
        pekerja_starry: {
            safe: {
                narration: "Seika menatapmu sejenak, lalu menghela napas. 'Tersesat? Di Shimokitazawa?' Nijika tertawa kecil. 'Ah, itu wajar! Aku juga sering tersesat dulu!' Kita mengangguk antusias. 'Shimokitazawa memang seperti labirin!' Bocchi mengintip dari balik amplifier, sepertinya relate dengan situasimu. Seika akhirnya tersenyum tipis. 'Baiklah. Tapi jangan sampai terulang.'",
                stat_changes: { seika_trust: 0, nijika_trust: 1, kita_trust: 1, bocchi_comfort: 1 }
            },
            neutral: {
                narration: "Seika menaikkan alis. 'Lalu lintas? Kamu naik apa kesini?' Ryo mengangkat kepala dari bass-nya, sedikit tertarik dengan jawabanmu. Kita tertawa. 'Oh iya! Hari ini memang macet banget!' Seika mengangguk pelan. 'Fair enough. Tapi next time, berangkat lebih awal.'",
                stat_changes: { seika_trust: 0, ryo_trust: 1, kita_trust: 1 }
            },
            risky: {
                narration: "Suasana hening sejenak... Tiba-tiba Kita tertawa keras. 'Hahaha! That's actually clever!' Nijika giggling. 'Wah, confident banget!' Ryo tersenyum tipis - rare sight! Bahkan Bocchi mengintip dengan curious. Seika... 'Hmm. Interesting.' Ada hint of amusement di matanya. 'Tapi tetap saja, jangan terlambat.'",
                stat_changes: { seika_trust: 1, nijika_trust: 2, kita_trust: 2, ryo_trust: 1, bocchi_comfort: 1 }
            }
        }
    };

    return fallbacks[originStory]?.[choice] || {
        narration: "Semua orang menatapmu dengan curious. Ini adalah awal dari petualangan baru yang menarik!",
        stat_changes: { confidence: 1 }
    };
}

module.exports = {
    startPrologue,
    handlePrologueChoice
};
