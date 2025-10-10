const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Import the new deploy function from our deploy.js file
const deployCommands = require('./deploy.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// --- Command Handler (unchanged) ---
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
            client.commands.set(command.data.name, command);
        }
    }
}

// --- Event Handler (unchanged) ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// --- Main Startup Logic ---
async function start() {
    try {
        // Run the deployment script on startup
        await deployCommands();

        // Log in to Discord with your client's token
        await client.login(process.env.DISCORD_TOKEN);

    } catch (error) {
        console.error("Failed to start the bot:", error);
    }
}

// Call the start function to begin the process
start();


// --- Ready Event ---
client.once('ready', () => {
    console.log(`🤖 Bot is online! Logged in as ${client.user.tag}`);
});
// ... other imports at the top
const mongoose = require('mongoose');

// Import the new deploy function
const deployCommands = require('./deploy.js');

// --- Main Startup Logic ---
async function start() {
    try {
        // --- ADD THIS CONNECTION LOGIC ---
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB database.');
        // ---------------------------------

        // Run the deployment script on startup
        await deployCommands();

        // Log in to Discord with your client's token
        await client.login(process.env.DISCORD_TOKEN);

    } catch (error) {
        console.error("❌ Failed to start the bot:", error);
    }
}
