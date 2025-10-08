const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-config')
        .setDescription('Configure the ticket system for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        // CHANGED: Replaced the single 'category' subcommand with three specific ones
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-order-category')
                .setDescription('Set the category for ORDER tickets.')
                .addChannelOption(option =>
                    option.setName('category').setDescription('The category channel for orders').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-enquiry-category')
                .setDescription('Set the category for ENQUIRY tickets.')
                .addChannelOption(option =>
                    option.setName('category').setDescription('The category channel for enquiries').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-support-category')
                .setDescription('Set the category for SUPPORT tickets.')
                .addChannelOption(option =>
                    option.setName('category').setDescription('The category channel for support').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
        .addSubcommand(subcommand => // This subcommand for setting the role is unchanged
            subcommand
                .setName('role')
                .setDescription('Set the role that can manage tickets.')
                .addRoleOption(option =>
                    option.setName('support-role').setDescription('The support staff role').setRequired(true)))
        .addSubcommand(subcommand => // This subcommand for the message is also unchanged
            subcommand
                .setName('message')
                .setDescription('Set the message for the ticket creation panel.')
                .addStringOption(option => option.setName('title').setDescription('The title of the panel embed').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('The description of the panel embed').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        // CHANGED: Handle the three new category commands
        if (subcommand === 'set-order-category') {
            const category = interaction.options.getChannel('category');
            setConfig(guildId, 'orderCategoryId', category.id);
            await interaction.editReply(`✅ Order ticket category has been set to **${category.name}**.`);
        } else if (subcommand === 'set-enquiry-category') {
            const category = interaction.options.getChannel('category');
            setConfig(guildId, 'enquiryCategoryId', category.id);
            await interaction.editReply(`✅ Enquiry ticket category has been set to **${category.name}**.`);
        } else if (subcommand === 'set-support-category') {
            const category = interaction.options.getChannel('category');
            setConfig(guildId, 'supportCategoryId', category.id);
            await interaction.editReply(`✅ Support ticket category has been set to **${category.name}**.`);
        } else if (subcommand === 'role') {
            const role = interaction.options.getRole('support-role');
            setConfig(guildId, 'staffRoleId', role.id);
            await interaction.editReply(`✅ Ticket support role has been set to **${role.name}**.`);
        } else if (subcommand === 'message') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            setConfig(guildId, 'ticketPanelTitle', title);
            setConfig(guildId, 'ticketPanelDescription', description);
            await interaction.editReply(`✅ Ticket panel message has been updated.`);
        }
    },
};
