const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../../configManager'); // Adjust path if needed

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

        const embed = new EmbedBuilder()
            .setTitle(`Ticket System Configuration`)
            .setDescription(`Showing settings for **${interaction.guild.name}**`)
            .setColor(0x00BFFF) // Deep Sky Blue
            .setTimestamp()
            .addFields(
                {
                    name: 'Core Setup',
                    value: [
                        `**Staff Role:** ${formatValue(config.staffRoleId, 'role')}`,
                        `**Log Channel:** ${formatValue(config.logChannelId, 'channel')}`,
                    ].join('\n'),
                },
                {
                    name: 'Ticket Categories',
                    value: [
                        `**Orders:** ${formatValue(config.orderCategoryId, 'channel')}`,
                        `**Enquiries:** ${formatValue(config.enquiryCategoryId, 'channel')}`,
                        `**Support:** ${formatValue(config.supportCategoryId, 'channel')}`,
                    ].join('\n'),
                },
                {
                    name: 'Panel Appearance',
                    value: [
                        `**Panel Title:** \`\`\`${config.ticketPanelTitle || 'Create a Ticket'}\`\`\``,
                        `**Panel Description:** \`\`\`${config.ticketPanelDescription || 'Please select the reason for opening a ticket below.'}\`\`\``,
                    ].join('\n'),
                },
                {
                    name: 'Button Labels',
                    value: `🛒 ${orderLabel} | ❓ ${enquiryLabel} | 🎟️ ${supportLabel}`,
                }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
