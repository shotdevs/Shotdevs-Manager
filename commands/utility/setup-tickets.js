const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-tickets')
        .setDescription('Creates the multi-button ticket panel in this channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const guildConfig = getConfig(interaction.guild.id);
        if (!guildConfig.ticketCategoryId || !guildConfig.staffRoleId) {
            return interaction.reply({
                content: '❌ The ticket system is not fully configured. Please use `/ticket-config` to set the category and role.',
                ephemeral: true,
            });
        }
        const panelTitle = guildConfig.ticketPanelTitle || 'Support & Bug Reports';
        const panelDescription = guildConfig.ticketPanelDescription || 'Please select the type of ticket you would like to open.';
        const ticketEmbed = new EmbedBuilder().setColor(0x0099FF).setTitle(panelTitle).setDescription(panelDescription);
        const supportButton = new ButtonBuilder().setCustomId('create_support_ticket').setLabel('Support Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎟️');
        const bugReportButton = new ButtonBuilder().setCustomId('create_bug_report_ticket').setLabel('Bug Report').setStyle(ButtonStyle.Secondary).setEmoji('🐞');
        const row = new ActionRowBuilder().addComponents(supportButton, bugReportButton);
        await interaction.channel.send({ embeds: [ticketEmbed], components: [row] });
        await interaction.reply({ content: 'Multi-button ticket panel created!', ephemeral: true });
    },
};
