const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-tickets')
        .setDescription('Configure ticket system and/or create the ticket panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(opt => opt.setName('order_category').setDescription('Order ticket category').addChannelTypes(4))
        .addChannelOption(opt => opt.setName('enquiry_category').setDescription('Enquiry ticket category').addChannelTypes(4))
        .addChannelOption(opt => opt.setName('support_category').setDescription('Support ticket category').addChannelTypes(4))
        .addRoleOption(opt => opt.setName('staff_role').setDescription('Staff role for tickets'))
        .addChannelOption(opt => opt.setName('log_channel').setDescription('Channel for ticket logs'))
        .addStringOption(opt => opt.setName('panel_title').setDescription('Panel title'))
        .addStringOption(opt => opt.setName('panel_description').setDescription('Panel description'))
        .addStringOption(opt => opt.setName('order_label').setDescription('Order button label'))
        .addStringOption(opt => opt.setName('enquiry_label').setDescription('Enquiry button label'))
        .addStringOption(opt => opt.setName('support_label').setDescription('Support button label')),

    async execute(interaction) {
        const { setConfig } = require('../../configManager');
        let updated = false;
        // Set config if options are provided
        const options = [
            { key: 'orderCategoryId', value: interaction.options.getChannel('order_category')?.id },
            { key: 'enquiryCategoryId', value: interaction.options.getChannel('enquiry_category')?.id },
            { key: 'supportCategoryId', value: interaction.options.getChannel('support_category')?.id },
            { key: 'staffRoleId', value: interaction.options.getRole('staff_role')?.id },
            { key: 'logChannelId', value: interaction.options.getChannel('log_channel')?.id },
            { key: 'ticketPanelTitle', value: interaction.options.getString('panel_title') },
            { key: 'ticketPanelDescription', value: interaction.options.getString('panel_description') },
        ];
        for (const opt of options) {
            if (opt.value) {
                await setConfig(interaction.guild.id, opt.key, opt.value);
                updated = true;
            }
        }
        // Button labels as an object
        const orderLabel = interaction.options.getString('order_label');
        const enquiryLabel = interaction.options.getString('enquiry_label');
        const supportLabel = interaction.options.getString('support_label');
        if (orderLabel || enquiryLabel || supportLabel) {
            const { getConfig } = require('../../configManager');
            const cfg = await getConfig(interaction.guild.id);
            const labels = cfg.ticketButtonLabels || {};
            if (orderLabel) labels.order = orderLabel;
            if (enquiryLabel) labels.enquiry = enquiryLabel;
            if (supportLabel) labels.support = supportLabel;
            await setConfig(interaction.guild.id, 'ticketButtonLabels', labels);
            updated = true;
        }
        if (updated) {
            await interaction.reply({ content: '✅ Ticket configuration updated.', flags: [ 'Ephemeral' ] });
            // If only updating config, do not create panel unless run without options
            return;
        }

        // If no options, show the panel as before
        const { getConfig } = require('../../configManager');
        const guildConfig = await getConfig(interaction.guild.id);
        if (!guildConfig.orderCategoryId || !guildConfig.enquiryCategoryId || !guildConfig.supportCategoryId || !guildConfig.staffRoleId) {
            return interaction.reply({
                content: '❌ The ticket system is not fully configured. Please set all three categories (order, enquiry, support) and the staff role.',
                flags: [ 'Ephemeral' ],
            });
        }
        const panelTitle = guildConfig.ticketPanelTitle || 'Create a Ticket';
        const panelDescription = guildConfig.ticketPanelDescription || 'Please select the reason for opening a ticket below.';
        const labels = guildConfig.ticketButtonLabels || {};
        const ticketEmbed = new EmbedBuilder().setColor(0x0099FF).setTitle(panelTitle).setDescription(panelDescription);
        const orderButton = new ButtonBuilder().setCustomId('create_order_ticket').setLabel(labels.order || 'Order').setStyle(ButtonStyle.Success).setEmoji('🛒');
        const enquiryButton = new ButtonBuilder().setCustomId('create_enquiry_ticket').setLabel(labels.enquiry || 'Enquiry').setStyle(ButtonStyle.Primary).setEmoji('❓');
        const supportButton = new ButtonBuilder().setCustomId('create_support_ticket').setLabel(labels.support || 'Support').setStyle(ButtonStyle.Secondary).setEmoji('🎟️');
        const row = new ActionRowBuilder().addComponents(orderButton, enquiryButton, supportButton);
        const sent = await interaction.channel.send({ embeds: [ticketEmbed], components: [row] });
        try {
            await setConfig(interaction.guild.id, 'ticketPanelChannelId', interaction.channel.id);
            await setConfig(interaction.guild.id, 'ticketPanelMessageId', sent.id);
        } catch (err) {
            console.error('Failed to save ticket panel info to config:', err);
        }
        await interaction.reply({ 
            content: '3-button ticket panel created!', 
            flags: [ 'Ephemeral' ] 
        });
    },
};
