// Command /go - Sistem Navigasi Dunia untuk Fase 4.8
// Memisahkan navigasi dari aksi untuk memberikan kebebasan pemain berpindah lokasi

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPlayer, updatePlayer } = require('../database');
const { checkAndResetDailyStats, hasEnoughAP, createInsufficientAPEmbed } = require('../daily-reset');
const { getLocationStatus, getCharactersAtLocation } = require('../game_logic/schedules');
const { getCurrentJST } = require('../utils/time');
const { getWeatherInfo } = require('../game_logic/weather');

// Daftar lokasi yang tersedia dengan autocomplete
const AVAILABLE_LOCATIONS = [
    { name: 'STARRY', value: 'STARRY', description: 'Live house tempat Kessoku Band latihan' },
    { name: 'SMA Shuka', value: 'SMA_Shuka', description: 'Sekolah Kita dan Bocchi' },
    { name: 'Shimokitazawa High', value: 'Shimokitazawa_High', description: 'Sekolah Nijika dan Ryo' },
    { name: 'Shimokitazawa Street', value: 'Shimokitazawa_Street', description: 'Jalan utama area musik indie' },
    { name: 'Taman Yoyogi', value: 'Taman_Yoyogi', description: 'Taman untuk busking dan santai' },
    { name: 'Stasiun Shimokitazawa', value: 'Stasiun_Shimokitazawa', description: 'Stasiun kereta utama' },
    { name: 'Rumah Bocchi', value: 'Rumah_Bocchi', description: 'Rumah Hitori Gotoh' },
    { name: 'Rumah Nijika', value: 'Rumah_Nijika', description: 'Rumah Ijichi bersaudara' }
];

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('go')
        .setDescription('Berpindah ke lokasi lain di dunia Bocchi the Rock')
        .addStringOption(option =>
            option.setName('lokasi')
                .setDescription('Pilih lokasi tujuan')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        
        // Filter lokasi berdasarkan input user
        const filtered = AVAILABLE_LOCATIONS.filter(location =>
            location.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
            location.description.toLowerCase().includes(focusedValue.toLowerCase())
        );
        
        // Batasi hasil maksimal 25 (limit Discord)
        const choices = filtered.slice(0, 25).map(location => ({
            name: `${location.name} - ${location.description}`,
            value: location.value
        }));
        
        await interaction.respond(choices);
    },

    async execute(interaction) {
        const discordId = interaction.user.id;
        const targetLocation = interaction.options.getString('lokasi');
        
        try {
            // Defer reply untuk operasi yang mungkin lama
            await interaction.deferReply();
            
            // 1. Cek dan reset daily stats
            await checkAndResetDailyStats(discordId);
            
            // 2. Ambil data pemain
            const player = await getPlayer(discordId);
            if (!player) {
                const embed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Pemain Tidak Ditemukan')
                    .setDescription('Kamu belum terdaftar! Gunakan `/start` untuk memulai petualangan.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            // 3. Cek AP yang cukup untuk perjalanan
            const travelCost = this.calculateTravelCost(player.current_location || 'STARRY', targetLocation);
            
            if (!hasEnoughAP(player, travelCost)) {
                const embed = createInsufficientAPEmbed(player.action_points, travelCost);
                return await interaction.editReply({ embeds: [embed] });
            }
            
            // 4. Validasi lokasi target
            const locationInfo = this.getLocationInfo(targetLocation);
            if (!locationInfo) {
                const embed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Lokasi Tidak Valid')
                    .setDescription(`Lokasi "${targetLocation}" tidak ditemukan. Gunakan autocomplete untuk melihat lokasi yang tersedia.`)
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            // 5. Cek status lokasi (buka/tutup)
            const currentTime = getCurrentJST();
            const locationStatus = getLocationStatus(targetLocation, currentTime.hour, currentTime.dayOfWeek);
            
            if (!locationStatus.isOpen) {
                const embed = new EmbedBuilder()
                    .setColor('#ffa502')
                    .setTitle('🔒 Lokasi Tutup')
                    .setDescription(`**${locationInfo.displayName}** sedang tutup saat ini.`)
                    .addFields(
                        { name: '🕐 Waktu Saat Ini', value: `${currentTime.dayName}, ${currentTime.timeString} JST`, inline: true },
                        { name: '⏰ Jam Buka', value: locationStatus.openingHours || 'Tidak diketahui', inline: true },
                        { name: '💡 Saran', value: locationStatus.suggestion || 'Coba lagi nanti saat lokasi buka.', inline: false }
                    )
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            // 6. Update lokasi pemain dan kurangi AP
            await updatePlayer(discordId, {
                current_location: targetLocation,
                action_points: player.action_points - travelCost
            });
            
            // 7. Generate narasi kedatangan dengan LLM
            const arrivalNarration = await this.generateArrivalNarration(
                targetLocation, 
                player, 
                currentTime, 
                locationStatus
            );
            
            // 8. Kirim pesan kedatangan
            await this.sendArrivalMessage(interaction, arrivalNarration, locationInfo, travelCost);
            
            console.log(`[GO] ${discordId} traveled to ${targetLocation} (cost: ${travelCost} AP)`);
            
        } catch (error) {
            console.error('[GO] Error executing travel command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Error Perjalanan')
                .setDescription('Terjadi kesalahan saat berpindah lokasi. Silakan coba lagi.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    /**
     * Hitung biaya AP untuk perjalanan berdasarkan jarak
     */
    calculateTravelCost(fromLocation, toLocation) {
        // Jika lokasi sama, tidak ada biaya
        if (fromLocation === toLocation) return 0;
        
        // Biaya dasar berdasarkan jenis lokasi
        const locationTypes = {
            'STARRY': 'shimokitazawa',
            'Shimokitazawa_Street': 'shimokitazawa',
            'Stasiun_Shimokitazawa': 'shimokitazawa',
            'SMA_Shuka': 'school',
            'Shimokitazawa_High': 'school',
            'Taman_Yoyogi': 'park',
            'Rumah_Bocchi': 'residential',
            'Rumah_Nijika': 'residential'
        };
        
        const fromType = locationTypes[fromLocation] || 'unknown';
        const toType = locationTypes[toLocation] || 'unknown';
        
        // Biaya berdasarkan jarak antar area
        if (fromType === toType) return 1; // Dalam area yang sama
        if (fromType === 'shimokitazawa' || toType === 'shimokitazawa') return 2; // Ke/dari Shimokitazawa
        return 3; // Antar area yang jauh
    },

    /**
     * Dapatkan informasi lokasi
     */
    getLocationInfo(locationValue) {
        const locationMap = {
            'STARRY': { displayName: 'STARRY Live House', type: 'live_house' },
            'SMA_Shuka': { displayName: 'SMA Shuka', type: 'school' },
            'Shimokitazawa_High': { displayName: 'Shimokitazawa High School', type: 'school' },
            'Shimokitazawa_Street': { displayName: 'Shimokitazawa Street', type: 'street' },
            'Taman_Yoyogi': { displayName: 'Taman Yoyogi', type: 'park' },
            'Stasiun_Shimokitazawa': { displayName: 'Stasiun Shimokitazawa', type: 'station' },
            'Rumah_Bocchi': { displayName: 'Rumah Bocchi', type: 'residence' },
            'Rumah_Nijika': { displayName: 'Rumah Nijika', type: 'residence' }
        };
        
        return locationMap[locationValue] || null;
    },

    /**
     * Generate narasi kedatangan dengan LLM
     */
    async generateArrivalNarration(targetLocation, player, currentTime, locationStatus) {
        try {
            // Dapatkan karakter yang ada di lokasi
            const charactersAtLocation = getCharactersAtLocation(targetLocation, currentTime.hour, currentTime.dayOfWeek);
            const weatherInfo = getWeatherInfo();
            
            const prompt = `Sistem: Pemain baru saja tiba di ${targetLocation} pada pukul ${currentTime.timeString} JST, ${currentTime.dayName}.

KONTEKS LOKASI:
- Lokasi: ${targetLocation}
- Status: ${locationStatus.isOpen ? 'Buka' : 'Tutup'}
- Waktu: ${currentTime.dayName}, ${currentTime.timeString} JST
- Cuaca: ${weatherInfo.condition}

KARAKTER YANG ADA:
${charactersAtLocation.length > 0 ? 
    charactersAtLocation.map(char => `- ${char.name}: ${char.activity} (${char.availability})`).join('\n') :
    '- Tidak ada karakter utama di lokasi ini saat ini'
}

INSTRUKSI:
Deskripsikan suasana di ${targetLocation} saat pemain tiba. Fokus pada:
1. Atmosphere dan visual details lokasi
2. Aktivitas yang sedang berlangsung
3. Karakter yang ada dan apa yang mereka lakukan
4. Peluang interaksi atau aksi yang tersedia

Gunakan 80-120 kata. Buat narasi yang immersive dan mengundang pemain untuk beraksi.

Respons dalam format JSON:
{
    "narration": "Deskripsi kedatangan yang detail dan atmospheric"
}`;

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const llmResponse = response.text();
            
            // Parse respons JSON
            const cleanResponse = llmResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsedResponse = JSON.parse(cleanResponse);
            
            return parsedResponse.narration;
            
        } catch (error) {
            console.error('[GO] Error generating arrival narration:', error);
            
            // Fallback narration
            const locationInfo = this.getLocationInfo(targetLocation);
            return `Kamu tiba di ${locationInfo.displayName}. Suasana ${currentTime.hour < 12 ? 'pagi' : currentTime.hour < 18 ? 'siang' : 'sore'} hari terasa ${weatherInfo.condition.toLowerCase()}. Ada beberapa hal menarik yang bisa kamu lakukan di sini.`;
        }
    },

    /**
     * Kirim pesan kedatangan
     */
    async sendArrivalMessage(interaction, narration, locationInfo, travelCost) {
        const currentTime = getCurrentJST();
        const charactersAtLocation = getCharactersAtLocation(locationInfo.displayName, currentTime.hour, currentTime.dayOfWeek);
        
        const embed = new EmbedBuilder()
            .setColor('#4ecdc4')
            .setTitle(`🚶‍♂️ Tiba di ${locationInfo.displayName}`)
            .setDescription(narration)
            .addFields(
                { name: '📍 Lokasi Saat Ini', value: locationInfo.displayName, inline: true },
                { name: '⚡ AP Digunakan', value: `${travelCost} AP`, inline: true },
                { name: '🕐 Waktu', value: `${currentTime.dayName}, ${currentTime.timeString} JST`, inline: true }
            );
        
        // Tambahkan info karakter jika ada
        if (charactersAtLocation.length > 0) {
            const characterList = charactersAtLocation
                .map(char => `${char.name} (${char.availability})`)
                .join('\n');
            
            embed.addFields({
                name: '👥 Karakter di Lokasi',
                value: characterList,
                inline: false
            });
        }
        
        embed.addFields({
            name: '🎯 Apa Selanjutnya?',
            value: 'Gunakan `/act` untuk melihat aksi yang tersedia di lokasi ini, atau `/say` untuk berinteraksi dengan karakter!',
            inline: false
        });
        
        embed.setFooter({ text: 'Sistem Navigasi v4.8 • Gunakan /go untuk berpindah lokasi lain' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};
