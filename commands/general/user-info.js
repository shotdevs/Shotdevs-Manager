const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user-info')
        .setDescription('Displays information about a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get info about.')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);

        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor || 0x5865F2)
            .setTitle(user.username)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'User Tag', value: user.tag, inline: true },
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Bot Account', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: 'Joined Server', value: `<t:${parseInt(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Account Created', value: `<t:${parseInt(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Roles', value: member.roles.cache.map(r => r.toString()).join(', ') || 'None' }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
