// Sistem Prolog Dinamis untuk Bocchi the Rock! Roleplay Game
// Memberikan pengalaman onboarding yang immersive dan interaktif

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCurrentJST } = require('../utils/time');
const { buildDetailedSituationContext } = require('../utils/context-builder');
const { getWeatherInfo, getWeatherMood } = require('./weather');

/**
 * Memulai sekuens prolog setelah pemain berhasil mendaftar
 * @param {Object} interaction - Discord interaction object
 * @param {string} originStory - Origin story yang dipilih pemain
 * @param {Object} player - Data pemain yang baru dibuat
 */
async function startPrologue(interaction, originStory, player) {
    console.log(`[PROLOGUE] Starting prologue for ${interaction.user.id} with origin: ${originStory}`);
    
    try {
        // Fase 1: Welcome & Setting Introduction
        await prologuePhase1_Welcome(interaction, originStory, player);
        
    } catch (error) {
        console.error('[PROLOGUE] Error in startPrologue:', error);
        
        // Fallback ke konfirmasi sederhana jika prolog gagal
        const fallbackEmbed = new EmbedBuilder()
            .setColor('#4ecdc4')
            .setTitle('🎉 Selamat Datang!')
            .setDescription('Hidup baru telah dimulai! Gunakan `/profile` untuk melihat status Anda.')
            .setTimestamp();
        
        await interaction.followUp({ embeds: [fallbackEmbed] });
    }
}

/**
 * Fase 1: Welcome & Setting Introduction
 */
async function prologuePhase1_Welcome(interaction, originStory, player) {
    const currentTime = getCurrentJST();
    const weatherInfo = getWeatherInfo(player.current_weather);
    const weatherMood = getWeatherMood(weatherInfo);
    
    // Buat konteks situasi untuk prolog
    const situationContext = buildPrologueContext(originStory, currentTime, weatherInfo);
    
    // Buat embed welcome yang immersive
    const welcomeEmbed = new EmbedBuilder()
        .setColor('#ff9ff3')
        .setTitle('🌸 Selamat Datang di Dunia Bocchi the Rock! 🌸')
        .setDescription(`**${currentTime.dayName}, ${currentTime.timeString} JST**\n${situationContext.opening}`)
        .addFields(
            { name: '🎭 Peran Anda', value: situationContext.roleDescription, inline: false },
            { name: '🌤️ Suasana', value: `${player.current_weather}\n*${weatherMood}*`, inline: true },
            { name: '📍 Lokasi', value: situationContext.startingLocation, inline: true }
        )
        .setFooter({ text: 'Pilih bagaimana Anda ingin memulai petualangan...' })
        .setTimestamp();
    
    // Buat buttons untuk pilihan awal
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`prologue_explore_${originStory}`)
                .setLabel('🚶 Jelajahi Sekitar')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`prologue_observe_${originStory}`)
                .setLabel('👀 Amati Situasi')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`prologue_approach_${originStory}`)
                .setLabel('🤝 Dekati Orang')
                .setStyle(ButtonStyle.Success)
        );
    
    await interaction.reply({ 
        embeds: [welcomeEmbed], 
        components: [actionRow] 
    });
    
    console.log(`[PROLOGUE] Phase 1 sent for ${interaction.user.id}`);
}

/**
 * Membangun konteks situasi untuk prolog berdasarkan origin story
 */
