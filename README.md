# Bocchi Game Discord Bot

Game simulasi berbasis teks di Discord dengan karakter dari anime "Bocchi the Rock!".

## 🚀 Fitur

- **Sistem Registrasi Pemain**: Pemain dapat mendaftar dengan origin story yang berbeda
- **Database SQLite**: Menyimpan data pemain secara persisten
- **Sistem Relationship**: Track hubungan dengan 4 karakter utama (Bocchi, Nijika, Ryo, Kita)
- **Action Points**: Sistem poin untuk membatasi aksi pemain per hari (reset otomatis setiap hari)
- **Profil Pemain**: Lihat status dan progress permainan
- **Interaksi AI**: Berinteraksi dengan karakter menggunakan Google Gemini AI
- **Sistem Cuaca Dinamis**: Cuaca berubah setiap hari dan mempengaruhi mood interaksi
- **Reset Harian Otomatis**: AP dan cuaca reset otomatis setiap hari dengan notifikasi

## 📋 Struktur Database

### Tabel `players`
- `discord_id` (TEXT, PRIMARY KEY) - ID Discord pemain
- `origin_story` (TEXT) - Cerita latar belakang pemain
- `last_played_date` (TEXT) - Tanggal terakhir bermain (YYYY-MM-DD)
- `action_points` (INTEGER) - Poin aksi yang tersisa
- `current_weather` (TEXT) - Cuaca saat ini dalam game
- `bocchi_trust`, `bocchi_comfort`, `bocchi_affection` (INTEGER) - Status hubungan dengan Bocchi
- `nijika_trust`, `nijika_comfort`, `nijika_affection` (INTEGER) - Status hubungan dengan Nijika
- `ryo_trust`, `ryo_comfort`, `ryo_affection` (INTEGER) - Status hubungan dengan Ryo
- `kita_trust`, `kita_comfort`, `kita_affection` (INTEGER) - Status hubungan dengan Kita

## 🛠️ Setup

### Prerequisites
- Node.js (v16 atau lebih baru)
- Discord Bot Token
- Google Gemini API Key

### Instalasi

1. Clone repository ini
2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env` dan isi dengan token bot Discord dan API key Gemini:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_bot_client_id_here
   GEMINI_API_KEY=your_gemini_api_key_here
   BOT_PREFIX=!
   ```

4. Jalankan bot:
   ```bash
   npm start
   ```

   Atau untuk development dengan auto-reload:
   ```bash
   npm run dev
   ```

## 🎮 Commands

### `/start_life <origin_story>`
Mulai hidup baru dalam dunia Bocchi the Rock! Pilih salah satu latar belakang:
- **Siswa Pindahan** - Mulai sebagai siswa baru dengan bonus hubungan Nijika
- **Pekerja Baru di STARRY** - Bekerja di live house dengan akses ke semua karakter
- **Musisi Jalanan** - Musisi berpengalaman dengan bonus hubungan Bocchi dan Ryo

### `/status`
Lihat status lengkap karakter Anda dengan tampilan yang diperbaharui:
- **Poin Aksi**: Format jelas dengan current/max (contoh: 7/10)
- **Cuaca dengan Emoji**: Setiap cuaca memiliki emoji yang sesuai (☀️ Cerah, 🌧️ Hujan, ⛈️ Badai, dll)
- **Mood Cuaca**: Informasi mood cuaca yang mempengaruhi gameplay
- **Origin Story**: Latar belakang karakter dengan emoji
- **Status Hubungan Detail**: Trust, Comfort, Affection untuk setiap karakter
- **Level Hubungan**: Dari 🌱 Pemula hingga 👑 Kessoku Band Family

### `/say <dialog>`
**FITUR UTAMA GAME** - Berinteraksi dengan karakter menggunakan AI!
- Menggunakan 1 Action Point per interaksi
- AI akan merespons sesuai kepribadian karakter
- Hubungan dengan karakter dapat berubah berdasarkan interaksi
- Cuaca dan konteks mempengaruhi respons
- **Reset Harian Otomatis**: Jika hari baru, AP akan reset ke 10 dan cuaca berubah
- Notifikasi otomatis saat hari baru dimulai

