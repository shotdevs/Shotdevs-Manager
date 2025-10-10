const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks the bot\'s latency.'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, flags: [ 'Ephemeral' ] });
        
        const websocketLatency = interaction.client.ws.ping;
        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'API Latency', value: `**${websocketLatency}**ms`, inline: true },
                { name: 'Roundtrip Latency', value: `**${roundtripLatency}**ms`, inline: true }
            );

        await interaction.editReply({ content: '', embeds: [embed] });
    },
};
