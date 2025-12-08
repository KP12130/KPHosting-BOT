const { REST, Routes } = require('discord.js');
const config = require('../config');
const fs = require('fs');
const path = require('path');

async function registerCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            
            // Skip if not a valid command
            if (!command.data || typeof command.data.toJSON !== 'function') {
                console.log(`⚠️ Skipping ${file} - not a valid command file`);
                continue;
            }
            
            commands.push(command.data.toJSON());
            console.log(`✅ Registered command: ${command.data.name}`);
        } catch (error) {
            console.error(`❌ Error loading command ${file}:`, error.message);
        }
    }

    const rest = new REST({ version: '10' }).setToken(config.TOKEN);

    try {
        console.log('📤 Pushing slash commands to Discord...');
        await rest.put(
            Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
            { body: commands }
        );
        console.log('✅ Slash commands registered successfully!');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
}

module.exports = { registerCommands };
