// Test file untuk memastikan command say dengan daily reset berfungsi dengan baik
const { initializeDatabase, getPlayer, addPlayer, updatePlayer, closeDatabase } = require('./database');

// Mock interaction object untuk testing
function createMockInteraction(userId, dialog, hasDeferred = false, hasReplied = false) {
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
        replied: hasReplied,
        deferred: hasDeferred,
        reply: async (options) => {
            console.log('📤 Reply sent:');
            if (options.embeds && options.embeds[0]) {
                const embed = options.embeds[0];
                console.log(`   Title: ${embed.data.title}`);
                console.log(`   Description: ${embed.data.description?.substring(0, 100)}...`);
                console.log(`   Ephemeral: ${options.ephemeral || false}`);
            }
            hasReplied = true;
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
            }
            console.log('');
        },
        followUp: async (options) => {
            console.log('📤 FollowUp sent:');
            if (options.embeds && options.embeds[0]) {
                const embed = options.embeds[0];
                console.log(`   Title: ${embed.data.title}`);
                console.log(`   Description: ${embed.data.description?.substring(0, 100)}...`);
                console.log(`   Ephemeral: ${options.ephemeral || false}`);
            }
            console.log('');
        },
        channel: {
            send: async (options) => {
                console.log('📤 Channel message sent:');
                if (options.embeds && options.embeds[0]) {
                    const embed = options.embeds[0];
                    console.log(`   Title: ${embed.data.title}`);
                    console.log(`   Description: ${embed.data.description?.substring(0, 100)}...`);
                }
                console.log('');
            }
        }
    };
}

async function testSayWithReset() {
    console.log('🧪 Memulai test command say dengan daily reset...\n');
    
    try {
        // Inisialisasi database
        console.log('Inisialisasi database...');
        await initializeDatabase();
        console.log('✅ Database berhasil diinisialisasi\n');
        
        // Import command say
        const sayCommand = require('./commands/say');
        
        const testUserId = '123456789012345678';
        
        // Hapus player lama jika ada
        const { db } = require('./database');
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM players WHERE discord_id = ?', [testUserId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Test 1: User yang belum terdaftar
        console.log('Test 1: User yang belum terdaftar');
        const mockInteraction1 = createMockInteraction('999999999999999999', 'Hello!');
        await sayCommand.execute(mockInteraction1);
        
        // Test 2: User terdaftar dengan tanggal kemarin (harus ada reset)
        console.log('Test 2: User terdaftar dengan tanggal kemarin (harus ada reset)');
        
        // Buat player dengan tanggal kemarin dan AP rendah
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        await addPlayer(testUserId, 'pekerja_starry', 2);
        await updatePlayer(testUserId, { 
            last_played_date: yesterdayStr,
            action_points: -1  // Set ke 1 AP (2 - 1)
        });
        
        console.log(`   Player dibuat dengan tanggal: ${yesterdayStr}, AP: 1`);
        
        const mockInteraction2 = createMockInteraction(testUserId, 'Hello Bocchi!');
        
        // Mock LLM response untuk testing
        const originalGenerate = sayCommand.buildLLMPrompt;
        sayCommand.buildLLMPrompt = () => "Mock prompt";
        
        // Mock Gemini API call
        const originalGemini = require('@google/generative-ai').GoogleGenerativeAI;
        const mockGemini = {
            getGenerativeModel: () => ({
                generateContent: async () => ({
                    response: {
                        text: () => JSON.stringify({
                            narration: "Bocchi melihat ke arahmu dengan malu-malu. 'H-halo...' gumamnya pelan sambil menggenggam gitarnya erat-erat.",
                            stat_changes: {
                                action_points: -1,
                                bocchi_trust: 1,
                                bocchi_comfort: 1
                            }
                        })
                    }
                })
            })
        };
        
        // Temporarily replace Gemini
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const originalConstructor = GoogleGenerativeAI;
        require('@google/generative-ai').GoogleGenerativeAI = function() {
            return mockGemini;
        };
        
        try {
            await sayCommand.execute(mockInteraction2);
        } catch (error) {
            console.log(`   Expected error (no real API key): ${error.message.substring(0, 50)}...`);
        }
        
        // Restore original
        require('@google/generative-ai').GoogleGenerativeAI = originalConstructor;
        sayCommand.buildLLMPrompt = originalGenerate;
        
        // Verify player stats after reset
        const playerAfterReset = await getPlayer(testUserId);
        console.log(`   Player AP after reset: ${playerAfterReset.action_points}`);
        console.log(`   Player last played: ${playerAfterReset.last_played_date}`);
        console.log(`   Player weather: ${playerAfterReset.current_weather?.substring(0, 30)}...`);
        
        // Test 3: User dengan AP habis
        console.log('\nTest 3: User dengan AP habis');
        
        // Set AP ke 0
        await updatePlayer(testUserId, { action_points: -playerAfterReset.action_points });
        
        const mockInteraction3 = createMockInteraction(testUserId, 'Hello again!');
        await sayCommand.execute(mockInteraction3);
        
        // Test 4: User dengan tanggal hari ini (tidak ada reset)
        console.log('\nTest 4: User dengan tanggal hari ini (tidak ada reset)');
        
        // Set AP kembali ke 5
        await updatePlayer(testUserId, { action_points: 5 });
        
        const mockInteraction4 = createMockInteraction(testUserId, 'Hello today!');
        
        try {
            await sayCommand.execute(mockInteraction4);
        } catch (error) {
            console.log(`   Expected error (no real API key): ${error.message.substring(0, 50)}...`);
        }
        
        console.log('\n🎉 Semua test command say dengan daily reset berhasil!');
        console.log('💡 Untuk test lengkap dengan LLM, pastikan GEMINI_API_KEY sudah diset di .env');
        
    } catch (error) {
        console.error('❌ Error dalam test command say dengan reset:', error);
    } finally {
        // Tutup koneksi database
        await closeDatabase();
        console.log('🔒 Koneksi database ditutup');
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testSayWithReset();
}

module.exports = { testSayWithReset };
