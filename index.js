const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const deployCommands = require('./deploy.js');
const express = require('express');
const LicenseManager = require('./utils/LicenseManager');
const Logger = require('./utils/logger');

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
        // Print startup banner
        console.log('\n━━━━━━━━━━━━━━━━ SHOTDEVS MANAGER ━━━━━━━━━━━━━━━━');
        
        // 1. License Verification
        Logger.license('Verifying license...');
        const licenseManager = new LicenseManager(
            process.env.LICENSE_API_BASE_URL,
            process.env.CLIENT_ID
        );

        const verificationResult = await licenseManager.verifyLicense(process.env.LICENSE_KEY);
        if (!verificationResult.success) {
            Logger.license(`${verificationResult.message}`, true);
            Logger.error('Bot will not start due to a failed license verification.');
            process.exit(1);
        }
        Logger.license(verificationResult.message);

        // Start periodic license checks (every 24 hours)
        licenseManager.startPeriodicCheck(process.env.LICENSE_KEY, 24 * 60 * 60 * 1000, (errorMessage) => {
            Logger.license(errorMessage, true);
            Logger.error('License has become invalid. Shutting down...');
            process.exit(1);
        });

        // 2. Normal Startup Sequence
        await mongoose.connect(process.env.MONGO_URI);
        Logger.database('Connected to MongoDB');

        await deployCommands();
        await client.login(process.env.DISCORD_TOKEN);
        Logger.bot(`Logged in as ${client.user.tag}`);

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
        
        app.listen(port, () => {
            Logger.web(`Website listening on port ${port}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        });

    } catch (error) {
        Logger.error(`Failed to start the bot: ${error}`);
        process.exit(1);
    }
}

start();

module.exports = client;
