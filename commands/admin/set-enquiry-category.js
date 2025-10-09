const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-enquiry-category')
        .setDescription('Sets the category for ENQUIRY tickets.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('The category channel for enquiries')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true)),
    async execute(interaction) {
        const category = interaction.options.getChannel('category');
        await setConfig(interaction.guild.id, 'enquiryCategoryId', category.id);
        await interaction.reply({ content: `✅ Enquiry ticket category has been set to **${category.name}**.`, flags: [ 'Ephemeral' ] });
    },
};
