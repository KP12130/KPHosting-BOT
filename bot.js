require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { registerCommands } = require('./utils/registerCommands');

// Express HTTP szerver
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('KPHosting Bot is running! ✅');
});

app.listen(PORT, () => {
    console.log(`🌐 HTTP server running on port ${PORT}`);
});

// Discord bot
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ] 
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        
        // Validate command structure
        if (!command.data || !command.data.name) {
            console.error(`❌ Command at ${file} is missing required "data" or "data.name" property`);
            continue;
        }
        
        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded command: ${command.data.name}`);
    } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error);
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
        const event = require(filePath);
        
        // Main event
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        
        console.log(`✅ Loaded event: ${event.name}`);
    } catch (error) {
        console.error(`❌ Error loading event ${file}:`, error);
    }
}

// Register slash commands
registerCommands();

// Login
client.login(process.env.DISCORD_TOKEN);
