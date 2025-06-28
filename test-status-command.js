// Test file untuk memastikan command status berfungsi dengan baik
const { initializeDatabase, getPlayer, addPlayer, updatePlayer, closeDatabase } = require('./database');

// Mock interaction object untuk testing
function createMockInteraction(userId, hasPlayer = true) {
    return {
        user: {
            id: userId,
            displayAvatarURL: () => 'https://example.com/avatar.png'
        },
        reply: async (options) => {
            console.log('📤 Reply sent:');
            if (options.embeds && options.embeds[0]) {
                const embed = options.embeds[0];
                console.log(`   Title: ${embed.data.title}`);
                console.log(`   Description: ${embed.data.description}`);
                console.log(`   Color: #${embed.data.color?.toString(16) || 'default'}`);
                console.log(`   Fields: ${embed.data.fields?.length || 0} fields`);
                if (embed.data.fields) {
                    embed.data.fields.forEach((field, index) => {
                        console.log(`     Field ${index + 1}: ${field.name} = ${field.value.substring(0, 50)}${field.value.length > 50 ? '...' : ''}`);
                    });
                }
            }
            console.log(`   Ephemeral: ${options.ephemeral || false}\n`);
        }
    };
}

async function testStatusCommand() {
    console.log('🧪 Memulai test command status...\n');
    
    try {
        // Inisialisasi database
        console.log('Inisialisasi database...');
        await initializeDatabase();
        console.log('✅ Database berhasil diinisialisasi\n');
        
        // Import command status
        const statusCommand = require('./commands/status');
        
        // Test 1: User yang belum terdaftar
        console.log('Test 1: User yang belum terdaftar');
        const mockInteraction1 = createMockInteraction('999999999999999999');
        await statusCommand.execute(mockInteraction1);
        
        // Test 2: Buat user baru dan test status
        console.log('Test 2: User yang sudah terdaftar');
        const testUserId = '123456789012345678';

        // Hapus player lama jika ada
        const { db } = require('./database');
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM players WHERE discord_id = ?', [testUserId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Tambah player baru dengan origin story
        await addPlayer(testUserId, 'pekerja_starry', 12);
        
        // Update dengan beberapa relationship values
        await updatePlayer(testUserId, {
            bocchi_trust: 15,
            bocchi_comfort: 10,
            bocchi_affection: 5,
            nijika_trust: 25,
            nijika_comfort: 20,
            nijika_affection: 15,
            ryo_trust: 8,
            ryo_comfort: 5,
            ryo_affection: 2,
            kita_trust: 12,
            kita_comfort: 8,
            kita_affection: 6,
            current_weather: 'Hangat - Suasana live house yang nyaman',
            action_points: 8
        });
        
        const mockInteraction2 = createMockInteraction(testUserId);
        await statusCommand.execute(mockInteraction2);
        
        // Test 3: Test helper functions
        console.log('Test 3: Test helper functions');
        
        // Test getOriginStoryText
        console.log('✅ Origin Story Texts:');
        console.log(`   siswa_pindahan: ${statusCommand.getOriginStoryText('siswa_pindahan')}`);
        console.log(`   pekerja_starry: ${statusCommand.getOriginStoryText('pekerja_starry')}`);
        console.log(`   musisi_jalanan: ${statusCommand.getOriginStoryText('musisi_jalanan')}`);
        console.log(`   unknown: ${statusCommand.getOriginStoryText('unknown')}\n`);
        
        // Test formatRelationshipStatus
        console.log('✅ Relationship Status Format:');
        const testStatus = statusCommand.formatRelationshipStatus(25, 20, 15);
        console.log(`   Sample status (25,20,15): ${testStatus.level} - Total: ${testStatus.total}\n`);
        
        // Test calculateTotalRelationship
        const player = await getPlayer(testUserId);
        const totalRel = statusCommand.calculateTotalRelationship(player);
        console.log(`✅ Total Relationship: ${totalRel}`);
        
        // Test getRelationshipLevel
        const relLevel = statusCommand.getRelationshipLevel(totalRel);
        console.log(`✅ Relationship Level: ${relLevel}\n`);
        
        console.log('🎉 Semua test command status berhasil!');
        
    } catch (error) {
        console.error('❌ Error dalam test command status:', error);
    } finally {
        // Tutup koneksi database
        await closeDatabase();
        console.log('🔒 Koneksi database ditutup');
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testStatusCommand();
}

module.exports = { testStatusCommand };
