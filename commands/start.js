const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer, addPlayer } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start_life')
        .setDescription('Mulai hidup baru dalam dunia Bocchi the Rock!')
        .addStringOption(option =>
            option.setName('origin_story')
                .setDescription('Pilih latar belakang karakter Anda')
                .setRequired(true)
                .addChoices(
                    { name: 'Siswa Pindahan', value: 'siswa_pindahan' },
                    { name: 'Pekerja Baru di STARRY', value: 'pekerja_starry' },
                    { name: 'Musisi Jalanan', value: 'musisi_jalanan' }
                )
        ),
    
    async execute(interaction) {
        const discordId = interaction.user.id;
        const originStoryChoice = interaction.options.getString('origin_story');
        
        try {
            // Cek apakah pemain sudah terdaftar
            const existingPlayer = await getPlayer(discordId);
            
            if (existingPlayer) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Sudah Memulai Hidup')
                    .setDescription('Kamu sudah memulai hidup dalam dunia Bocchi the Rock!')
                    .addFields(
                        { name: '📖 Origin Story', value: this.getOriginStoryText(existingPlayer.origin_story), inline: false },
                        { name: '📅 Dimulai Pada', value: existingPlayer.last_played_date || 'Tidak diketahui', inline: true },
                        { name: '⚡ Action Points', value: existingPlayer.action_points?.toString() || '0', inline: true }
                    )
                    .setFooter({ text: 'Gunakan /profile untuk melihat status lengkap' })
                    .setTimestamp();
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Tentukan nilai awal berdasarkan origin story
            const initialValues = this.getInitialValues(originStoryChoice);
            
            // Daftarkan pemain baru dengan nilai awal yang sesuai
            await addPlayer(discordId, originStoryChoice, initialValues.actionPoints);
            
            // Update nilai relasi awal jika ada
            if (Object.keys(initialValues.relationships).length > 0) {
                const { updatePlayer } = require('../database');
                await updatePlayer(discordId, initialValues.relationships);
            }
            
            // Buat embed konfirmasi
            const embed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setTitle('🎉 Selamat Datang di Dunia Bocchi the Rock!')
                .setDescription(`Hidup baru telah dimulai sebagai **${this.getOriginStoryText(originStoryChoice)}**!`)
                .addFields(
                    { name: '👤 Player', value: `<@${discordId}>`, inline: true },
                    { name: '⚡ Action Points', value: initialValues.actionPoints.toString(), inline: true },
                    { name: '📅 Dimulai', value: new Date().toISOString().split('T')[0], inline: true }
                )
                .addFields(
                    { name: '📖 Cerita Latar Belakang', value: initialValues.storyDescription, inline: false }
                );
            
            // Tambahkan informasi bonus relasi jika ada
            if (Object.keys(initialValues.relationships).length > 0) {
                const relationshipText = this.formatInitialRelationships(initialValues.relationships);
                embed.addFields(
                    { name: '🎸 Bonus Hubungan Awal', value: relationshipText, inline: false }
                );
            }
            
            embed.addFields(
                { name: '🎮 Langkah Selanjutnya', value: 'Gunakan `/profile` untuk melihat status lengkap dan mulai petualangan Anda!', inline: false }
            )
            .setFooter({ text: 'Selamat bermain!' })
            .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error dalam command start_life:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Error')
                .setDescription('Terjadi kesalahan saat memulai hidup baru. Silakan coba lagi.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
    
    // Helper function untuk mendapatkan nilai awal berdasarkan origin story
    getInitialValues(originStoryChoice) {
        const currentDate = new Date().toISOString().split('T')[0];
        
        switch (originStoryChoice) {
            case 'siswa_pindahan':
                return {
                    actionPoints: 10,
                    storyDescription: 'Sebagai siswa pindahan, kamu baru saja tiba di sekolah baru dan masih beradaptasi. Kamu memiliki kesempatan segar untuk berteman dengan siapa saja!',
                    relationships: {
                        nijika_trust: 5,
                        nijika_comfort: 3,
                        current_weather: 'Cerah - Hari pertama yang menjanjikan'
                    }
                };
                
            case 'pekerja_starry':
                return {
                    actionPoints: 12,
                    storyDescription: 'Sebagai pekerja baru di live house STARRY, kamu sudah familiar dengan dunia musik dan memiliki akses langsung ke tempat Kessoku Band berlatih.',
                    relationships: {
                        nijika_trust: 8,
                        nijika_comfort: 5,
                        ryo_trust: 3,
                        kita_trust: 4,
                        current_weather: 'Hangat - Suasana live house yang nyaman'
                    }
                };
                
            case 'musisi_jalanan':
                return {
                    actionPoints: 8,
                    storyDescription: 'Sebagai musisi jalanan, kamu sudah memiliki pengalaman bermusik dan kepercayaan diri yang tinggi, tapi masih perlu belajar tentang bermain dalam band.',
                    relationships: {
                        bocchi_trust: 3,
                        bocchi_comfort: 2,
                        ryo_trust: 5,
                        ryo_comfort: 3,
                        current_weather: 'Berawan - Seperti suasana hati yang kompleks'
                    }
                };
                
            default:
                return {
                    actionPoints: 10,
                    storyDescription: 'Memulai petualangan baru dalam dunia Bocchi the Rock!',
                    relationships: {}
                };
        }
    },
    
    // Helper function untuk mengkonversi choice value ke text yang readable
    getOriginStoryText(originStoryChoice) {
        switch (originStoryChoice) {
            case 'siswa_pindahan':
                return 'Siswa Pindahan';
            case 'pekerja_starry':
                return 'Pekerja Baru di STARRY';
            case 'musisi_jalanan':
                return 'Musisi Jalanan';
            default:
                return 'Tidak diketahui';
        }
    },
    
    // Helper function untuk format initial relationships
    formatInitialRelationships(relationships) {
        const relationshipTexts = [];
        
        if (relationships.bocchi_trust || relationships.bocchi_comfort || relationships.bocchi_affection) {
            relationshipTexts.push(`🎸 Bocchi: Trust +${relationships.bocchi_trust || 0}, Comfort +${relationships.bocchi_comfort || 0}`);
        }
        
        if (relationships.nijika_trust || relationships.nijika_comfort || relationships.nijika_affection) {
            relationshipTexts.push(`🥁 Nijika: Trust +${relationships.nijika_trust || 0}, Comfort +${relationships.nijika_comfort || 0}`);
        }
        
        if (relationships.ryo_trust || relationships.ryo_comfort || relationships.ryo_affection) {
            relationshipTexts.push(`🎸 Ryo: Trust +${relationships.ryo_trust || 0}, Comfort +${relationships.ryo_comfort || 0}`);
        }
        
        if (relationships.kita_trust || relationships.kita_comfort || relationships.kita_affection) {
            relationshipTexts.push(`🎤 Kita: Trust +${relationships.kita_trust || 0}, Comfort +${relationships.kita_comfort || 0}`);
        }
        
        return relationshipTexts.length > 0 ? relationshipTexts.join('\n') : 'Tidak ada bonus khusus';
    }
};
