const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path ke file database
const dbPath = path.join(__dirname, 'bocchi_game.db');

// Membuat koneksi ke database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error membuka database:', err.message);
    } else {
        console.log('Terhubung ke database SQLite bocchi_game.db');
    }
});

// Fungsi untuk inisialisasi database dan membuat tabel
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const createPlayersTable = `
            CREATE TABLE IF NOT EXISTS players (
                discord_id TEXT PRIMARY KEY,
                origin_story TEXT,
                last_played_date TEXT,
                action_points INTEGER,
                current_weather TEXT,
                known_characters TEXT DEFAULT '[]',
                bocchi_trust INTEGER DEFAULT 0,
                bocchi_comfort INTEGER DEFAULT 0,
                bocchi_affection INTEGER DEFAULT 0,
                nijika_trust INTEGER DEFAULT 0,
                nijika_comfort INTEGER DEFAULT 0,
                nijika_affection INTEGER DEFAULT 0,
                ryo_trust INTEGER DEFAULT 0,
                ryo_comfort INTEGER DEFAULT 0,
                ryo_affection INTEGER DEFAULT 0,
                kita_trust INTEGER DEFAULT 0,
                kita_comfort INTEGER DEFAULT 0,
                kita_affection INTEGER DEFAULT 0
            )
        `;

        db.run(createPlayersTable, (err) => {
            if (err) {
                console.error('Error membuat tabel players:', err.message);
                reject(err);
            } else {
                console.log('Terhubung ke database SQLite bocchi_game.db');
                console.log('Tabel players berhasil dibuat atau sudah ada');

                // FASE 3.1: Migrasi action_points ke energy untuk data yang sudah ada
                migrateActionPointsToEnergy().then(() => {
                    resolve();
                }).catch(reject);
            }
        });
    });
}

// FASE 3.1: Fungsi migrasi dari action_points ke energy
function migrateActionPointsToEnergy() {
    return new Promise((resolve, reject) => {
        // Cek apakah kolom action_points masih ada
        db.all("PRAGMA table_info(players)", (err, columns) => {
            if (err) {
                console.error('Error checking table structure:', err);
                reject(err);
                return;
            }

            const hasActionPoints = columns.some(col => col.name === 'action_points');
            const hasEnergy = columns.some(col => col.name === 'energy');

            if (hasActionPoints && !hasEnergy) {
                console.log('Migrating action_points to energy...');

                // Tambah kolom energy
                db.run("ALTER TABLE players ADD COLUMN energy INTEGER DEFAULT 100", (err) => {
                    if (err) {
                        console.error('Error adding energy column:', err);
                        reject(err);
                        return;
                    }

                    // Konversi action_points ke energy (multiply by 10 untuk scale 0-100)
                    db.run("UPDATE players SET energy = CASE WHEN action_points * 10 > 100 THEN 100 ELSE action_points * 10 END", (err) => {
                        if (err) {
                            console.error('Error migrating data:', err);
                            reject(err);
                            return;
                        }

                        console.log('Migration completed: action_points -> energy');
                        resolve();
                    });
                });
            } else {
                // Tidak perlu migrasi
                resolve();
            }
        });
    });
}

// FASE 3.1: Sistem Energy Zones
function getEnergyZone(energy) {
    if (energy >= 41) {
        return {
            zone: 'optimal',
            name: 'Zona Optimal',
            description: 'Energi penuh, performa terbaik',
            color: '#2ecc71',
            emoji: '💪',
            statMultiplier: 1.2,
            failureChance: 0
        };
    } else if (energy >= 11) {
        return {
            zone: 'tired',
            name: 'Zona Lelah',
            description: 'Sedikit lelah, performa menurun',
            color: '#f39c12',
            emoji: '😴',
            statMultiplier: 0.7,
            failureChance: 0.1
        };
    } else {
        return {
            zone: 'critical',
            name: 'Zona Kritis',
            description: 'Sangat lelah, risiko tinggi',
            color: '#e74c3c',
            emoji: '🥵',
            statMultiplier: 0.3,
            failureChance: 0.4
        };
    }
}

// FASE 3.1: Fungsi untuk mengurangi energy dengan konsekuensi
function consumeEnergy(currentEnergy, cost) {
    const newEnergy = Math.max(0, currentEnergy - cost);
    const energyZone = getEnergyZone(newEnergy);

    return {
        newEnergy,
        energyZone,
        canAct: true, // Selalu bisa beraksi, tapi dengan konsekuensi
        warning: newEnergy <= 10 ? 'Energi sangat rendah! Aksi berisiko gagal.' : null
    };
}

