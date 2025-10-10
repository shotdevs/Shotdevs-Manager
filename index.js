const fs = require('node:fs');
const path = require('node:path');
// Import Partials
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const deployCommands = require('./deploy.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions // <-- ADDED: Allows bot to see reactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction] // <-- ADDED: Helps bot read reactions on old messages
});

// --- Command Handler ---
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            command.category = folder;
            client.commands.set(command.data.name, command);
        }
    }
}

// --- Event Handler ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// --- Main Startup Logic ---
async function start() {
    try {
        // Connect to the MongoDB database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB database.');

        // Run the deployment script on startup
        await deployCommands();

        // Log in to Discord with your client's token
        await client.login(process.env.DISCORD_TOKEN);
        
        // This is now handled by your ready.js event file
        // const { setClient } = require('./logger');
        // client.once('ready', () => {
        //     setClient(client);
        // });

    } catch (error) {
        console.error("❌ Failed to start the bot:", error);
    }
}

// Call the start function to begin the process
start();

// This is now handled by your ready.js event file
// --- Ready Event ---
// client.once('ready', () => {
//     console.log(`🤖 Bot is online! Logged in as ${client.user.tag}`);
// });
