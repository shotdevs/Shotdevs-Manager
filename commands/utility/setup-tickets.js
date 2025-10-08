const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-tickets')
        .setDescription('Creates the 3-button ticket panel in this channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const guildConfig = getConfig(interaction.guild.id);
        
        // CHANGED: Check if all three categories are configured
        if (!guildConfig.orderCategoryId || !guildConfig.enquiryCategoryId || !guildConfig.supportCategoryId || !guildConfig.staffRoleId) {
            return interaction.reply({
                content: '❌ The ticket system is not fully configured. Please use `/ticket-config` to set all three categories (order, enquiry, support) and the staff role.',
                ephemeral: true,
            });
        }

        const panelTitle = guildConfig.ticketPanelTitle || 'Create a Ticket';
        const panelDescription = guildConfig.ticketPanelDescription || 'Please select the reason for opening a ticket below.';
        const ticketEmbed = new EmbedBuilder().setColor(0x0099FF).setTitle(panelTitle).setDescription(panelDescription);

        // NEW: Create three buttons
        const orderButton = new ButtonBuilder().setCustomId('create_order_ticket').setLabel('Order').setStyle(ButtonStyle.Success).setEmoji('🛒');
        const enquiryButton = new ButtonBuilder().setCustomId('create_enquiry_ticket').setLabel('Enquiry').setStyle(ButtonStyle.Primary).setEmoji('❓');
        const supportButton = new ButtonBuilder().setCustomId('create_support_ticket').setLabel('Support').setStyle(ButtonStyle.Secondary).setEmoji('🎟️');

        // CHANGED: Add all three buttons to the row
        const row = new ActionRowBuilder().addComponents(orderButton, enquiryButton, supportButton);

        await interaction.channel.send({ embeds: [ticketEmbed], components: [row] });
        await interaction.reply({ content: '3-button ticket panel created!', ephemeral: true });
    },
};