**Contoh:**
- `/say dialog:"Halo Bocchi-chan! Bagaimana latihan hari ini?"`
- `/say dialog:"Nijika, boleh aku ikut latihan band?"`

### `/act <action>`
**AKSI TERSTRUKTUR** - Lakukan aktivitas solo dengan biaya AP berbeda!
- **Latihan Gitar Sendiri** (3 AP): Berlatih musik, fokus pada Bocchi relationship
- **Bekerja di STARRY** (4 AP): Part-time di live house, interaksi dengan semua karakter
- **Menulis Lagu** (2 AP): Aktivitas kreatif, fokus pada Bocchi dan Kita
- **Jalan-jalan di Shimokitazawa** (1 AP): Eksplorasi santai, bonus comfort untuk semua

**Fitur Khusus:**
- Biaya AP berbeda sesuai intensitas aktivitas
- Prompt AI yang disesuaikan untuk setiap jenis aksi
- Fokus pada narasi internal dan pengembangan diri
- Tidak ada dialog dengan karakter, murni aktivitas solo

### `/profile` (Legacy)
Lihat profil dasar pemain. Gunakan `/status` untuk informasi yang lebih lengkap.

## 🔄 Sistem Daily Reset

Game memiliki sistem reset harian otomatis yang membuat dunia terasa hidup:

### 🌅 Reset Harian Otomatis
- **Action Points**: Reset ke 10 AP setiap hari baru
- **Cuaca**: Berubah secara random setiap hari dengan 8 jenis cuaca berbeda
- **Notifikasi**: Pemain mendapat notifikasi cantik saat hari baru dimulai
- **Deteksi Otomatis**: Sistem mendeteksi hari baru saat pemain menggunakan command yang membutuhkan AP

### 🌤️ Jenis Cuaca (Sistem Dinamis dengan Bobot)
- **☀️ Cerah (35%)**: Mood cheerful, bonus trust +10%, comfort +10%, energy tinggi
- **⛅ Cerah Berawan (25%)**: Mood pleasant, bonus trust +5%, comfort +5%, energy normal
- **☁️ Mendung (15%)**: Mood melancholic, bonus affection +10%, comfort -5%, energy rendah
- **🌦️ Hujan Ringan (12%)**: Mood romantic, bonus affection +15%, comfort +10%, energy calm
- **🌧️ Hujan Deras (8%)**: Mood intimate, bonus affection +20%, trust +10%, energy cozy
- **💨 Berangin (3%)**: Mood dramatic, bonus trust +5%, comfort -10%, energy dynamic
- **🥶 Dingin (1.5%)**: Mood cozy, bonus comfort +15%, affection +10%, energy rendah
- **⛈️ Badai (0.5%)**: Mood intense, bonus affection +25%, trust +15%, energy tinggi (sangat langka!)

### ⚡ Action Points
- **Maksimal**: 10 AP per hari
- **Penggunaan**: 1 AP per interaksi `/say`
- **Reset**: Otomatis setiap hari baru
- **Habis**: Jika AP habis, harus menunggu hari berikutnya

## 🎲 Sistem Cuaca Dinamis Advanced

### 📊 Distribusi Cuaca Berbobot
Sistem cuaca menggunakan algoritma weighted random yang realistis:
- Cuaca cerah lebih sering muncul (60% total untuk Cerah + Cerah Berawan)
- Cuaca ekstrem sangat langka (Badai hanya 0.5% chance)
- Distribusi mengikuti pola cuaca alami

### 🎭 Efek Cuaca pada Gameplay
Setiap cuaca memiliki efek unik pada interaksi:
- **Bonus Stats**: Cuaca memberikan bonus pada Trust, Comfort, atau Affection
- **Mood Karakter**: AI menyesuaikan respons berdasarkan mood cuaca
- **Energy Level**: Mempengaruhi tingkat energi karakter dalam interaksi
- **Lokasi Spesifik**: Deskripsi berbeda untuk STARRY, sekolah, dan jalanan

