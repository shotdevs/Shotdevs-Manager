const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const deployCommands = require('./deploy.js');
const express = require('express');

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

// Command & Event Handlers (Unchanged)
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
        }
    }
}
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

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        await deployCommands();
        await client.login(process.env.DISCORD_TOKEN);
        console.log(`✅ Logged in as ${client.user.tag}`);

        const app = express();
        const port = process.env.PORT || 3000;

        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, 'views'));
        app.use(express.static(path.join(__dirname, 'public')));

        app.get('/', (req, res) => {
            res.render('index', {
                botName: "Shotdevs",
                botDescription: "The official management & automation bot for the Shotdevs development server.",
                botLogoUrl: "https://media.discordapp.net/attachments/1426107282248306798/1429850185164394739/f5ad4fbfc9a5455cc4039bbd0d05444e.png?ex=68f7a341&is=68f651c1&hm=080bd8e8ddfb524921dfed574cb5db689558d3388b36be5518b4632385f2816f&=&format=webp&quality=lossless&width=570&height=570",
                companyWebsiteUrl: "https://shotdevs.live/",
                companyProjectsUrl: "#",
                footerText: "Shotdevs"
            });
        });
        
        app.get('/staff', (req, res) => res.send('Staff page is under construction.'));
        app.get('/rules', (req, res) => res.send('Rules page is under construction.'));
        app.get('/media', (req, res) => res.send('Media page is under construction.'));
        app.get('/announcements', (req, res) => res.send('Announcements page is under construction.'));
        app.get('/status', (req, res) => res.send('Status page is under construction.'));

        app.listen(port, () => {
            console.log(`✅ Website listening on port ${port}`);
        });

    } catch (error) {
        console.error('❌ Failed to start the bot:', error);
    }
}

start();

module.exports = client;
