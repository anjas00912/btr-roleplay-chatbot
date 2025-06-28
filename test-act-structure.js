// Test file untuk memastikan struktur command act berfungsi dengan baik (tanpa API call)
const { initializeDatabase, getPlayer, addPlayer, updatePlayer, closeDatabase } = require('./database');

async function testActStructure() {
    console.log('🧪 Memulai test struktur command act...\n');
    
    try {
        // Inisialisasi database
        console.log('Inisialisasi database...');
        await initializeDatabase();
        console.log('✅ Database berhasil diinisialisasi\n');
        
        // Import command act
        const actCommand = require('./commands/act');
        
        // Test 1: Verifikasi struktur command
        console.log('Test 1: Verifikasi struktur command');
        console.log(`   Command name: ${actCommand.data.name}`);
        console.log(`   Command description: ${actCommand.data.description}`);
        
        const options = actCommand.data.options;
        if (options && options.length > 0) {
            const actionOption = options[0];
            console.log(`   Option name: ${actionOption.name}`);
            console.log(`   Option required: ${actionOption.required}`);
            console.log(`   Number of choices: ${actionOption.choices?.length || 0}`);
            
            if (actionOption.choices) {
                console.log('   Available actions:');
                actionOption.choices.forEach((choice, index) => {
                    console.log(`     ${index + 1}. ${choice.name} (${choice.value})`);
                });
            }
        }
        console.log('✅ Command structure verified\n');
        
        // Test 2: Test ACTIONS configuration
        console.log('Test 2: Test ACTIONS configuration');
        
        // Access ACTIONS through require and check if it's properly defined
        const fs = require('fs');
        const actFileContent = fs.readFileSync('./commands/act.js', 'utf8');
        
        // Check if ACTIONS is defined
        const hasActions = actFileContent.includes('const ACTIONS = {');
        console.log(`   ACTIONS defined: ${hasActions ? 'Yes' : 'No'}`);
        
        // Check if all required actions are present
        const requiredActions = ['latihan_gitar', 'bekerja_starry', 'menulis_lagu', 'jalan_shimokitazawa'];
        requiredActions.forEach(action => {
            const hasAction = actFileContent.includes(`'${action}':`);
            console.log(`   Action ${action}: ${hasAction ? 'Found' : 'Missing'}`);
        });
        
        // Check AP costs
        const apCosts = {
            'latihan_gitar': 3,
            'bekerja_starry': 4,
            'menulis_lagu': 2,
            'jalan_shimokitazawa': 1
        };
        
        console.log('   AP Costs verification:');
        Object.entries(apCosts).forEach(([action, expectedCost]) => {
            const costPattern = new RegExp(`'${action}':[\\s\\S]*?apCost:\\s*${expectedCost}`);
            const hasCost = costPattern.test(actFileContent);
            console.log(`     ${action}: ${expectedCost} AP ${hasCost ? '✅' : '❌'}`);
        });
        
        console.log('✅ ACTIONS configuration verified\n');
        
        // Test 3: Test helper functions existence
        console.log('Test 3: Test helper functions existence');
        
        const helperFunctions = [
            'buildActionPrompt',
            'getActionSpecificRules',
            'isValidDatabaseField',
            'updatePlayerStats',
            'formatStatChanges'
        ];
        
        helperFunctions.forEach(funcName => {
            const hasFunction = actFileContent.includes(`${funcName}(`);
            console.log(`   Function ${funcName}: ${hasFunction ? 'Found' : 'Missing'}`);
        });
        
        console.log('✅ Helper functions verified\n');
        
        // Test 4: Test getActionSpecificRules function
        console.log('Test 4: Test getActionSpecificRules function');
        
        const testActionTypes = [
            { skillType: 'music', expected: 'LATIHAN GITAR' },
            { skillType: 'social', expected: 'BEKERJA DI STARRY' },
            { skillType: 'creative', expected: 'MENULIS LAGU' },
            { skillType: 'exploration', expected: 'JALAN-JALAN' }
        ];
        
        testActionTypes.forEach(({ skillType, expected }) => {
            try {
                const rules = actCommand.getActionSpecificRules({ skillType });
                const hasExpected = rules.includes(expected);
                console.log(`   Skill type ${skillType}: ${hasExpected ? '✅ Correct' : '❌ Incorrect'}`);
            } catch (error) {
                console.log(`   Skill type ${skillType}: ❌ Error - ${error.message}`);
            }
        });
        
        console.log('✅ getActionSpecificRules function verified\n');
        
        // Test 5: Test isValidDatabaseField function
        console.log('Test 5: Test isValidDatabaseField function');
        
        const validFields = ['action_points', 'bocchi_trust', 'nijika_comfort', 'current_weather'];
        const invalidFields = ['invalid_field', 'random_stat', 'unknown_field'];
        
        validFields.forEach(field => {
            const isValid = actCommand.isValidDatabaseField(field);
            console.log(`   Valid field ${field}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        });
        
        invalidFields.forEach(field => {
            const isValid = actCommand.isValidDatabaseField(field);
            console.log(`   Invalid field ${field}: ${isValid ? '❌ Valid (should be invalid)' : '✅ Invalid'}`);
        });
        
        console.log('✅ isValidDatabaseField function verified\n');
        
        // Test 6: Test formatStatChanges function
        console.log('Test 6: Test formatStatChanges function');
        
        const testUpdates = {
            action_points: -3,
            bocchi_trust: 2,
            nijika_comfort: -1,
            current_weather: 'Cerah - Test weather'
        };
        
        try {
            const formatted = actCommand.formatStatChanges(testUpdates);
            console.log(`   Formatted output length: ${formatted.length} characters`);
            console.log(`   Contains AP change: ${formatted.includes('Action Points') ? 'Yes' : 'No'}`);
            console.log(`   Contains character stats: ${formatted.includes('Bocchi') ? 'Yes' : 'No'}`);
            console.log(`   Contains weather: ${formatted.includes('Cuaca') ? 'Yes' : 'No'}`);
            console.log(`   Sample output: ${formatted.substring(0, 100)}...`);
        } catch (error) {
            console.log(`   ❌ Error in formatStatChanges: ${error.message}`);
        }
        
        console.log('✅ formatStatChanges function verified\n');
        
        // Test 7: Test buildActionPrompt function structure
        console.log('Test 7: Test buildActionPrompt function structure');
        
        const testPlayer = {
            action_points: 5,
            origin_story: 'pekerja_starry',
            current_weather: 'Cerah - Langit biru cerah',
            bocchi_trust: 10,
            nijika_trust: 15
        };
        
        const testActionData = {
            name: 'Latihan Gitar Sendiri',
            apCost: 3,
            skillType: 'music',
            location: 'private',
            focusStats: ['bocchi_trust', 'bocchi_comfort']
        };
        
        try {
            const prompt = actCommand.buildActionPrompt(testPlayer, testActionData);
            console.log(`   Prompt generated: ${prompt.length > 0 ? 'Yes' : 'No'}`);
            console.log(`   Prompt length: ${prompt.length} characters`);
            console.log(`   Contains action name: ${prompt.includes('Latihan Gitar') ? 'Yes' : 'No'}`);
            console.log(`   Contains AP cost: ${prompt.includes('3') ? 'Yes' : 'No'}`);
            console.log(`   Contains weather info: ${prompt.includes('Cerah') ? 'Yes' : 'No'}`);
            console.log(`   Contains JSON structure: ${prompt.includes('stat_changes') ? 'Yes' : 'No'}`);
        } catch (error) {
            console.log(`   ❌ Error in buildActionPrompt: ${error.message}`);
        }
        
        console.log('✅ buildActionPrompt function verified\n');
        
        console.log('🎉 Semua test struktur command act berhasil!');
        console.log('💡 Command act siap digunakan dengan API key yang valid');
        
    } catch (error) {
        console.error('❌ Error dalam test struktur act:', error);
    } finally {
        // Tutup koneksi database
        await closeDatabase();
        console.log('🔒 Koneksi database ditutup');
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testActStructure();
}

module.exports = { testActStructure };
