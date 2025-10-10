const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Deletes a specified number of messages from the channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // Only members with "Manage Messages" can use this
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        await interaction.deferReply({ flags: [ 'Ephemeral' ] });

        const messages = await interaction.channel.messages.fetch({ limit: amount });
        
        try {
            const deletedMessages = await interaction.channel.bulkDelete(messages, true); // true filters messages older than 14 days
            await interaction.editReply({ content: `✅ Successfully deleted **${deletedMessages.size}** message(s).` });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ An error occurred while trying to delete messages in this channel.' });
        }
    },
};
