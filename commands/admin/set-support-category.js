const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-support-category')
        .setDescription('Set the category for SUPPORT tickets.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => option.setName('category').setDescription('The category channel for support').addChannelTypes(ChannelType.GuildCategory).setRequired(true)),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const category = interaction.options.getChannel('category');
        setConfig(guildId, 'supportCategoryId', category.id);
        await interaction.reply({ content: `✅ Support ticket category set to **${category.name}**.`, ephemeral: true });
    },
};
