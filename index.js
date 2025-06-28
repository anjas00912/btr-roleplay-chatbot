require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { initializeDatabase, closeDatabase } = require('./database');

// Membuat instance client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// Collection untuk menyimpan commands
client.commands = new Collection();

// Array untuk menyimpan command data untuk registrasi
const commands = [];

// Fungsi untuk memuat commands dari folder commands
function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    
    // Cek apakah folder commands ada
    if (!fs.existsSync(commandsPath)) {
        console.log('Folder commands tidak ditemukan, membuat folder...');
        fs.mkdirSync(commandsPath);
        return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`Command ${command.data.name} berhasil dimuat`);
        } else {
            console.log(`[WARNING] Command di ${filePath} tidak memiliki properti "data" atau "execute"`);
        }
    }
}

// Fungsi untuk mendaftarkan slash commands ke Discord
async function deployCommands() {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;

    if (!token) {
        console.error('❌ DISCORD_TOKEN tidak ditemukan di file .env');
        return false;
    }

    if (!clientId) {
        console.error('❌ CLIENT_ID tidak ditemukan di file .env');
        console.log('💡 Tambahkan CLIENT_ID=your_bot_client_id ke file .env');
        return false;
    }

    try {
        console.log(`🚀 Mendaftarkan ${commands.length} slash command(s)...`);

        const rest = new REST().setToken(token);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`✅ Berhasil mendaftarkan ${data.length} slash command(s)`);
        return true;
    } catch (error) {
        console.error('❌ Error mendaftarkan commands:', error);
        return false;
    }
}

// Event ketika bot siap
client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} telah online!`);
    console.log(`Bot ID: ${client.user.id}`);

    try {
        // Inisialisasi database
        await initializeDatabase();
        console.log('Database telah diinisialisasi');

        // Load commands
        loadCommands();

        // Daftarkan slash commands ke Discord
        const deploySuccess = await deployCommands();
        if (deploySuccess) {
            console.log('🎉 Bot siap digunakan!');
        } else {
            console.log('⚠️ Bot online tapi commands mungkin tidak terdaftar');
        }
    } catch (error) {
        console.error('Error inisialisasi:', error);
    }
});

// Event untuk menangani interaksi slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Command ${interaction.commandName} tidak ditemukan`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        
        const errorMessage = 'Terjadi error saat menjalankan command!';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
});

// Event untuk menangani pesan (jika diperlukan untuk prefix commands)
client.on('messageCreate', message => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Untuk saat ini, kita fokus pada slash commands
    // Prefix commands bisa ditambahkan nanti jika diperlukan
});

// Event untuk menangani error
client.on('error', error => {
    console.error('Discord client error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Menerima SIGINT, menutup bot...');
    
    try {
        await closeDatabase();
        client.destroy();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('Menerima SIGTERM, menutup bot...');
    
    try {
        await closeDatabase();
        client.destroy();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Validasi environment variables sebelum login
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN tidak ditemukan di file .env');
    console.log('💡 Pastikan file .env berisi DISCORD_TOKEN=your_bot_token_here');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.log('⚠️ CLIENT_ID tidak ditemukan di file .env');
    console.log('💡 Tambahkan CLIENT_ID=your_bot_client_id untuk auto-deploy commands');
}

console.log('🚀 Memulai bot Discord...');

// Login ke Discord
client.login(process.env.DISCORD_TOKEN);
