const { SlashCommandBuilder } = require('discord.js');
const {
    container,
    section,
    separator,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

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
        
        // Get started timestamp
        const startedTimestamp = Math.floor(interaction.client.readyAt.getTime() / 1000);

        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `# ⏰ Bot Uptime`
                        }),
                        separator(),
                        section({
                            content: `I've been online for **${uptime}**\n\n**Started on:** <t:${startedTimestamp}:F>`
                        })
                    ]
                })
            ]
        });
    },
};
