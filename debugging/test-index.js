// Test file untuk memastikan index.js berfungsi dengan baik
const fs = require('fs');
const path = require('path');

async function testIndexFile() {
    console.log('🧪 Memulai test file index.js...\n');
    
    try {
        // Test 1: Cek apakah file index.js ada
        console.log('Test 1: Cek keberadaan file index.js');
        const indexPath = path.join(__dirname, 'index.js');
        if (fs.existsSync(indexPath)) {
            console.log('✅ File index.js ditemukan\n');
        } else {
            console.log('❌ File index.js tidak ditemukan\n');
            return;
        }
        
        // Test 2: Cek import dependencies
        console.log('Test 2: Cek import dependencies');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        const requiredImports = [
            'dotenv',
            'discord.js',
            'fs',
            'path',
            './database'
        ];
        
        let allImportsFound = true;
        requiredImports.forEach(importName => {
            if (indexContent.includes(`require('${importName}')`)) {
                console.log(`✅ Import ${importName} ditemukan`);
            } else {
                console.log(`❌ Import ${importName} tidak ditemukan`);
                allImportsFound = false;
            }
        });
        
        if (allImportsFound) {
            console.log('✅ Semua import dependencies ditemukan\n');
        } else {
            console.log('❌ Ada import yang hilang\n');
        }
        
        // Test 3: Cek Discord.js components
        console.log('Test 3: Cek Discord.js components');
        const discordComponents = [
            'Client',
            'GatewayIntentBits',
            'Collection',
            'REST',
            'Routes'
        ];
        
        let allComponentsFound = true;
        discordComponents.forEach(component => {
            if (indexContent.includes(component)) {
                console.log(`✅ Discord.js component ${component} ditemukan`);
            } else {
                console.log(`❌ Discord.js component ${component} tidak ditemukan`);
                allComponentsFound = false;
            }
        });
        
        if (allComponentsFound) {
            console.log('✅ Semua Discord.js components ditemukan\n');
        } else {
            console.log('❌ Ada Discord.js component yang hilang\n');
        }
        
        // Test 4: Cek fungsi-fungsi utama
        console.log('Test 4: Cek fungsi-fungsi utama');
        const requiredFunctions = [
            'loadCommands',
            'deployCommands'
        ];
        
        let allFunctionsFound = true;
        requiredFunctions.forEach(funcName => {
            if (indexContent.includes(`function ${funcName}`) || indexContent.includes(`async function ${funcName}`)) {
                console.log(`✅ Fungsi ${funcName} ditemukan`);
            } else {
                console.log(`❌ Fungsi ${funcName} tidak ditemukan`);
                allFunctionsFound = false;
            }
        });
        
        if (allFunctionsFound) {
            console.log('✅ Semua fungsi utama ditemukan\n');
        } else {
            console.log('❌ Ada fungsi yang hilang\n');
        }
        
        // Test 5: Cek event handlers
        console.log('Test 5: Cek event handlers');
        const requiredEvents = [
            'ready',
            'interactionCreate',
            'error'
        ];
        
        let allEventsFound = true;
        requiredEvents.forEach(eventName => {
            if (indexContent.includes(`client.on('${eventName}'`) || indexContent.includes(`client.once('${eventName}'`)) {
                console.log(`✅ Event handler ${eventName} ditemukan`);
            } else {
                console.log(`❌ Event handler ${eventName} tidak ditemukan`);
                allEventsFound = false;
            }
        });
        
        if (allEventsFound) {
            console.log('✅ Semua event handlers ditemukan\n');
        } else {
            console.log('❌ Ada event handler yang hilang\n');
        }
        
        // Test 6: Cek environment variables usage
        console.log('Test 6: Cek penggunaan environment variables');
        const envVars = [
            'DISCORD_TOKEN',
            'CLIENT_ID'
        ];
        
        let allEnvVarsUsed = true;
        envVars.forEach(envVar => {
            if (indexContent.includes(`process.env.${envVar}`)) {
                console.log(`✅ Environment variable ${envVar} digunakan`);
            } else {
                console.log(`❌ Environment variable ${envVar} tidak digunakan`);
                allEnvVarsUsed = false;
            }
        });
        
        if (allEnvVarsUsed) {
            console.log('✅ Semua environment variables digunakan\n');
        } else {
            console.log('❌ Ada environment variable yang tidak digunakan\n');
        }
        
        // Test 7: Cek graceful shutdown
        console.log('Test 7: Cek graceful shutdown');
        const shutdownSignals = ['SIGINT', 'SIGTERM'];
        let shutdownHandlersFound = true;
        
        shutdownSignals.forEach(signal => {
            if (indexContent.includes(`process.on('${signal}'`)) {
                console.log(`✅ Shutdown handler untuk ${signal} ditemukan`);
            } else {
                console.log(`❌ Shutdown handler untuk ${signal} tidak ditemukan`);
                shutdownHandlersFound = false;
            }
        });
        
        if (shutdownHandlersFound) {
            console.log('✅ Graceful shutdown handlers ditemukan\n');
        } else {
            console.log('❌ Ada shutdown handler yang hilang\n');
        }
        
        // Test 8: Cek folder commands
        console.log('Test 8: Cek folder commands dan file-file command');
        const commandsPath = path.join(__dirname, 'commands');
        if (fs.existsSync(commandsPath)) {
            console.log('✅ Folder commands ditemukan');
            
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            console.log(`✅ Ditemukan ${commandFiles.length} file command:`);
            commandFiles.forEach(file => {
                console.log(`   - ${file}`);
            });
        } else {
            console.log('❌ Folder commands tidak ditemukan');
        }
        
        console.log('\n🎉 Test file index.js selesai!');
        
    } catch (error) {
        console.error('❌ Error dalam test index.js:', error);
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testIndexFile();
}

module.exports = { testIndexFile };