function buildPrologueContext(originStory, currentTime, weatherInfo) {
    const period = currentTime.period;
    const weatherName = (weatherInfo && weatherInfo.name) ? weatherInfo.name : 'Cerah';
    
    switch (originStory) {
        case 'siswa_pindahan':
            return {
                opening: `Hari pertama di sekolah baru... Kamu berdiri di depan gerbang SMA Shuka dengan perasaan campur aduk. Suara riuh siswa-siswa lain terdengar dari kejauhan, sementara angin ${period} membawa aroma bunga sakura yang mulai mekar.`,
                roleDescription: '**Siswa Pindahan** - Kamu adalah siswa baru yang baru saja pindah ke Tokyo. Masih merasa asing dengan lingkungan baru, tapi penuh semangat untuk memulai babak baru dalam hidup.',
                startingLocation: '🏫 Gerbang SMA Shuka',
                atmosphere: `Suasana ${period} yang ${weatherName.toLowerCase()} menciptakan mood yang perfect untuk hari pertama. Siswa-siswa berlalu lalang dengan tas sekolah mereka, ada yang terlihat excited, ada yang masih mengantuk.`
            };
            
        case 'pekerja_starry':
            return {
                opening: `Hari pertama kerja di STARRY... Kamu berdiri di depan live house yang legendaris ini, melihat poster-poster band indie yang menghiasi dinding. Suara sound check samar-samar terdengar dari dalam, dan kamu bisa merasakan getaran bass yang familiar.`,
                roleDescription: '**Pekerja Baru di STARRY** - Kamu adalah staff baru di live house paling terkenal di Shimokitazawa. Sudah familiar dengan dunia musik, tapi masih harus membuktikan diri di tempat yang penuh dengan musisi berbakat.',
                startingLocation: '🎸 Depan STARRY Live House',
                atmosphere: `Shimokitazawa di ${period} hari dengan cuaca ${weatherName.toLowerCase()} selalu punya vibe yang unik. Musisi jalanan mulai setup alat mereka, kafe-kafe mulai ramai, dan aroma kopi bercampur dengan suara gitar akustik.`
            };
            
        case 'musisi_jalanan':
            return {
                opening: `Sore hari di Shimokitazawa... Kamu baru saja selesai busking di sudut jalan yang biasa, dengan case gitar terbuka di depanmu berisi beberapa koin dari penonton yang lewat. Tapi hari ini terasa berbeda - ada sesuatu yang memanggilmu untuk mencari lebih dari sekedar bermain sendirian.`,
                roleDescription: '**Musisi Jalanan** - Kamu adalah musisi independen yang sudah terbiasa perform di jalanan. Punya skill dan kepercayaan diri, tapi mulai merasa butuh sesuatu yang lebih - mungkin sebuah band?',
                startingLocation: '🎵 Sudut Jalan Shimokitazawa',
                atmosphere: `Shimokitazawa di ${period} hari dengan cuaca ${weatherName.toLowerCase()} adalah surga bagi musisi jalanan. Suara musik dari berbagai arah, orang-orang yang appreciate seni, dan energy kreatif yang mengalir di setiap sudut jalan.`
            };
            
        default:
            return {
                opening: `Petualangan baru dimulai... Kamu menemukan dirimu di tengah distrik musik Shimokitazawa, dengan perasaan bahwa hidup akan segera berubah.`,
                roleDescription: '**Petualang Baru** - Kamu memulai perjalanan baru dalam dunia musik dan persahabatan.',
                startingLocation: '📍 Shimokitazawa',
                atmosphere: `Suasana ${period} yang ${weatherName.toLowerCase()} menciptakan mood yang perfect untuk petualangan baru.`
            };
    }
}

/**
 * Handler untuk button interactions dalam prolog
 */
async function handlePrologueButton(interaction) {
    const customId = interaction.customId;
    const [action, choice, originStory] = customId.split('_');
    
    if (action !== 'prologue') return false;
    
    console.log(`[PROLOGUE] Button pressed: ${choice} for origin: ${originStory}`);
    
    try {
        await interaction.deferUpdate();
        
        switch (choice) {
            case 'explore':
                await prologuePhase2_Explore(interaction, originStory);
                break;
            case 'observe':
                await prologuePhase2_Observe(interaction, originStory);
                break;
            case 'approach':
                await prologuePhase2_Approach(interaction, originStory);
                break;
            case 'continue':
                await prologuePhase3_FirstEncounter(interaction, originStory);
                break;
            case 'finish':
                await prologuePhase4_Conclusion(interaction, originStory);
                break;
            default:
                console.log(`[PROLOGUE] Unknown choice: ${choice}`);
        }
        
        return true;
    } catch (error) {
        console.error('[PROLOGUE] Error handling button:', error);
        return false;
    }
}

/**
 * Fase 2: Player Choice Consequences
 */
