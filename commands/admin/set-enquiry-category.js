const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager'); // ✅ Correct

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-enquiry-category')
        .setDescription('Set the category for ENQUIRY tickets.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => option.setName('category').setDescription('The category channel for enquiries').addChannelTypes(ChannelType.GuildCategory).setRequired(true)),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const category = interaction.options.getChannel('category');
        setConfig(guildId, 'enquiryCategoryId', category.id);
        await interaction.reply({ content: `✅ Ticket support role has been set to **${role.name}**.`, flags: [ 'Ephemeral' ] });
    }
};