### 🤖 Integrasi AI
- **Prompt Context**: Informasi cuaca detail dikirim ke AI
- **Mood Adaptation**: AI menyesuaikan narasi dengan mood cuaca
- **Character Behavior**: Setiap karakter bereaksi berbeda terhadap cuaca
- **Bonus Calculation**: AI mempertimbangkan bonus stats dari cuaca

## 🎯 Sistem Aksi Terstruktur

### 📋 Jenis Aksi dan Biaya AP
Game menyediakan aksi terstruktur dengan biaya AP yang bervariasi:

#### 🎸 **Latihan Gitar Sendiri** (3 AP)
- **Fokus**: Pengembangan skill musik dan kepercayaan diri
- **Stats Target**: Bocchi Trust & Comfort
- **Lokasi**: Private/Rumah
- **Narasi**: Kemajuan teknik, breakthrough, atau frustasi dalam bermusik

#### 🏢 **Bekerja di STARRY** (4 AP)
- **Fokus**: Interaksi sosial dan pengalaman kerja
- **Stats Target**: Semua karakter (Trust & Comfort)
- **Lokasi**: STARRY Live House
- **Narasi**: Pengalaman kerja, observasi band, interaksi dengan staff

#### ✍️ **Menulis Lagu** (2 AP)
- **Fokus**: Kreativitas dan ekspresi diri
- **Stats Target**: Bocchi & Kita Affection
- **Lokasi**: Private/Rumah
- **Narasi**: Proses kreatif, inspirasi, writer's block, atau eureka moment

#### 🚶 **Jalan-jalan di Shimokitazawa** (1 AP)
- **Fokus**: Relaksasi dan eksplorasi
- **Stats Target**: Comfort untuk semua karakter
- **Lokasi**: Street/Jalanan
- **Narasi**: Observasi lingkungan, penemuan tempat baru, refreshing mental

### 🎭 Perbedaan dengan `/say`
- **Solo Activity**: Fokus pada aktivitas sendiri, bukan interaksi sosial
- **Structured Choices**: Pilihan aksi yang sudah ditentukan
- **Variable AP Cost**: Biaya berbeda sesuai intensitas aktivitas
- **Internal Narration**: Lebih fokus pada pikiran dan perasaan internal
- **Skill Development**: Pengembangan kemampuan spesifik

## 📁 Struktur File

```
/
├── index.js              # File utama bot
├── database.js           # Setup dan fungsi database
├── commands/             # Folder untuk command files
│   ├── register.js       # Command registrasi
│   └── profile.js        # Command profil
├── package.json          # Dependencies dan scripts
├── .env                  # Environment variables (tidak di-commit)
├── .gitignore           # File yang diabaikan git
└── README.md            # Dokumentasi ini
```

## 🔧 Development

### Menambah Command Baru

1. Buat file baru di folder `commands/`
2. Export object dengan struktur:
   ```javascript
   module.exports = {
       data: new SlashCommandBuilder()
           .setName('command_name')
           .setDescription('Command description'),
       async execute(interaction) {
           // Command logic here
       }
   };
   ```

### Database Functions

File `database.js` menyediakan fungsi-fungsi utility:
- `getPlayer(discordId)` - Ambil data pemain
- `addPlayer(discordId, originStory, actionPoints)` - Tambah pemain baru
- `updatePlayer(discordId, updates)` - Update data pemain
- `closeDatabase()` - Tutup koneksi database

## 📝 TODO (Fase Selanjutnya)

- [ ] Sistem cuaca dinamis
- [ ] Interaksi dengan karakter
- [ ] Mini-games dan aktivitas
- [ ] Sistem inventory
- [ ] Event random
- [ ] Integrasi dengan LLM untuk dialog dinamis

## 🤝 Contributing

1. Fork repository
2. Buat branch untuk fitur baru
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail.

## 🎸 Karakter

- **Bocchi (Hitori Gotoh)** - Gitaris pemalu yang menjadi protagonis
- **Nijika (Ijichi Nijika)** - Drummer yang ceria dan ramah
- **Ryo (Yamada Ryo)** - Bassist yang cool dan tenang
- **Kita (Ikuyo Kita)** - Vokalis yang energik dan optimis