async function prologuePhase2_Explore(interaction, originStory) {
    const exploreContent = getExploreContent(originStory);
    
    const exploreEmbed = new EmbedBuilder()
        .setColor('#4ecdc4')
        .setTitle('🚶 Menjelajahi Sekitar')
        .setDescription(exploreContent.description)
        .addFields(
            { name: '🔍 Yang Kamu Temukan', value: exploreContent.discovery, inline: false },
            { name: '💭 Refleksi', value: exploreContent.reflection, inline: false }
        )
        .setFooter({ text: 'Eksplorasi membuka mata terhadap dunia baru...' });
    
    const continueRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`prologue_continue_${originStory}`)
                .setLabel('➡️ Lanjutkan')
                .setStyle(ButtonStyle.Primary)
        );
    
    await interaction.editReply({ 
        embeds: [exploreEmbed], 
        components: [continueRow] 
    });
}

async function prologuePhase2_Observe(interaction, originStory) {
    const observeContent = getObserveContent(originStory);
    
    const observeEmbed = new EmbedBuilder()
        .setColor('#feca57')
        .setTitle('👀 Mengamati Situasi')
        .setDescription(observeContent.description)
        .addFields(
            { name: '📝 Observasi', value: observeContent.observation, inline: false },
            { name: '🧠 Insight', value: observeContent.insight, inline: false }
        )
        .setFooter({ text: 'Pengamatan yang tajam memberikan pemahaman yang dalam...' });
    
    const continueRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`prologue_continue_${originStory}`)
                .setLabel('➡️ Lanjutkan')
                .setStyle(ButtonStyle.Primary)
        );
    
    await interaction.editReply({ 
        embeds: [observeEmbed], 
        components: [continueRow] 
    });
}

async function prologuePhase2_Approach(interaction, originStory) {
    const approachContent = getApproachContent(originStory);
    
    const approachEmbed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('🤝 Mendekati Orang')
        .setDescription(approachContent.description)
        .addFields(
            { name: '💬 Interaksi', value: approachContent.interaction, inline: false },
            { name: '🎭 Reaksi', value: approachContent.reaction, inline: false }
        )
        .setFooter({ text: 'Keberanian untuk berinteraksi membuka pintu baru...' });
    
    const continueRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`prologue_continue_${originStory}`)
                .setLabel('➡️ Lanjutkan')
                .setStyle(ButtonStyle.Primary)
        );
    
    await interaction.editReply({ 
        embeds: [approachEmbed], 
        components: [continueRow] 
    });
}

/**
 * Content generators untuk setiap pilihan
 */
function getExploreContent(originStory) {
    switch (originStory) {
        case 'siswa_pindahan':
            return {
                description: 'Kamu memutuskan untuk berkeliling sekolah sebelum masuk kelas. Koridor yang panjang, papan pengumuman yang penuh dengan poster klub, dan suara-suara dari berbagai ruangan menciptakan symphony kehidupan sekolah.',
                discovery: 'Di sudut koridor, kamu menemukan ruang musik yang pintunya sedikit terbuka. Suara gitar akustik yang lembut mengalir keluar, dimainkan oleh seseorang yang terdengar... nervous? Tapi musiknya indah.',
                reflection: 'Sebagai siswa pindahan, kamu menyadari bahwa sekolah ini punya vibe yang berbeda dari sekolah lamamu. Ada sesuatu yang special tentang tempat ini - mungkin karena banyak siswa yang passionate tentang musik?'
            };
        case 'pekerja_starry':
            return {
                description: 'Kamu memutuskan untuk berkeliling STARRY sebelum shift dimulai. Setiap sudut live house ini punya cerita - poster band yang sudah perform, equipment yang well-maintained, dan acoustic yang perfect.',
                discovery: 'Di backstage, kamu menemukan sebuah gitar yang ditinggal. Ada sticker "Kessoku Band" di case-nya. Sepertinya ini milik salah satu member band yang sering latihan di sini.',
                reflection: 'Sebagai pekerja baru, kamu merasa excited tentang kemungkinan bertemu dengan musisi-musisi berbakat. STARRY bukan hanya tempat kerja - ini adalah jantung dari scene musik indie Shimokitazawa.'
            };
        case 'musisi_jalanan':
            return {
                description: 'Kamu memutuskan untuk walk around Shimokitazawa dengan gitar di punggung. Setiap sudut jalan punya musisi yang berbeda, setiap kafe punya vibe yang unik, dan kamu merasa seperti bagian dari komunitas besar.',
                discovery: 'Di dekat STARRY, kamu mendengar sound check dari dalam. Ada bass line yang complex, drum yang tight, dan... gitar yang terdengar familiar tapi juga nervous. Sepertinya ada band yang sedang latihan.',
                reflection: 'Sebagai musisi jalanan, kamu sudah terbiasa perform solo. Tapi mendengar band yang tight seperti itu membuatmu bertanya-tanya: bagaimana rasanya bermain musik bersama orang lain?'
            };
        default:
            return {
                description: 'Kamu menjelajahi area sekitar dan menemukan berbagai hal menarik.',
                discovery: 'Ada banyak hal baru yang bisa dipelajari di sini.',
                reflection: 'Petualangan baru selalu dimulai dengan eksplorasi.'
            };
    }
}

