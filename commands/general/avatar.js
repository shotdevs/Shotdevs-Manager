const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Shows your avatar or the avatar of a mentioned user.')
        .addUserOption(option => option.setName('user').setDescription('The user to get the avatar of').setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        await interaction.reply({ content: `${user.username}'s avatar: ${user.displayAvatarURL({ dynamic: true, size: 1024 })}` });
    },
};
