// Test file untuk memastikan command say berfungsi dengan baik
const { initializeDatabase, getPlayer, addPlayer, updatePlayer, closeDatabase } = require('./database');

// Mock interaction object untuk testing
function createMockInteraction(userId, dialog, hasDeferred = false) {
    return {
        user: {
            id: userId
        },
        options: {
            getString: (name) => {
                if (name === 'dialog') return dialog;
                return null;
            }
        },
        reply: async (options) => {
            console.log('📤 Reply sent:');
            if (options.embeds && options.embeds[0]) {
                const embed = options.embeds[0];
                console.log(`   Title: ${embed.data.title}`);
                console.log(`   Description: ${embed.data.description?.substring(0, 100)}...`);
                console.log(`   Color: #${embed.data.color?.toString(16) || 'default'}`);
                console.log(`   Ephemeral: ${options.ephemeral || false}`);
            }
            console.log('');
        },
        deferReply: async () => {
            console.log('🔄 Reply deferred');
            hasDeferred = true;
        },
        editReply: async (options) => {
            console.log('📝 Reply edited:');
            if (options.embeds && options.embeds[0]) {
                const embed = options.embeds[0];
                console.log(`   Title: ${embed.data.title}`);
                console.log(`   Description: ${embed.data.description?.substring(0, 100)}...`);
                console.log(`   Fields: ${embed.data.fields?.length || 0} fields`);
            }
            console.log('');
        },
        deferred: hasDeferred
    };
}

async function testSayCommand() {
    console.log('🧪 Memulai test command say...\n');
    
    try {
        // Inisialisasi database
        console.log('Inisialisasi database...');
        await initializeDatabase();
        console.log('✅ Database berhasil diinisialisasi\n');
        
        // Import command say
        const sayCommand = require('./commands/say');
        
        // Test 1: User yang belum terdaftar
        console.log('Test 1: User yang belum terdaftar');
        const mockInteraction1 = createMockInteraction('999999999999999999', 'Hello!');
        await sayCommand.execute(mockInteraction1);
        
        // Test 2: User terdaftar tapi tidak ada AP
        console.log('Test 2: User terdaftar tapi tidak ada Action Points');
        const testUserId = '123456789012345678';
        
        // Hapus player lama jika ada
        const { db } = require('./database');
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM players WHERE discord_id = ?', [testUserId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Tambah player dengan 0 AP
        await addPlayer(testUserId, 'pekerja_starry', 0);
        
        const mockInteraction2 = createMockInteraction(testUserId, 'Hello Bocchi!');
        await sayCommand.execute(mockInteraction2);
        
        // Test 3: Test helper functions
        console.log('Test 3: Test helper functions');
        
        // Test buildLLMPrompt
        const testPlayer = {
            action_points: 5,
            origin_story: 'pekerja_starry',
            current_weather: 'Cerah',
            bocchi_trust: 10,
            bocchi_comfort: 5,
            nijika_trust: 15,
            nijika_comfort: 8
        };
        
        const prompt = sayCommand.buildLLMPrompt(testPlayer, 'Hello everyone!');
        console.log('✅ Prompt berhasil dibuat');
        console.log(`   Panjang prompt: ${prompt.length} karakter`);
        console.log(`   Mengandung instruksi sistem: ${prompt.includes('Game Master') ? 'Ya' : 'Tidak'}`);
        console.log(`   Mengandung status pemain: ${prompt.includes('Status Saat Ini') ? 'Ya' : 'Tidak'}`);
        console.log(`   Mengandung input pemain: ${prompt.includes('Hello everyone!') ? 'Ya' : 'Tidak'}\n`);
        
        // Test isValidDatabaseField
        console.log('✅ Test validasi field database:');
        const validFields = ['action_points', 'bocchi_trust', 'current_weather'];
        const invalidFields = ['invalid_field', 'random_stat'];
        
        validFields.forEach(field => {
            const isValid = sayCommand.isValidDatabaseField(field);
            console.log(`   ${field}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        });
        
        invalidFields.forEach(field => {
            const isValid = sayCommand.isValidDatabaseField(field);
            console.log(`   ${field}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        });
        console.log('');
        
        // Test formatStatChanges
        console.log('✅ Test format perubahan stats:');
        const testUpdates = {
            action_points: -1,
            bocchi_trust: 2,
            nijika_comfort: -1,
            current_weather: 'Berawan'
        };
        
        const formattedChanges = sayCommand.formatStatChanges(testUpdates);
        console.log(`   Formatted changes: ${formattedChanges}\n`);
        
        // Test 4: Test updatePlayerStats (tanpa LLM call)
        console.log('Test 4: Test update player stats');
        
        // Update player dengan AP yang cukup
        await updatePlayer(testUserId, { action_points: 5 });
        
        const testStatUpdates = {
            action_points: -1,
            bocchi_trust: 2,
            nijika_comfort: 1
        };
        
        await sayCommand.updatePlayerStats(testUserId, testStatUpdates);
        
        // Verifikasi update
        const updatedPlayer = await getPlayer(testUserId);
        console.log('✅ Player stats berhasil diupdate:');
        console.log(`   Action Points: ${updatedPlayer.action_points}`);
        console.log(`   Bocchi Trust: ${updatedPlayer.bocchi_trust}`);
        console.log(`   Nijika Comfort: ${updatedPlayer.nijika_comfort}\n`);
        
        console.log('🎉 Semua test command say berhasil!');
        console.log('💡 Untuk test lengkap dengan LLM, pastikan GEMINI_API_KEY sudah diset di .env');
        
    } catch (error) {
        console.error('❌ Error dalam test command say:', error);
    } finally {
        // Tutup koneksi database
        await closeDatabase();
        console.log('🔒 Koneksi database ditutup');
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testSayCommand();
}

module.exports = { testSayCommand };