function getObserveContent(originStory) {
    switch (originStory) {
        case 'siswa_pindahan':
            return {
                description: 'Kamu memutuskan untuk mengamati kehidupan sekolah dari kejauhan. Duduk di bangku taman sekolah, kamu memperhatikan interaksi antar siswa, grup-grup yang terbentuk, dan dynamic sosial yang ada.',
                observation: 'Ada seorang gadis berambut pink yang terlihat nervous berjalan sendirian menuju ruang musik. Dia membawa case gitar dan terlihat seperti ingin menghindari perhatian. Tapi ada determinasi di matanya.',
                insight: 'Kamu menyadari bahwa tidak semua orang di sekolah ini confident. Ada yang masih struggling dengan social anxiety, tapi tetap pursue passion mereka. Mungkin kamu bisa relate dengan mereka?'
            };
        case 'pekerja_starry':
            return {
                description: 'Kamu memutuskan untuk observe dynamic di STARRY sebelum mulai bekerja. Dari sudut yang strategis, kamu memperhatikan bagaimana staff berinteraksi, bagaimana musisi prepare, dan bagaimana venue ini beroperasi.',
                observation: 'Ada seorang gadis berambut kuning yang terlihat sangat organized, mengatur schedule dan coordinate dengan band. Dia terlihat seperti natural leader, tapi juga caring terhadap semua orang di sekitarnya.',
                insight: 'STARRY bukan hanya business - ini adalah community. Setiap orang di sini punya role yang penting, dan ada sense of family yang strong. Sebagai newcomer, kamu harus prove yourself tapi juga be genuine.'
            };
        case 'musisi_jalanan':
            return {
                description: 'Kamu memutuskan untuk observe scene musik Shimokitazawa dari perspektif yang berbeda. Duduk di kafe dengan gitar di samping, kamu memperhatikan flow musisi, audience, dan energy yang mengalir di district ini.',
                observation: 'Ada chemistry yang unik antara musisi solo dan band. Kamu melihat seorang bassist yang cool dan composed, bermain dengan teknik yang impressive. Dia terlihat seperti someone yang bisa teach kamu banyak hal.',
                insight: 'Bermain solo punya freedom, tapi bermain dalam band punya depth yang berbeda. Ada magic yang terjadi ketika musisi yang berbeda combine their skills. Mungkin saatnya untuk step out dari comfort zone?'
            };
        default:
            return {
                description: 'Kamu mengamati situasi sekitar dengan seksama.',
                observation: 'Banyak hal menarik yang bisa dipelajari dari pengamatan.',
                insight: 'Observasi yang baik adalah kunci untuk memahami lingkungan baru.'
            };
    }
}

