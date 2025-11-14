const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../../configManager'); // Adjust path if needed
const {
    container,
    section,
    separator,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('view-ticket-config')
        .setDescription('Displays the current ticket system configuration for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const config = await getConfig(guildId);

        // A helper to format the output. If the ID exists, it creates a clickable link.
        // Otherwise, it shows "Not Set".
        const formatValue = (id, type = 'channel') => {
            if (!id) return '❌ Not Set';
            if (type === 'channel') return `<#${id}>`;
            if (type === 'role') return `<@&${id}>`;
            return id;
        };
        
        // Handle button labels, providing defaults if they don't exist
        const labels = config.ticketButtonLabels || {};
        const orderLabel = labels.order || 'Order';
        const enquiryLabel = labels.enquiry || 'Enquiry';
        const supportLabel = labels.support || 'Support';

        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `# Ticket System Configuration\nShowing settings for **${interaction.guild.name}**`
                        }),
                        separator(),
                        section({
                            content: `## Core Setup\n**Staff Role:** ${formatValue(config.staffRoleId, 'role')}\n**Log Channel:** ${formatValue(config.logChannelId, 'channel')}`
                        }),
                        separator(),
                        section({
                            content: `## Ticket Categories\n**Orders:** ${formatValue(config.orderCategoryId, 'channel')}\n**Enquiries:** ${formatValue(config.enquiryCategoryId, 'channel')}\n**Support:** ${formatValue(config.supportCategoryId, 'channel')}`
                        }),
                        separator(),
                        section({
                            content: `## Panel Appearance\n**Panel Title:** \`${config.ticketPanelTitle || 'Create a Ticket'}\`\n**Panel Description:** \`${config.ticketPanelDescription || 'Please select the reason for opening a ticket below.'}\``
                        }),
                        separator(),
                        section({
                            content: `## Button Labels\n🛒 ${orderLabel} | ❓ ${enquiryLabel} | 🎟️ ${supportLabel}`
                        })
                    ]
                })
            ],
            ephemeral: true
        });
    },
};
