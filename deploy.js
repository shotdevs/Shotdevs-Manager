const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const Logger = require('./utils/logger');

// This function will be exported and called from index.js
async function deployCommands() {
    const commands = [];
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            }
        }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        // Validate environment variables
        if (!process.env.DISCORD_TOKEN) {
            throw new Error('DISCORD_TOKEN is not set in environment variables');
        }
        if (!process.env.CLIENT_ID) {
            throw new Error('CLIENT_ID is not set in environment variables');
        }

        Logger.command(`Started refreshing ${commands.length} application (/) commands`);
        Logger.command(`Commands to be registered: ${commands.map(cmd => cmd.name).join(', ')}`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        Logger.success(`Successfully deployed ${data.length} application (/) commands`);
        Logger.command(`Registered commands: ${data.map(cmd => cmd.name).join(', ')}`);
    } catch (error) {
        Logger.error(`Error deploying commands: ${error.message}`);
        throw error; // Re-throw to handle in the calling function
    }
};

// Export the function for use in other files
module.exports = deployCommands;

// When running this file directly (node deploy.js)
if (require.main === module) {
    console.log('\n━━━━━━━━━━━━ DEPLOYING COMMANDS ━━━━━━━━━━━━');
    deployCommands().then(() => {
        Logger.success('Command deployment complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }).catch(error => {
        Logger.error(`Command deployment failed: ${error}`);
        process.exit(1);
    });
}