function getApproachContent(originStory) {
    switch (originStory) {
        case 'siswa_pindahan':
            return {
                description: 'Kamu memutuskan untuk approach seseorang dan memperkenalkan diri. Dengan sedikit nervous tapi penuh determinasi, kamu mendekati sekelompok siswa yang terlihat friendly.',
                interaction: '"Um, excuse me... Aku siswa pindahan baru. Boleh aku join kalian?" Kamu bertanya dengan senyum yang genuine, meski jantung berdebar kencang.',
                reaction: 'Mereka welcome kamu dengan warm! Ternyata mereka juga music enthusiasts dan excited untuk bercerita tentang scene musik di sekolah. Ada yang mention tentang "Kessoku Band" yang sering perform di STARRY.'
            };
        case 'pekerja_starry':
            return {
                description: 'Kamu memutuskan untuk approach staff lain dan memperkenalkan diri sebagai newcomer. Dengan confidence yang professional tapi humble, kamu mendekati seseorang yang terlihat experienced.',
                interaction: '"Hi, aku staff baru di sini. Boleh aku tanya-tanya tentang how things work around here?" Kamu bertanya dengan tone yang respectful dan eager to learn.',
                reaction: 'Staff tersebut sangat helpful dan explain tentang culture di STARRY. Mereka mention bahwa ada band reguler bernama "Kessoku Band" yang sering latihan dan perform di sini - mereka special karena growth mereka yang incredible.'
            };
        case 'musisi_jalanan':
            return {
                description: 'Kamu memutuskan untuk approach fellow musisi dan start conversation tentang musik. Dengan gitar di tangan, kamu mendekati seseorang yang juga terlihat seperti musician.',
                interaction: '"Nice setup! Aku juga musisi, biasanya busking di area sini. Mind if aku tanya tentang scene musik lokal?" Kamu bertanya sambil menunjuk gitar mereka dengan appreciation.',
                reaction: 'Mereka excited untuk share! Ternyata ada banyak opportunity untuk collaborate dan perform di area ini. Mereka mention tentang STARRY sebagai venue yang supportive untuk indie musicians, dan ada band bernama "Kessoku Band" yang inspiring banyak musisi lokal.'
            };
        default:
            return {
                description: 'Kamu mendekati seseorang untuk berinteraksi.',
                interaction: 'Kamu memulai percakapan dengan ramah.',
                reaction: 'Mereka merespons dengan positif dan memberikan informasi yang berguna.'
            };
    }
}

/**
 * Fase 3: First Encounter dengan Kessoku Band
 */
async function prologuePhase3_FirstEncounter(interaction, originStory) {
    const encounterContent = getFirstEncounterContent(originStory);

    const encounterEmbed = new EmbedBuilder()
        .setColor('#ff9ff3')
        .setTitle('🎸 Pertemuan Pertama')
        .setDescription(encounterContent.setup)
        .addFields(
            { name: '👥 Yang Kamu Lihat', value: encounterContent.characters, inline: false },
            { name: '🎵 Yang Kamu Dengar', value: encounterContent.music, inline: false },
            { name: '💭 Yang Kamu Rasakan', value: encounterContent.feeling, inline: false }
        )
        .setFooter({ text: 'Momen yang akan mengubah segalanya...' });

    const finishRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`prologue_finish_${originStory}`)
                .setLabel('🌟 Selesaikan Prolog')
                .setStyle(ButtonStyle.Success)
        );

    await interaction.editReply({
        embeds: [encounterEmbed],
        components: [finishRow]
    });
}

/**
 * Fase 4: Conclusion dan Transition ke Gameplay
 */
async function prologuePhase4_Conclusion(interaction, originStory) {
    const conclusionContent = getConclusionContent(originStory);

    const conclusionEmbed = new EmbedBuilder()
        .setColor('#4ecdc4')
        .setTitle('🌸 Awal dari Petualangan Baru 🌸')
        .setDescription(conclusionContent.conclusion)
        .addFields(
            { name: '🎯 Tujuan Anda', value: conclusionContent.goals, inline: false },
            { name: '🎮 Langkah Selanjutnya', value: conclusionContent.nextSteps, inline: false },
            { name: '💡 Tips untuk Pemula', value: conclusionContent.tips, inline: false }
        )
        .setFooter({ text: 'Selamat datang di dunia Bocchi the Rock! Petualangan dimulai sekarang!' })
        .setTimestamp();

    // Remove all components (no more buttons)
    await interaction.editReply({
        embeds: [conclusionEmbed],
        components: []
    });

    console.log(`[PROLOGUE] Completed for ${interaction.user.id} with origin: ${originStory}`);
}

