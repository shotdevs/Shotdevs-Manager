const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a list of available commands.'),
    async execute(interaction) {
        // You can customize this list as needed
        const commands = [
            '`/uptime`', '`/help`', '`/info`', '`/avatar`', '`/userinfo`', '`/serverinfo`', '`/owner`',
            '`/set-order-category`', '`/set-enquiry-category`', '`/set-support-category`', '`/set-log-channel`', '`/set-support-role`', '`/set-ticket-message`'
        ];
        await interaction.reply({ content: `📖 **Available Commands:**\n${commands.join(' ')}\nFor more info, use each command.`, ephemeral: true });
    },
};
