const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Displays a user\'s avatar.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose avatar you want to see.')
                .setRequired(false)), // Optional, defaults to the command user
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }));

        await interaction.reply({ embeds: [embed] });
    },
};
