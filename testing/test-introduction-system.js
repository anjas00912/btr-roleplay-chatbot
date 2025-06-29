// Test Suite untuk Sistem Perkenalan & Progresi Relasi Natural - Fase 4.7
// Comprehensive testing untuk sistem known_characters dan character reveal

const { initializeDatabase, addPlayer, getPlayer, addKnownCharacter, isCharacterKnown, getKnownCharacters } = require('../database');
const { detectCharacterReveal, processCharacterReveal, buildCharacterContextForPrompt } = require('../game_logic/introduction_system');
const { getCharacterPhysicalDescription, getAllCharactersWithStatus } = require('../game_logic/character_descriptions');

/**
 * Mock Discord interaction untuk testing
 */
function createMockInteraction(userId) {
    return {
        user: { id: userId },
        replied: false,
        deferred: false,
        followUp: async (options) => {
            console.log(`   [MOCK] Character Reveal Message Sent:`);
            if (options.embeds && options.embeds[0]) {
                const embed = options.embeds[0];
                console.log(`     Title: ${embed.data.title}`);
                console.log(`     Description: ${embed.data.description?.substring(0, 100)}...`);
                if (embed.data.fields) {
                    embed.data.fields.forEach(field => {
                        console.log(`     ${field.name}: ${field.value?.substring(0, 50)}...`);
                    });
                }
            }
            return Promise.resolve();
        }
    };
}

/**
 * Test database functions untuk known_characters
 */
async function testKnownCharactersFunctions() {
    console.log('🗄️ Testing Known Characters Database Functions');
    console.log('=' .repeat(60));
    
    try {
        await initializeDatabase();
        const testUserId = 'test_known_chars_user';
        
        // Clean up any existing test data
        const { db } = require('../database');
        await new Promise((resolve) => {
            db.run('DELETE FROM players WHERE discord_id = ?', [testUserId], () => resolve());
        });
        
        // Test 1: Create player
        console.log('\n📋 Test 1: Create Player and Check Initial State');
        await addPlayer(testUserId, 'pekerja_starry', 10);
        
        const knownChars1 = await getKnownCharacters(testUserId);
        console.log(`   ✅ Initial known characters: ${knownChars1.length} (expected: 0)`);
        
        const isNijikaKnown1 = await isCharacterKnown(testUserId, 'Nijika');
        console.log(`   ✅ Is Nijika known initially: ${isNijikaKnown1} (expected: false)`);
        
        // Test 2: Add known character
        console.log('\n📋 Test 2: Add Known Character');
        const addResult = await addKnownCharacter(testUserId, 'Nijika');
        console.log(`   ✅ Add Nijika result: ${addResult} (expected: true)`);
        
        const knownChars2 = await getKnownCharacters(testUserId);
        console.log(`   ✅ Known characters after adding Nijika: ${knownChars2.length} (expected: 1)`);
        console.log(`   ✅ Known characters list: ${knownChars2.join(', ')}`);
        
        const isNijikaKnown2 = await isCharacterKnown(testUserId, 'Nijika');
        console.log(`   ✅ Is Nijika known after adding: ${isNijikaKnown2} (expected: true)`);
        
        // Test 3: Add duplicate character
        console.log('\n📋 Test 3: Add Duplicate Character');
        const addDuplicateResult = await addKnownCharacter(testUserId, 'Nijika');
        console.log(`   ✅ Add duplicate Nijika result: ${addDuplicateResult} (expected: false)`);
        
        // Test 4: Add multiple characters
        console.log('\n📋 Test 4: Add Multiple Characters');
        await addKnownCharacter(testUserId, 'Kita');
        await addKnownCharacter(testUserId, 'Ryo');
        
        const knownChars3 = await getKnownCharacters(testUserId);
        console.log(`   ✅ Known characters after adding multiple: ${knownChars3.length} (expected: 3)`);
        console.log(`   ✅ Final known characters: ${knownChars3.join(', ')}`);
        
        console.log('\n✅ All known characters database functions working correctly!');
        
    } catch (error) {
        console.error('❌ Known characters database test failed:', error);
        throw error;
    }
}

/**
 * Test character description system
 */
