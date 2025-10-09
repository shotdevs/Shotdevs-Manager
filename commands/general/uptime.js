const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription("Shows how long the bot has been online."),

    async execute(interaction) {
        // The client.uptime property returns the uptime in milliseconds
        let totalSeconds = (interaction.client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);

        // Construct the uptime string, only showing non-zero values
        let uptime = `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2) // Discord Blurple color
            .setTitle('🤖 Bot Uptime')
            .setDescription(`I've been online for **${uptime}**.`)
            // The footer will show the exact date and time the bot started
            .setTimestamp(interaction.client.readyAt)
            .setFooter({ text: 'Started on' });

        await interaction.reply({ embeds: [embed] });
    },
};
