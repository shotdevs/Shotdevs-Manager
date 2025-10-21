const { Events } = require('discord.js');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        try {
            Logger.bot(`Logged in as ${client.user.tag}`);
            
            // Fetch all application commands and map their IDs
            const commands = await client.application.commands.fetch();
            commands.forEach(command => {
                const cmd = client.commands.get(command.name);
                if (cmd) {
                    cmd.id = command.id;
                    Logger.command(`Mapped ID for /${command.name}: ${command.id}`);
                }
            });
            Logger.success('Successfully fetched and mapped all command IDs');
        } catch (error) {
            Logger.error(`Failed to fetch command IDs: ${error}`);
        }
    },
};