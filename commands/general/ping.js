const { SlashCommandBuilder } = require('discord.js');
const {
    container,
    section,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks the bot\'s latency.'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, flags: [ 'Ephemeral' ] });
        
        const websocketLatency = interaction.client.ws.ping;
        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;

        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `🏓 **Pong!**\n\n**API Latency:** ${websocketLatency}ms\n**Roundtrip Latency:** ${roundtripLatency}ms`
                        })
                    ]
                })
            ],
            ephemeral: true
        });
    },
};
