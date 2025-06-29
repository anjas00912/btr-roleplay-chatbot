// Database Migration Script untuk Fase 4.7
// Menambahkan kolom known_characters ke tabel players yang sudah ada

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path ke database
const dbPath = path.join(__dirname, 'bocchi_game.db');

console.log('🔄 Starting Database Migration for Fase 4.7...');
console.log(`Database path: ${dbPath}`);

// Buka koneksi database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

/**
 * Cek apakah kolom sudah ada
 */
function checkColumnExists() {
    return new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(players)", (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            const columnExists = rows.some(row => row.name === 'known_characters');
            resolve(columnExists);
        });
    });
}

/**
 * Tambahkan kolom known_characters
 */
function addKnownCharactersColumn() {
    return new Promise((resolve, reject) => {
        const sql = `ALTER TABLE players ADD COLUMN known_characters TEXT DEFAULT '[]'`;
        
        db.run(sql, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('✅ Column known_characters added successfully');
                resolve();
            }
        });
    });
}

/**
 * Update existing players dengan default value
 */
function updateExistingPlayers() {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE players SET known_characters = '[]' WHERE known_characters IS NULL`;
        
        db.run(sql, function(err) {
            if (err) {
                reject(err);
            } else {
                console.log(`✅ Updated ${this.changes} existing players with default known_characters value`);
                resolve();
            }
        });
    });
}

/**
 * Verifikasi migration
 */
function verifyMigration() {
    return new Promise((resolve, reject) => {
        // Cek struktur tabel
        db.all("PRAGMA table_info(players)", (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('\n📋 Current table structure:');
            rows.forEach(row => {
                console.log(`   ${row.name}: ${row.type} (default: ${row.dflt_value || 'NULL'})`);
            });
            
            const knownCharsColumn = rows.find(row => row.name === 'known_characters');
            if (knownCharsColumn) {
                console.log('\n✅ Migration verification successful!');
                console.log(`   known_characters column: ${knownCharsColumn.type}, default: ${knownCharsColumn.dflt_value}`);
                resolve();
            } else {
                reject(new Error('known_characters column not found after migration'));
            }
        });
    });
}

/**
 * Test basic functionality
 */
function testBasicFunctionality() {
    return new Promise((resolve, reject) => {
        // Test insert dengan known_characters
        const testId = 'migration_test_user';
        
        // Hapus test user jika ada
        db.run('DELETE FROM players WHERE discord_id = ?', [testId], (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Insert test user
            const insertSql = `
                INSERT INTO players (discord_id, origin_story, action_points, known_characters)
                VALUES (?, ?, ?, ?)
            `;
            
            db.run(insertSql, [testId, 'test_story', 10, '["Nijika"]'], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Verify insert
                db.get('SELECT known_characters FROM players WHERE discord_id = ?', [testId], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (row && row.known_characters === '["Nijika"]') {
                        console.log('✅ Basic functionality test passed');
                        
                        // Cleanup
                        db.run('DELETE FROM players WHERE discord_id = ?', [testId], (err) => {
                            if (err) {
                                console.warn('⚠️ Warning: Could not cleanup test user');
                            }
                            resolve();
                        });
                    } else {
                        reject(new Error('Basic functionality test failed'));
                    }
                });
            });
        });
    });
}

/**
 * Main migration function
 */
async function runMigration() {
    try {
        console.log('\n🔍 Checking if migration is needed...');
        
        const columnExists = await checkColumnExists();
        
        if (columnExists) {
            console.log('✅ Column known_characters already exists. Migration not needed.');
            await verifyMigration();
            await testBasicFunctionality();
        } else {
            console.log('📝 Column known_characters not found. Starting migration...');
            
            await addKnownCharactersColumn();
            await updateExistingPlayers();
            await verifyMigration();
            await testBasicFunctionality();
            
            console.log('\n🎉 Migration completed successfully!');
        }
        
        console.log('\n📊 Migration Summary:');
        console.log('• Added known_characters column to players table');
        console.log('• Set default value \'[]\' for existing players');
        console.log('• Verified migration integrity');
        console.log('• Tested basic functionality');
        console.log('\n🚀 Database is ready for Fase 4.7 features!');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('✅ Database connection closed');
            }
        });
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('\n✅ Database migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database migration failed:', error);
            process.exit(1);
        });
}

module.exports = {
    runMigration,
    checkColumnExists,
    addKnownCharactersColumn,
    updateExistingPlayers,
    verifyMigration,
    testBasicFunctionality
};
