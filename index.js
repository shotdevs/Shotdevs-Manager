const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const deployCommands = require('./deploy.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// --- Command Handler ---
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    if (!fs.lstatSync(commandsPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            command.category = folder;
            client.commands.set(command.data.name, command);
            console.log(`[LOAD] Command loaded: ${command.data.name}`);
        } else {
            console.log(`[WARN] Command not loaded: ${file}`);
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
        // --- MongoDB ---
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // --- Deploy slash commands ---
        await deployCommands();

        // --- Discord login ---
        await client.login(process.env.DISCORD_TOKEN);

        // --- Express Web Server ---
        const express = require('express');
        const GuildConfig = require('./models/GuildConfig');
        const MemberProfile = require('./models/MemberProfile');
        const app = express();
        const port = process.env.PORT || 3000;

        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, 'views'));

        app.get('/', (req, res) => res.render('index'));

        app.get('/api/guilds', async (req, res) => {
            try {
                const guilds = await GuildConfig.find();
                res.json(guilds);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        app.get('/api/members', async (req, res) => {
            try {
                const members = await MemberProfile.find();
                res.json(members);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        app.listen(port, () => {
            console.log(`✅ Website listening on http://localhost:${port}`);
        });

    } catch (error) {
        console.error('❌ Failed to start the bot:', error);
    }
}

start();

module.exports = client;
