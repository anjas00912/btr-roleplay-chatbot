// Test file untuk memastikan database berfungsi dengan baik
const { initializeDatabase, getPlayer, addPlayer, updatePlayer, closeDatabase } = require('../database');

async function testDatabase() {
    console.log('🧪 Memulai test database...\n');

    try {
        // Inisialisasi database terlebih dahulu
        console.log('Inisialisasi database...');
        await initializeDatabase();
        console.log('✅ Database berhasil diinisialisasi\n');
        // Test 1: Menambah pemain baru
        console.log('Test 1: Menambah pemain baru');
        const testDiscordId = '123456789012345678';
        const testOriginStory = 'Seorang musisi pemula yang ingin belajar dari Kessoku Band';
        
        await addPlayer(testDiscordId, testOriginStory, 3);
        console.log('✅ Pemain berhasil ditambahkan\n');
        
        // Test 2: Mengambil data pemain
        console.log('Test 2: Mengambil data pemain');
        const player = await getPlayer(testDiscordId);
        
        if (player) {
            console.log('✅ Data pemain berhasil diambil:');
            console.log(`   Discord ID: ${player.discord_id}`);
            console.log(`   Origin Story: ${player.origin_story}`);
            console.log(`   Last Played: ${player.last_played_date}`);
            console.log(`   Action Points: ${player.action_points}`);
            console.log(`   Bocchi Trust: ${player.bocchi_trust}`);
            console.log(`   Nijika Trust: ${player.nijika_trust}`);
            console.log(`   Ryo Trust: ${player.ryo_trust}`);
            console.log(`   Kita Trust: ${player.kita_trust}\n`);
        } else {
            console.log('❌ Data pemain tidak ditemukan\n');
        }
        
        // Test 3: Update data pemain
        console.log('Test 3: Update data pemain');
        const updates = {
            bocchi_trust: 10,
            bocchi_comfort: 5,
            bocchi_affection: 3,
            action_points: 2,
            current_weather: 'Cerah'
        };
        
        const changesCount = await updatePlayer(testDiscordId, updates);
        console.log(`✅ ${changesCount} baris berhasil diupdate\n`);
        
        // Test 4: Verifikasi update
        console.log('Test 4: Verifikasi update');
        const updatedPlayer = await getPlayer(testDiscordId);
        
        if (updatedPlayer) {
            console.log('✅ Data pemain setelah update:');
            console.log(`   Action Points: ${updatedPlayer.action_points}`);
            console.log(`   Current Weather: ${updatedPlayer.current_weather}`);
            console.log(`   Bocchi Trust: ${updatedPlayer.bocchi_trust}`);
            console.log(`   Bocchi Comfort: ${updatedPlayer.bocchi_comfort}`);
            console.log(`   Bocchi Affection: ${updatedPlayer.bocchi_affection}\n`);
        }
        
        // Test 5: Test pemain yang tidak ada
        console.log('Test 5: Test pemain yang tidak ada');
        const nonExistentPlayer = await getPlayer('999999999999999999');
        
        if (!nonExistentPlayer) {
            console.log('✅ Pemain yang tidak ada mengembalikan null\n');
        } else {
            console.log('❌ Seharusnya mengembalikan null untuk pemain yang tidak ada\n');
        }
        
        console.log('🎉 Semua test database berhasil!');
        
    } catch (error) {
        console.error('❌ Error dalam test database:', error);
    } finally {
        // Tutup koneksi database
        await closeDatabase();
        console.log('🔒 Koneksi database ditutup');
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testDatabase();
}

module.exports = { testDatabase };
