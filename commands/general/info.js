const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Shows information about the bot.'),
    async execute(interaction) {
        await interaction.reply({ content: `🤖 **Bot Info**\nName: ${interaction.client.user.username}\nID: ${interaction.client.user.id}`, ephemeral: true });
    },
};