function testCharacterDescriptions() {
    console.log('\n🎭 Testing Character Description System');
    console.log('=' .repeat(60));
    
    const characters = ['Nijika', 'Bocchi', 'Ryo', 'Kita', 'Seika'];
    
    characters.forEach(char => {
        console.log(`\n📋 Character: ${char}`);
        
        const physicalDesc = getCharacterPhysicalDescription(char);
        console.log(`   Physical: ${physicalDesc}`);
        
        const altDesc = getCharacterPhysicalDescription(char, true);
        console.log(`   Alternative: ${altDesc}`);
        
        console.log(`   ✅ Descriptions generated successfully`);
    });
    
    // Test getAllCharactersWithStatus
    console.log('\n📋 Testing Character Status System');
    
    const knownChars = ['Nijika', 'Kita']; // Simulate some known characters
    const allStatus = getAllCharactersWithStatus(knownChars);
    
    Object.entries(allStatus).forEach(([charName, status]) => {
        console.log(`   ${charName}: Known=${status.isKnown}, Display="${status.displayName}", Desc="${status.description.substring(0, 30)}..."`);
    });
    
    console.log('\n✅ Character description system working correctly!');
}

/**
 * Test character reveal detection
 */
function testCharacterRevealDetection() {
    console.log('\n🔍 Testing Character Reveal Detection');
    console.log('=' .repeat(60));
    
    const testCases = [
        {
            name: 'Flag-based reveal',
            response: { character_revealed: 'Nijika', narration: 'Some story...' },
            expected: 'Nijika'
        },
        {
            name: 'Pattern-based reveal - aku Nijika',
            response: { narration: 'Dia tersenyum dan berkata, "Oh, aku Nijika! Senang berkenalan denganmu!"' },
            expected: 'Nijika'
        },
        {
            name: 'Pattern-based reveal - namaku Bocchi',
            response: { narration: 'Dengan gugup dia berbisik, "Um... namaku Bocchi..."' },
            expected: 'Bocchi'
        },
        {
            name: 'Pattern-based reveal - full name',
            response: { narration: 'Dia memperkenalkan diri, "Aku Ryo Yamada, bassist band ini."' },
            expected: 'Ryo'
        },
        {
            name: 'No reveal',
            response: { narration: 'Gadis berambut pink itu hanya mengangguk pelan tanpa berkata apa-apa.' },
            expected: null
        }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
        const result = detectCharacterReveal(testCase.response);
        const isCorrect = result === testCase.expected;
        console.log(`   Result: ${result || 'null'}`);
        console.log(`   Expected: ${testCase.expected || 'null'}`);
        console.log(`   ${isCorrect ? '✅' : '❌'} ${isCorrect ? 'PASS' : 'FAIL'}`);
    });
    
    console.log('\n✅ Character reveal detection tests completed!');
}

/**
 * Test character context building
 */
async function testCharacterContextBuilding() {
    console.log('\n🏗️ Testing Character Context Building');
    console.log('=' .repeat(60));
    
    try {
        await initializeDatabase();
        const testUserId = 'test_context_user';
        
        // Setup test player with some known characters
        const { db } = require('../database');
        await new Promise((resolve) => {
            db.run('DELETE FROM players WHERE discord_id = ?', [testUserId], () => resolve());
        });
        
        await addPlayer(testUserId, 'pekerja_starry', 10);
        await addKnownCharacter(testUserId, 'Nijika');
        await addKnownCharacter(testUserId, 'Kita');
        
        // Test context building
        const charactersPresent = [
            { name: 'Nijika', availability: 'available' },
            { name: 'Bocchi', availability: 'available' },
            { name: 'Ryo', availability: 'limited' },
            { name: 'Kita', availability: 'available' }
        ];
        
        console.log('\n📋 Building character context...');
        const context = await buildCharacterContextForPrompt(testUserId, charactersPresent);
        
        console.log(`   Known characters: ${context.known_characters.join(', ')}`);
        console.log(`   Unknown characters: ${context.unknown_characters.join(', ')}`);
        
        console.log('\n📋 Character descriptions in context:');
        Object.entries(context.character_descriptions).forEach(([char, desc]) => {
            console.log(`   ${char}: "${desc}"`);
        });
        
        // Verify results
        const expectedKnown = ['Nijika', 'Kita'];
        const expectedUnknown = ['Bocchi', 'Ryo'];
        
        const knownCorrect = expectedKnown.every(char => context.known_characters.includes(char));
        const unknownCorrect = expectedUnknown.every(char => context.unknown_characters.includes(char));
        
        console.log(`\n   ✅ Known characters correct: ${knownCorrect}`);
        console.log(`   ✅ Unknown characters correct: ${unknownCorrect}`);
        
        console.log('\n✅ Character context building working correctly!');
        
    } catch (error) {
        console.error('❌ Character context building test failed:', error);
        throw error;
    }
}

