const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Shows information about a user.')
        .addUserOption(option => option.setName('user').setDescription('The user to get info about').setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);
        await interaction.reply({
            content: `👤 **User Info**\nUsername: ${user.tag}\nID: ${user.id}\nJoined: ${member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:R>` : 'N/A'}`,
            ephemeral: true
        });
    },
};
