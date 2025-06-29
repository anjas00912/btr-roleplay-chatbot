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
                console.log('Tabel players berhasil dibuat atau sudah ada');
                resolve();
            }
        });
    });
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
function addPlayer(discordId, originStory = null, actionPoints = 3) {
    return new Promise((resolve, reject) => {
        const currentDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        const query = `
            INSERT INTO players (
                discord_id, 
                origin_story, 
                last_played_date, 
                action_points,
                current_weather
            ) VALUES (?, ?, ?, ?, ?)
        `;
        
        db.run(query, [discordId, originStory, currentDate, actionPoints, null], function(err) {
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
    getKnownCharacters
};