/**
 * Content untuk first encounter
 */
function getFirstEncounterContent(originStory) {
    switch (originStory) {
        case 'siswa_pindahan':
            return {
                setup: 'Saat kamu berjalan menuju ruang musik, kamu mendengar suara yang familiar - gitar yang nervous tapi beautiful yang kamu dengar tadi. Pintu ruang musik terbuka, dan kamu melihat...',
                characters: '🎸 **Bocchi** - Gadis berambut pink yang sedang bermain gitar sendirian, terlihat nervous tapi passionate\n🥁 **Nijika** - Gadis berambut kuning yang baru masuk, membawa stick drum dan tersenyum ramah\n🎸 **Ryo** - Gadis berambut biru yang cool, membawa bass dengan confidence\n🎤 **Kita** - Gadis berambut merah yang energetic, terlihat excited tentang sesuatu',
                music: 'Mereka sedang mencoba arrange sebuah lagu. Bocchi main melody yang beautiful tapi sedikit shaky, Nijika provide rhythm yang steady, Ryo add bass line yang complex, dan Kita hum melody dengan voice yang sweet.',
                feeling: 'Ada magic di udara. Ini bukan hanya band practice biasa - ini adalah momen dimana empat orang yang berbeda create something beautiful together. Kamu merasa... inspired? Envious? Atau mungkin... hopeful?'
            };
        case 'pekerja_starry':
            return {
                setup: 'Saat kamu sedang setup untuk shift, kamu mendengar sound check dari main stage. Kamu mengintip dan melihat band yang sudah kamu dengar tentang - Kessoku Band...',
                characters: '🎸 **Bocchi** - Lead guitarist yang terlihat nervous tapi skill-nya undeniable ketika dia mulai bermain\n🥁 **Nijika** - Drummer yang juga sepertinya leader, coordinate semua orang dengan smile yang infectious\n🎸 **Ryo** - Bassist yang cool dan composed, technique-nya impressive dan stage presence-nya strong\n🎤 **Kita** - Vocalist yang energetic dan charismatic, voice-nya perfect untuk indie rock',
                music: 'Mereka perform original song yang catchy dan emotional. Harmony mereka sudah tight, tapi masih ada room untuk improvement. Kamu bisa hear potential yang huge dalam musik mereka.',
                feeling: 'Sebagai staff STARRY, kamu realize bahwa kamu akan bekerja closely dengan band yang punya potential untuk go big. Ada excitement tentang being part of their journey, dan juga pressure untuk support mereka dengan baik.'
            };
        case 'musisi_jalanan':
            return {
                setup: 'Saat kamu berjalan melewati STARRY, pintu terbuka dan kamu bisa melihat band yang sedang latihan. Suara mereka yang kamu dengar dari luar ternyata...',
                characters: '🎸 **Bocchi** - Guitarist yang technique-nya remind kamu pada diri sendiri ketika pertama kali belajar, tapi ada something special dalam playing-nya\n🥁 **Nijika** - Drummer yang provide foundation yang solid, sepertinya dia yang keep everyone together\n🎸 **Ryo** - Bassist dengan style yang kamu admire, playing-nya clean dan purposeful\n🎤 **Kita** - Vocalist yang punya energy yang infectious, voice-nya complement musik mereka perfectly',
                music: 'Mereka main indie rock yang authentic dan heartfelt. Ada rawness dalam musik mereka yang remind kamu kenapa kamu jatuh cinta dengan musik di first place. Tapi juga ada polish yang show bahwa mereka serious tentang craft mereka.',
                feeling: 'Sebagai solo musician, kamu selalu wonder tentang band dynamic. Melihat mereka, kamu realize bahwa ada magic yang terjadi ketika right people come together. Mungkin... mungkin kamu juga bisa be part of something like this?'
            };
        default:
            return {
                setup: 'Kamu bertemu dengan Kessoku Band untuk pertama kalinya...',
                characters: 'Empat gadis yang passionate tentang musik.',
                music: 'Musik yang indah dan penuh emosi.',
                feeling: 'Perasaan excited tentang kemungkinan baru.'
            };
    }
}