// Fungsi untuk mendapatkan data pemain berdasarkan discord_id
function getPlayer(discordId) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM players WHERE discord_id = ?';
        db.get(query, [discordId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Fungsi untuk menambah pemain baru
function addPlayer(discordId, originStory = null, energy = 100) {
    return new Promise((resolve, reject) => {
        const currentDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        const query = `
            INSERT INTO players (
                discord_id,
                origin_story,
                last_played_date,
                energy,
                current_weather
            ) VALUES (?, ?, ?, ?, ?)
        `;

        db.run(query, [discordId, originStory, currentDate, energy, null], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

// Fungsi untuk update data pemain
function updatePlayer(discordId, updates) {
    return new Promise((resolve, reject) => {
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        
        const query = `UPDATE players SET ${setClause} WHERE discord_id = ?`;
        values.push(discordId);
        
        db.run(query, values, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

// Fungsi untuk menutup koneksi database
function closeDatabase() {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                reject(err);
            } else {
                console.log('Koneksi database ditutup');
                resolve();
            }
        });
    });
}

/**
 * Tambahkan karakter ke daftar known_characters pemain
 * @param {string} discordId - Discord ID pemain
 * @param {string} characterName - Nama karakter yang baru dikenal
 * @returns {Promise<boolean>} - Berhasil atau tidak
 */
function addKnownCharacter(discordId, characterName) {
    return new Promise((resolve, reject) => {
        // Ambil daftar karakter yang sudah dikenal
        db.get('SELECT known_characters FROM players WHERE discord_id = ?', [discordId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                reject(new Error('Player not found'));
                return;
            }

            let knownCharacters = [];
            try {
                knownCharacters = JSON.parse(row.known_characters || '[]');
            } catch (parseError) {
                console.error('Error parsing known_characters:', parseError);
                knownCharacters = [];
            }

            // Cek apakah karakter sudah dikenal
            if (knownCharacters.includes(characterName)) {
                resolve(false); // Sudah dikenal sebelumnya
                return;
            }

            // Tambahkan karakter baru
            knownCharacters.push(characterName);

            // Update database
            db.run(
                'UPDATE players SET known_characters = ? WHERE discord_id = ?',
                [JSON.stringify(knownCharacters), discordId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`[KNOWN_CHARS] Added ${characterName} to known characters for ${discordId}`);
                        resolve(true);
                    }
                }
            );
        });
    });
}

/**
 * Cek apakah pemain sudah mengenal karakter tertentu
 * @param {string} discordId - Discord ID pemain
 * @param {string} characterName - Nama karakter
 * @returns {Promise<boolean>} - Apakah sudah dikenal
 */
function isCharacterKnown(discordId, characterName) {
    return new Promise((resolve, reject) => {
        db.get('SELECT known_characters FROM players WHERE discord_id = ?', [discordId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                resolve(false);
                return;
            }

            let knownCharacters = [];
            try {
                knownCharacters = JSON.parse(row.known_characters || '[]');
            } catch (parseError) {
                console.error('Error parsing known_characters:', parseError);
                knownCharacters = [];
            }

            resolve(knownCharacters.includes(characterName));
        });
    });
}

/**
 * Dapatkan daftar karakter yang sudah dikenal pemain
 * @param {string} discordId - Discord ID pemain
 * @returns {Promise<Array>} - Array nama karakter yang sudah dikenal
 */
function getKnownCharacters(discordId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT known_characters FROM players WHERE discord_id = ?', [discordId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                resolve([]);
                return;
            }

            let knownCharacters = [];
            try {
                knownCharacters = JSON.parse(row.known_characters || '[]');
            } catch (parseError) {
                console.error('Error parsing known_characters:', parseError);
                knownCharacters = [];
            }

            resolve(knownCharacters);
        });
    });
}

// Export koneksi database dan fungsi-fungsi utility
module.exports = {
    db,
    initializeDatabase,
    getPlayer,
    addPlayer,
    updatePlayer,
    closeDatabase,
    addKnownCharacter,
    isCharacterKnown,
    getKnownCharacters,
    // FASE 3.1: Energy system functions
    getEnergyZone,
    consumeEnergy
};
