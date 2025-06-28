const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer } = require('../database');
const { getWeatherInfo } = require('../game_logic/weather');
const { MAX_ACTION_POINTS } = require('../daily-reset');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Lihat status lengkap karakter Anda dalam dunia Bocchi the Rock!'),
    
    async execute(interaction) {
        const discordId = interaction.user.id;
        
        try {
            // Mencari data pemain di database
            const player = await getPlayer(discordId);
            
            // Jika tidak ditemukan, berikan instruksi untuk menggunakan /start_life
            if (!player) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Belum Memulai Hidup')
                    .setDescription('Kamu belum memulai hidup dalam dunia Bocchi the Rock!')
                    .addFields(
                        { 
                            name: '🚀 Cara Memulai', 
                            value: 'Gunakan command `/start_life` untuk memulai petualangan Anda!\n\nPilih salah satu latar belakang:\n• **Siswa Pindahan** - Mulai sebagai siswa baru\n• **Pekerja Baru di STARRY** - Bekerja di live house\n• **Musisi Jalanan** - Musisi berpengalaman', 
                            inline: false 
                        }
                    )
                    .setFooter({ text: 'Selamat datang di dunia Bocchi the Rock!' })
                    .setTimestamp();
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Format semua data pemain ke dalam Discord Embed
            const embed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setTitle('📊 Status Karakter')
                .setDescription(`Status lengkap untuk <@${discordId}>`)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
            
            // Informasi Dasar
            embed.addFields(
                { name: '👤 Player ID', value: `<@${discordId}>`, inline: true },
                { name: '📅 Terakhir Bermain', value: player.last_played_date || 'Belum pernah', inline: true },
                { name: '⚡ Poin Aksi', value: `${player.action_points || 0}/${MAX_ACTION_POINTS}`, inline: true }
            );
            
            // Origin Story dan Cuaca
            const weatherDisplay = this.formatWeatherDisplay(player.current_weather);

            embed.addFields(
                {
                    name: '📖 Origin Story',
                    value: this.getOriginStoryText(player.origin_story) || 'Tidak diketahui',
                    inline: false
                },
                {
                    name: `${weatherDisplay.emoji} Cuaca Saat Ini`,
                    value: weatherDisplay.text,
                    inline: false
                }
            );
            
            // Separator untuk bagian relationship
            embed.addFields({ name: '\u200B', value: '**🎸 Status Hubungan dengan Kessoku Band**', inline: false });
            
            // Status Hubungan - Bocchi
            const bocchiStatus = this.formatRelationshipStatus(
                player.bocchi_trust || 0,
                player.bocchi_comfort || 0,
                player.bocchi_affection || 0
            );
            embed.addFields({
                name: '🎸 Bocchi (Hitori Gotoh)',
                value: bocchiStatus.text,
                inline: true
            });
            
            // Status Hubungan - Nijika
            const nijikaStatus = this.formatRelationshipStatus(
                player.nijika_trust || 0,
                player.nijika_comfort || 0,
                player.nijika_affection || 0
            );
            embed.addFields({
                name: '🥁 Nijika (Ijichi Nijika)',
                value: nijikaStatus.text,
                inline: true
            });
            
            // Status Hubungan - Ryo
            const ryoStatus = this.formatRelationshipStatus(
                player.ryo_trust || 0,
                player.ryo_comfort || 0,
                player.ryo_affection || 0
            );
            embed.addFields({
                name: '🎸 Ryo (Yamada Ryo)',
                value: ryoStatus.text,
                inline: true
            });
            
            // Status Hubungan - Kita
            const kitaStatus = this.formatRelationshipStatus(
                player.kita_trust || 0,
                player.kita_comfort || 0,
                player.kita_affection || 0
            );
            embed.addFields({
                name: '🎤 Kita (Ikuyo Kita)',
                value: kitaStatus.text,
                inline: true
            });
            
            // Ringkasan Total
            const totalRelationship = this.calculateTotalRelationship(player);
            embed.addFields(
                { name: '\u200B', value: '\u200B', inline: true }, // Spacer
                {
                    name: '📈 Total Hubungan',
                    value: `${totalRelationship}/1200\n${this.getRelationshipLevel(totalRelationship)}`,
                    inline: true
                }
            );
            
            // Footer dengan tips
            embed.setFooter({ 
                text: 'Tip: Gunakan action points untuk berinteraksi dan meningkatkan hubungan!' 
            })
            .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error dalam command status:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Error')
                .setDescription('Terjadi kesalahan saat mengambil status. Silakan coba lagi.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
    
    // Helper function untuk mengkonversi origin story ke text
    getOriginStoryText(originStory) {
        switch (originStory) {
            case 'siswa_pindahan':
                return '🎒 Siswa Pindahan';
            case 'pekerja_starry':
                return '🏢 Pekerja Baru di STARRY';
            case 'musisi_jalanan':
                return '🎵 Musisi Jalanan';
            default:
                return originStory || 'Tidak diketahui';
        }
    },
    
    // Helper function untuk format status relationship
    formatRelationshipStatus(trust, comfort, affection) {
        const total = trust + comfort + affection;
        const maxPerStat = 100;
        const maxTotal = maxPerStat * 3; // 300
        
        // Tentukan level hubungan berdasarkan total
        let level = '';
        let emoji = '';
        
        if (total === 0) {
            level = 'Belum Kenal';
            emoji = '❓';
        } else if (total <= 30) {
            level = 'Kenalan';
            emoji = '👋';
        } else if (total <= 60) {
            level = 'Teman';
            emoji = '😊';
        } else if (total <= 120) {
            level = 'Teman Baik';
            emoji = '😄';
        } else if (total <= 180) {
            level = 'Teman Dekat';
            emoji = '🤗';
        } else if (total <= 240) {
            level = 'Sahabat';
            emoji = '💙';
        } else {
            level = 'Sahabat Sejati';
            emoji = '💖';
        }
        
        const statusText = `${emoji} **${level}** (${total}/${maxTotal})\n` +
                          `Trust: ${trust}/${maxPerStat}\n` +
                          `Comfort: ${comfort}/${maxPerStat}\n` +
                          `Affection: ${affection}/${maxPerStat}`;
        
        return {
            text: statusText,
            total: total,
            level: level
        };
    },
    
    // Helper function untuk menghitung total relationship
    calculateTotalRelationship(player) {
        const bocchiTotal = (player.bocchi_trust || 0) + (player.bocchi_comfort || 0) + (player.bocchi_affection || 0);
        const nijikaTotal = (player.nijika_trust || 0) + (player.nijika_comfort || 0) + (player.nijika_affection || 0);
        const ryoTotal = (player.ryo_trust || 0) + (player.ryo_comfort || 0) + (player.ryo_affection || 0);
        const kitaTotal = (player.kita_trust || 0) + (player.kita_comfort || 0) + (player.kita_affection || 0);
        
        return bocchiTotal + nijikaTotal + ryoTotal + kitaTotal;
    },
    
    // Helper function untuk mendapatkan level hubungan keseluruhan
    getRelationshipLevel(totalRelationship) {
        if (totalRelationship === 0) {
            return '🌱 Pemula';
        } else if (totalRelationship <= 100) {
            return '🎵 Pendengar';
        } else if (totalRelationship <= 300) {
            return '🎸 Penggemar';
        } else if (totalRelationship <= 600) {
            return '🎤 Supporter';
        } else if (totalRelationship <= 900) {
            return '⭐ Bagian dari Band';
        } else {
            return '👑 Kessoku Band Family';
        }
    },

    // Helper function untuk format tampilan cuaca dengan emoji yang sesuai
    formatWeatherDisplay(currentWeather) {
        if (!currentWeather || currentWeather === 'tidak diketahui') {
            return {
                emoji: '🌤️',
                text: 'Tidak diketahui'
            };
        }

        // Ekstrak nama cuaca dari format "Nama - Deskripsi"
        const weatherName = currentWeather.split(' - ')[0];
        const weatherInfo = getWeatherInfo(weatherName);

        // Mapping emoji berdasarkan nama cuaca
        const weatherEmojis = {
            'Cerah': '☀️',
            'Cerah Berawan': '⛅',
            'Mendung': '☁️',
            'Hujan Ringan': '🌦️',
            'Hujan Deras': '🌧️',
            'Berangin': '💨',
            'Dingin': '🥶',
            'Badai': '⛈️'
        };

        const emoji = weatherEmojis[weatherName] || '🌤️';

        // Format text dengan informasi mood jika tersedia
        let displayText = currentWeather;
        if (weatherInfo && weatherInfo.mood) {
            const moodText = this.getMoodText(weatherInfo.mood);
            displayText += `\n*${moodText}*`;
        }

        return {
            emoji: emoji,
            text: displayText
        };
    },

    // Helper function untuk mendapatkan teks mood yang user-friendly
    getMoodText(mood) {
        const moodTexts = {
            'cheerful': 'Suasana ceria dan menyenangkan',
            'pleasant': 'Suasana nyaman dan tenang',
            'melancholic': 'Suasana melankolis dan introspektif',
            'romantic': 'Suasana romantis dan menenangkan',
            'intimate': 'Suasana intim dan hangat',
            'dramatic': 'Suasana dramatis dan energik',
            'cozy': 'Suasana hangat dan nyaman',
            'intense': 'Suasana intens dan mendebarkan'
        };

        return moodTexts[mood] || 'Suasana normal';
    }
};
