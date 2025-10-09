const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Shows information about this server.'),
    async execute(interaction) {
        const guild = interaction.guild;
        await interaction.reply({
            content: `🌐 **Server Info**\nName: ${guild.name}\nID: ${guild.id}\nMembers: ${guild.memberCount}`,
            ephemeral: true
        });
    },
};
