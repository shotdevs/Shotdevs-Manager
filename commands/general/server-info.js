const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-info')
        .setDescription('Displays information about the current server.'),
    async execute(interaction) {
        const { guild } = interaction;
        const owner = await guild.fetchOwner();

        const embed = new EmbedBuilder()
            .setColor(0xfee75c)
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👑 Owner', value: owner.user.tag, inline: true },
                { name: '👥 Members', value: guild.memberCount.toString(), inline: true },
                { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount} (Level ${guild.premiumTier})`, inline: true },
                { name: '📅 Created On', value: `<t:${parseInt(guild.createdTimestamp / 1000)}:D>`, inline: false },
                { name: '📜 Server ID', value: guild.id, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
