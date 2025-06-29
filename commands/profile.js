const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer, getKnownCharacters } = require('../database');
const { getAllCharactersWithStatus } = require('../game_logic/character_descriptions');

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
            
            // Dapatkan daftar karakter yang sudah dikenal (Fase 4.7)
            const knownCharacters = await getKnownCharacters(discordId);
            const allCharactersStatus = getAllCharactersWithStatus(knownCharacters);

            // Format relationship status
            const formatRelationship = (trust, comfort, affection) => {
                const total = trust + comfort + affection;
                let level = 'Stranger';
                if (total >= 15) level = 'Close Friend';
                else if (total >= 10) level = 'Good Friend';
                else if (total >= 5) level = 'Acquaintance';
                else if (total >= 1) level = 'Met';

                return `${level} (${total}/300)\nTrust: ${trust}/100 | Comfort: ${comfort}/100 | Affection: ${affection}/100`;
            };

            const formatUnknownCharacter = (description) => {
                return `[ Hubungan Belum Terbentuk ]\n*Kamu belum berkenalan dengan karakter ini*`;
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
                );

            // Tambahkan section relationship dengan sistem known/unknown (Fase 4.7)
            embed.addFields({ name: '💝 Status Hubungan dengan Kessoku Band', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', inline: false });

            // Bocchi
            const bocchiStatus = allCharactersStatus['Bocchi'];
            if (bocchiStatus.isKnown) {
                embed.addFields({
                    name: `🎸 ${bocchiStatus.name} (Hitori Gotoh)`,
                    value: formatRelationship(player.bocchi_trust || 0, player.bocchi_comfort || 0, player.bocchi_affection || 0),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: `❓ ${bocchiStatus.displayName} (${bocchiStatus.description})`,
                    value: formatUnknownCharacter(bocchiStatus.description),
                    inline: false
                });
            }

            // Nijika
            const nijikaStatus = allCharactersStatus['Nijika'];
            if (nijikaStatus.isKnown) {
                embed.addFields({
                    name: `🥁 ${nijikaStatus.name} (Ijichi Nijika)`,
                    value: formatRelationship(player.nijika_trust || 0, player.nijika_comfort || 0, player.nijika_affection || 0),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: `❓ ${nijikaStatus.displayName} (${nijikaStatus.description})`,
                    value: formatUnknownCharacter(nijikaStatus.description),
                    inline: false
                });
            }

            // Ryo
            const ryoStatus = allCharactersStatus['Ryo'];
            if (ryoStatus.isKnown) {
                embed.addFields({
                    name: `🎸 ${ryoStatus.name} (Yamada Ryo)`,
                    value: formatRelationship(player.ryo_trust || 0, player.ryo_comfort || 0, player.ryo_affection || 0),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: `❓ ${ryoStatus.displayName} (${ryoStatus.description})`,
                    value: formatUnknownCharacter(ryoStatus.description),
                    inline: false
                });
            }

            // Kita
            const kitaStatus = allCharactersStatus['Kita'];
            if (kitaStatus.isKnown) {
                embed.addFields({
                    name: `🎤 ${kitaStatus.name} (Ikuyo Kita)`,
                    value: formatRelationship(player.kita_trust || 0, player.kita_comfort || 0, player.kita_affection || 0),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: `❓ ${kitaStatus.displayName} (${kitaStatus.description})`,
                    value: formatUnknownCharacter(kitaStatus.description),
                    inline: false
                });
            }

            // Tambahkan footer dengan info sistem perkenalan
            embed.addFields({
                name: '💡 Tips Perkenalan',
                value: `Karakter yang ditandai ❓ belum kamu kenal. Berinteraksilah dengan mereka menggunakan \`/say\` atau tunggu mereka memulai percakapan untuk berkenalan!`,
                inline: false
            });

            embed.setTimestamp();
            
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
