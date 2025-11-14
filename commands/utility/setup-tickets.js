const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../../configManager');
const {
    container,
    section,
    separator,
    button,
    actionRow,
    sendComponentsV2Message
} = require('../../utils/componentsV2Builder');

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
        const { logEvent } = require('../../logger');
        for (const opt of options) {
            if (opt.value) {
                await setConfig(interaction.guild.id, opt.key, opt.value);
                updated = true;
                logEvent(`:gear: Config updated: **${opt.key}** set to ${opt.value}`);
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
            logEvent(`:gear: Ticket button labels updated: ${JSON.stringify(labels)}`);
        }
        if (updated) {
            await interaction.reply({ content: '✅ Ticket configuration updated.', flags: [ 'Ephemeral' ] });
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
        
        // Build Components V2 ticket panel
        const sent = await sendComponentsV2Message(interaction.client, interaction.channel.id, {
            components: [
                container({
                    components: [
                        section({
                            content: `# ${panelTitle}\n${panelDescription}`
                        }),
                        separator(),
                        actionRow([
                            button({
                                custom_id: 'create_order_ticket',
                                label: labels.order || 'Order',
                                style: 3, // Success (green)
                                emoji: '🛒'
                            }),
                            button({
                                custom_id: 'create_enquiry_ticket',
                                label: labels.enquiry || 'Enquiry',
                                style: 1, // Primary (blue)
                                emoji: '❓'
                            }),
                            button({
                                custom_id: 'create_support_ticket',
                                label: labels.support || 'Support',
                                style: 2, // Secondary (gray)
                                emoji: '🎟️'
                            })
                        ])
                    ]
                })
            ]
        });
        try {
            await setConfig(interaction.guild.id, 'ticketPanelChannelId', interaction.channel.id);
            await setConfig(interaction.guild.id, 'ticketPanelMessageId', sent.id);
            logEvent(`:tickets: Ticket panel created in <#${interaction.channel.id}> by <@${interaction.user.id}>`);
        } catch (err) {
            const { debugLog } = require('../../logger');
            debugLog('Failed to save ticket panel info to config:', err);
        }
        await interaction.reply({ 
            content: '3-button ticket panel created!', 
            flags: [ 'Ephemeral' ] 
        });
    },
};
