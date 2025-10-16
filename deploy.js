const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

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

        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        console.log('Commands to be registered:', commands.map(cmd => cmd.name).join(', '));

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ Successfully deployed ${data.length} application (/) commands.`);
        console.log('Registered commands:', data.map(cmd => cmd.name).join(', '));
    } catch (error) {
        console.error('❌ Error deploying commands:', error.message);
        throw error; // Re-throw to handle in the calling function
    }
};

// Export the function for use in other files
module.exports = deployCommands;

// If this file is run directly (not imported), execute deployCommands
if (require.main === module) {
    console.log('Deploying commands...');
    deployCommands()
        .then(() => console.log('Command deployment completed.'))
        .catch(error => {
            console.error('Failed to deploy commands:', error);
            process.exit(1);
        });
}

// When running this file directly (node deploy.js)
if (require.main === module) {
    console.log('🚀 Deploying commands...');
    deployCommands().then(() => {
        console.log('✅ Command deployment complete!');
    }).catch(error => {
        console.error('❌ Command deployment failed:', error);
        process.exit(1);
    });
}
