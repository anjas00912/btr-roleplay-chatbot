const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer, addPlayer } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Daftar untuk bermain Bocchi Game')
        .addStringOption(option =>
            option.setName('origin_story')
                .setDescription('Ceritakan latar belakang karakter Anda (opsional)')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        const discordId = interaction.user.id;
        const originStory = interaction.options.getString('origin_story');
        
        try {
            // Cek apakah pemain sudah terdaftar
            const existingPlayer = await getPlayer(discordId);
            
            if (existingPlayer) {
                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Sudah Terdaftar')
                    .setDescription('Kamu sudah terdaftar dalam Bocchi Game!')
                    .addFields(
                        { name: '📅 Terakhir Bermain', value: existingPlayer.last_played_date || 'Belum pernah', inline: true },
                        { name: '⚡ Action Points', value: existingPlayer.action_points?.toString() || '0', inline: true }
                    )
                    .setTimestamp();
                
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Daftarkan pemain baru
            await addPlayer(discordId, originStory, 3);
            
            const embed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setTitle('🎉 Selamat Datang di Bocchi Game!')
                .setDescription('Kamu berhasil terdaftar! Sekarang kamu bisa mulai bermain.')
                .addFields(
                    { name: '👤 Player ID', value: `<@${discordId}>`, inline: true },
                    { name: '⚡ Action Points', value: '3', inline: true },
                    { name: '📖 Origin Story', value: originStory || 'Tidak ada cerita latar belakang', inline: false }
                )
                .addFields(
                    { name: '🎸 Status Hubungan', value: 'Semua karakter: 0/100 (Trust, Comfort, Affection)', inline: false }
                )
                .setFooter({ text: 'Gunakan /help untuk melihat command yang tersedia' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error dalam command register:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Error')
                .setDescription('Terjadi kesalahan saat mendaftarkan pemain. Silakan coba lagi.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
