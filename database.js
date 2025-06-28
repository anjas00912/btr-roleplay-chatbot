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

// Export koneksi database dan fungsi-fungsi utility
module.exports = {
    db,
    initializeDatabase,
    getPlayer,
    addPlayer,
    updatePlayer,
    closeDatabase
};