/**
 * Content untuk conclusion
 */
function getConclusionContent(originStory) {
    switch (originStory) {
        case 'siswa_pindahan':
            return {
                conclusion: 'Hari pertama di sekolah baru berakhir dengan discovery yang unexpected. Kamu tidak hanya menemukan sekolah baru, tapi juga menemukan dunia musik yang vibrant dan orang-orang yang passionate. Ada feeling bahwa hidup kamu akan berubah di tempat ini.',
                goals: '🎓 Beradaptasi dengan kehidupan sekolah baru\n🎸 Explore passion musik yang baru kamu discover\n👥 Build friendship dengan Kessoku Band dan siswa lainnya\n🌟 Find your place dalam community musik sekolah',
                nextSteps: '• Gunakan `/profile` untuk melihat status dan relationship kamu\n• Gunakan `/say` untuk berinteraksi dengan karakter\n• Gunakan `/act` untuk melakukan aktivitas dan improve skills\n• Explore sekolah dan STARRY untuk discover more opportunities',
                tips: '💡 Nijika sangat friendly dan good starting point untuk friendship\n💡 Bocchi mungkin relate dengan kamu sebagai someone yang nervous di tempat baru\n💡 Join klub musik atau volunteer di STARRY untuk get closer dengan band\n💡 Be patient - relationship building takes time!'
            };
        case 'pekerja_starry':
            return {
                conclusion: 'Hari pertama kerja di STARRY exceed expectations kamu. Ini bukan hanya job - ini adalah opportunity untuk be part of something bigger. Kamu sudah get glimpse dari Kessoku Band dan potential mereka, dan kamu excited untuk support their journey.',
                goals: '💼 Excel dalam role kamu sebagai STARRY staff\n🎸 Support Kessoku Band dalam journey mereka\n🤝 Build professional dan personal relationship dengan team\n🌟 Contribute pada growth dari indie music scene di Shimokitazawa',
                nextSteps: '• Gunakan `/profile` untuk track progress kamu\n• Gunakan `/act bekerja_starry` untuk work dan interact dengan band\n• Gunakan `/say` untuk build relationship dengan Kessoku Band members\n• Explore Shimokitazawa untuk understand music scene lebih dalam',
                tips: '💡 Nijika appreciate hard work dan professionalism\n💡 Show genuine interest dalam musik untuk connect dengan semua members\n💡 Be helpful tapi jangan overstep boundaries\n💡 STARRY work gives you natural opportunities untuk interact dengan band'
            };
        case 'musisi_jalanan':
            return {
                conclusion: 'Hari ini open your eyes pada possibility baru. Sebagai solo musician, kamu sudah comfortable dengan independence, tapi melihat Kessoku Band perform together show kamu magic dari collaboration. Mungkin saatnya untuk explore new horizons.',
                goals: '🎵 Continue develop skill musik kamu\n🤝 Explore possibility untuk collaborate dengan other musicians\n🎸 Learn dari Kessoku Band tentang band dynamics\n🌟 Find balance antara solo artistry dan collaborative music',
                nextSteps: '• Gunakan `/act latihan_gitar` untuk improve skills kamu\n• Gunakan `/say` untuk approach Kessoku Band members\n• Gunakan `/act jalan_shimokitazawa` untuk discover more musicians\n• Consider volunteer atau hang out di STARRY untuk get closer dengan scene',
                tips: '💡 Ryo mungkin appreciate kamu sebagai fellow serious musician\n💡 Share your street performance experience - mereka might be interested\n💡 Offer untuk jam session atau give feedback pada musik mereka\n💡 Your independence adalah asset - show them different perspective'
            };
        default:
            return {
                conclusion: 'Petualangan baru telah dimulai dalam dunia Bocchi the Rock!',
                goals: 'Explore dunia musik dan build relationships.',
                nextSteps: 'Gunakan commands yang tersedia untuk berinteraksi dan berkembang.',
                tips: 'Be patient dan enjoy the journey!'
            };
    }
}

module.exports = {
    startPrologue,
    handlePrologueButton
};
