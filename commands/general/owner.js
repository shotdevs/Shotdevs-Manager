const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('owner')
        .setDescription('Shows the server owner.'),
    async execute(interaction) {
        const owner = await interaction.guild.fetchOwner();
        await interaction.reply({ content: `👑 Server Owner: ${owner.user.tag} (${owner.user.id})`, ephemeral: true });
    },
};
