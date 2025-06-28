const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Lihat profil dan status permainan Anda'),
    
    async execute(interaction) {
        const discordId = interaction.user.id;
        
        try {
            const player = await getPlayer(discordId);
            
            if (!player) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Belum Terdaftar')
                    .setDescription('Kamu belum terdaftar dalam Bocchi Game!')
                    .addFields(
                        { name: '📝 Cara Daftar', value: 'Gunakan command `/register` untuk mendaftar', inline: false }
                    )
                    .setTimestamp();
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Format relationship status
            const formatRelationship = (trust, comfort, affection) => {
                return `Trust: ${trust}/100 | Comfort: ${comfort}/100 | Affection: ${affection}/100`;
            };
            
            const embed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setTitle('👤 Profil Pemain')
                .setDescription(`Profil untuk <@${discordId}>`)
                .addFields(
                    { name: '📅 Terakhir Bermain', value: player.last_played_date || 'Belum pernah', inline: true },
                    { name: '⚡ Action Points', value: player.action_points?.toString() || '0', inline: true },
                    { name: '🌤️ Cuaca Saat Ini', value: player.current_weather || 'Tidak diketahui', inline: true }
                )
                .addFields(
                    { name: '📖 Origin Story', value: player.origin_story || 'Tidak ada cerita latar belakang', inline: false }
                )
                .addFields(
                    { name: '🎸 Bocchi (Hitori Gotoh)', value: formatRelationship(player.bocchi_trust, player.bocchi_comfort, player.bocchi_affection), inline: false },
                    { name: '🥁 Nijika (Ijichi Nijika)', value: formatRelationship(player.nijika_trust, player.nijika_comfort, player.nijika_affection), inline: false },
                    { name: '🎸 Ryo (Yamada Ryo)', value: formatRelationship(player.ryo_trust, player.ryo_comfort, player.ryo_affection), inline: false },
                    { name: '🎤 Kita (Ikuyo Kita)', value: formatRelationship(player.kita_trust, player.kita_comfort, player.kita_affection), inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error dalam command profile:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Error')
                .setDescription('Terjadi kesalahan saat mengambil profil. Silakan coba lagi.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
