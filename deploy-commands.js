require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ambil token dan client ID dari environment variables
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID; // Tambahkan CLIENT_ID ke .env

if (!token) {
    console.error('DISCORD_TOKEN tidak ditemukan di file .env');
    process.exit(1);
}

if (!clientId) {
    console.error('CLIENT_ID tidak ditemukan di file .env');
    console.log('Tambahkan CLIENT_ID=your_bot_client_id ke file .env');
    process.exit(1);
}

const commands = [];

// Baca semua command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
        console.log(`❌ [WARNING] Command di ${filePath} tidak memiliki properti "data" atau "execute"`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands
(async () => {
    try {
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
        console.log('Commands deployed globally. May take up to 1 hour to appear in all servers.');
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})();