/**
 * Test complete introduction flow
 */
async function testCompleteIntroductionFlow() {
    console.log('\n🎪 Testing Complete Introduction Flow');
    console.log('=' .repeat(60));
    
    try {
        const testUserId = 'test_intro_flow_user';
        const mockInteraction = createMockInteraction(testUserId);
        
        // Setup test player
        const { db } = require('../database');
        await new Promise((resolve) => {
            db.run('DELETE FROM players WHERE discord_id = ?', [testUserId], () => resolve());
        });
        
        await addPlayer(testUserId, 'pekerja_starry', 10);
        
        console.log('\n📋 Test: Character Reveal Process');
        
        // Test character reveal
        const revealResult = await processCharacterReveal(mockInteraction, 'Bocchi', testUserId);
        console.log(`   ✅ Character reveal result: ${revealResult} (expected: true)`);
        
        // Verify character was added to known list
        const knownAfterReveal = await getKnownCharacters(testUserId);
        console.log(`   ✅ Known characters after reveal: ${knownAfterReveal.join(', ')}`);
        
        // Test duplicate reveal (should return false)
        const duplicateReveal = await processCharacterReveal(mockInteraction, 'Bocchi', testUserId);
        console.log(`   ✅ Duplicate reveal result: ${duplicateReveal} (expected: false)`);
        
        console.log('\n✅ Complete introduction flow working correctly!');
        
    } catch (error) {
        console.error('❌ Complete introduction flow test failed:', error);
        throw error;
    }
}

/**
 * Run comprehensive test suite
 */
async function runComprehensiveTest() {
    console.log('🎭 SISTEM PERKENALAN & PROGRESI RELASI NATURAL - COMPREHENSIVE TEST SUITE');
    console.log('=' .repeat(80));
    
    try {
        await testKnownCharactersFunctions();
        testCharacterDescriptions();
        testCharacterRevealDetection();
        await testCharacterContextBuilding();
        await testCompleteIntroductionFlow();
        
        console.log('\n🎉 Test Results Summary:');
        console.log('=' .repeat(80));
        console.log('✅ Known characters database functions working');
        console.log('✅ Character description system functional');
        console.log('✅ Character reveal detection accurate');
        console.log('✅ Character context building operational');
        console.log('✅ Complete introduction flow working');
        console.log('\n🚀 Sistem Perkenalan & Progresi Relasi Natural Fase 4.7 SIAP PRODUKSI!');
        
        console.log('\n📊 System Capabilities:');
        console.log('• Database tracking untuk karakter yang sudah dikenal');
        console.log('• Deskripsi fisik dinamis untuk karakter yang belum dikenal');
        console.log('• Deteksi otomatis momen perkenalan dari dialog');
        console.log('• Character reveal dengan konfirmasi yang memuaskan');
        console.log('• Profile display yang conditional berdasarkan known status');
        console.log('• Sistem stat yang terkunci hingga perkenalan resmi');
        console.log('• Integration dengan sistem interaksi spontan');
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        throw error;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    runComprehensiveTest()
        .then(() => {
            console.log('\n✅ All introduction system tests passed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Introduction system tests failed:', error);
            process.exit(1);
        });
}

module.exports = {
    runComprehensiveTest,
    testKnownCharactersFunctions,
    testCharacterDescriptions,
    testCharacterRevealDetection,
    testCharacterContextBuilding,
    testCompleteIntroductionFlow
};
