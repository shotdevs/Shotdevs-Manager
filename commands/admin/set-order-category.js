const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-order-category')
        .setDescription('Set the category for ORDER tickets.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => option.setName('category').setDescription('The category channel for orders').addChannelTypes(ChannelType.GuildCategory).setRequired(true)),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const category = interaction.options.getChannel('category');
        setConfig(guildId, 'orderCategoryId', category.id);
        await interaction.reply({ content: `✅ Order ticket category set to **${category.name}**.`, ephemeral: true });
    },
};
