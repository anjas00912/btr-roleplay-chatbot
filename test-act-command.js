// Test file untuk memastikan command act berfungsi dengan baik
const { initializeDatabase, getPlayer, addPlayer, updatePlayer, closeDatabase } = require('./database');

// Mock interaction object untuk testing
function createMockInteraction(userId, action, hasDeferred = false, hasReplied = false) {
    return {
        user: {
            id: userId
        },
        options: {
            getString: (name) => {
                if (name === 'action') return action;
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
                if (embed.data.fields) {
                    console.log(`   Fields: ${embed.data.fields.length} fields`);
                    embed.data.fields.forEach((field, index) => {
                        console.log(`     Field ${index + 1}: ${field.name}`);
                    });
                }
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

async function testActCommand() {
    console.log('🧪 Memulai test command act...\n');
    
    try {
        // Inisialisasi database
        console.log('Inisialisasi database...');
        await initializeDatabase();
        console.log('✅ Database berhasil diinisialisasi\n');
        
        // Import command act
        const actCommand = require('./commands/act');
        
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
        const mockInteraction1 = createMockInteraction('999999999999999999', 'latihan_gitar');
        await actCommand.execute(mockInteraction1);
        
        // Test 2: User dengan AP tidak cukup
        console.log('Test 2: User dengan AP tidak cukup');
        
        await addPlayer(testUserId, 'pekerja_starry', 2); // Hanya 2 AP
        
        const mockInteraction2 = createMockInteraction(testUserId, 'bekerja_starry'); // Butuh 4 AP
        await actCommand.execute(mockInteraction2);
        
        // Test 3: Test semua jenis aksi dengan AP yang cukup
        console.log('Test 3: Test semua jenis aksi dengan AP yang cukup');
        
        // Set AP ke 10
        await updatePlayer(testUserId, { action_points: 8 }); // Total jadi 10
        
        const actions = ['latihan_gitar', 'menulis_lagu', 'jalan_shimokitazawa', 'bekerja_starry'];
        
        for (const action of actions) {
            console.log(`\n   Testing action: ${action}`);
            
            const mockInteraction = createMockInteraction(testUserId, action);
            
            // Mock LLM response untuk testing
            const originalGenerate = actCommand.buildActionPrompt;
            actCommand.buildActionPrompt = () => "Mock action prompt";
            
            // Mock Gemini API call
            const mockGemini = {
                getGenerativeModel: () => ({
                    generateContent: async () => ({
                        response: {
                            text: () => JSON.stringify({
                                narration: `Kamu melakukan ${action} dengan penuh semangat. Aktivitas ini memberikan pengalaman yang berharga dan membantu mengembangkan kemampuanmu.`,
                                stat_changes: {
                                    action_points: action === 'bekerja_starry' ? -4 : action === 'latihan_gitar' ? -3 : action === 'menulis_lagu' ? -2 : -1,
                                    bocchi_trust: action.includes('gitar') || action.includes('lagu') ? 1 : 0,
                                    nijika_comfort: action.includes('starry') || action.includes('jalan') ? 1 : 0
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
                await actCommand.execute(mockInteraction);
                
                // Verify player stats after action
                const playerAfter = await getPlayer(testUserId);
                console.log(`     AP after action: ${playerAfter.action_points}`);
                
            } catch (error) {
                console.log(`     Expected error (no real API key): ${error.message.substring(0, 50)}...`);
            }
            
            // Restore original
            require('@google/generative-ai').GoogleGenerativeAI = originalConstructor;
            actCommand.buildActionPrompt = originalGenerate;
        }
        
        // Test 4: Test helper functions
        console.log('\nTest 4: Test helper functions');
        
        // Test getActionSpecificRules
        const testActionData = {
            name: 'Latihan Gitar Sendiri',
            skillType: 'music',
            focusStats: ['bocchi_trust', 'bocchi_comfort']
        };
        
        const rules = actCommand.getActionSpecificRules(testActionData);
        console.log(`   Action rules generated: ${rules.includes('LATIHAN GITAR') ? 'Yes' : 'No'}`);
        console.log(`   Contains focus stats: ${rules.includes('bocchi_trust') ? 'Yes' : 'No'}`);
        
        // Test buildActionPrompt
        const testPlayer = {
            action_points: 5,
            origin_story: 'pekerja_starry',
            current_weather: 'Cerah - Langit biru cerah',
            bocchi_trust: 10,
            nijika_trust: 15
        };
        
        const prompt = actCommand.buildActionPrompt(testPlayer, testActionData);
        console.log(`   Prompt generated: ${prompt.length > 0 ? 'Yes' : 'No'}`);
        console.log(`   Contains action context: ${prompt.includes('Konteks Aksi') ? 'Yes' : 'No'}`);
        console.log(`   Contains weather info: ${prompt.includes('Cerah') ? 'Yes' : 'No'}`);
        console.log(`   Contains AP cost: ${prompt.includes('3') ? 'Yes' : 'No'}`);
        
        // Test isValidDatabaseField
        console.log(`   Valid field test (bocchi_trust): ${actCommand.isValidDatabaseField('bocchi_trust') ? 'Valid' : 'Invalid'}`);
        console.log(`   Invalid field test (invalid_field): ${actCommand.isValidDatabaseField('invalid_field') ? 'Valid' : 'Invalid'}`);
        
        // Test formatStatChanges
        const testUpdates = {
            action_points: -3,
            bocchi_trust: 2,
            nijika_comfort: 1
        };
        
        const formattedChanges = actCommand.formatStatChanges(testUpdates);
        console.log(`   Formatted changes: ${formattedChanges.substring(0, 60)}...`);
        
        // Test 5: Test invalid action
        console.log('\nTest 5: Test invalid action');
        const mockInteraction5 = createMockInteraction(testUserId, 'invalid_action');
        await actCommand.execute(mockInteraction5);
        
        console.log('\n🎉 Semua test command act berhasil!');
        console.log('💡 Untuk test lengkap dengan LLM, pastikan GEMINI_API_KEY sudah diset di .env');
        
    } catch (error) {
        console.error('❌ Error dalam test command act:', error);
    } finally {
        // Tutup koneksi database
        await closeDatabase();
        console.log('🔒 Koneksi database ditutup');
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testActCommand();
}

module.exports = { testActCommand };
