const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-config')
        .setDescription('Configure the ticket system for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-order-category')
                .setDescription('Set the category for ORDER tickets.')
                .addChannelOption(option => option.setName('category').setDescription('The category channel for orders').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-enquiry-category')
                .setDescription('Set the category for ENQUIRY tickets.')
                .addChannelOption(option => option.setName('category').setDescription('The category channel for enquiries').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-support-category')
                .setDescription('Set the category for SUPPORT tickets.')
                .addChannelOption(option => option.setName('category').setDescription('The category channel for support').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
        // NEW: Subcommand for the log channel
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-log-channel')
                .setDescription('Set the channel where ticket logs will be sent.')
                .addChannelOption(option => option.setName('channel').setDescription('The text channel for logs').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('role')
                .setDescription('Set the role that can manage tickets.')
                .addRoleOption(option => option.setName('support-role').setDescription('The support staff role').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('message')
                .setDescription('Set the message for the ticket creation panel.')
                .addStringOption(option => option.setName('title').setDescription('The title of the panel embed').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('The description of the panel embed').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        if (subcommand === 'set-order-category') { /* ... unchanged ... */ }
        else if (subcommand === 'set-enquiry-category') { /* ... unchanged ... */ }
        else if (subcommand === 'set-support-category') { /* ... unchanged ... */ }
        // NEW: Handle the new log channel command
        else if (subcommand === 'set-log-channel') {
            const channel = interaction.options.getChannel('channel');
            setConfig(guildId, 'ticketLogChannelId', channel.id);
            await interaction.editReply(`✅ Ticket log channel has been set to **${channel.name}**.`);
        }
        else if (subcommand === 'role') { /* ... unchanged ... */ }
        else if (subcommand === 'message') { /* ... unchanged ... */ }

        // To save space, the unchanged subcommands are commented out.
        // Your file should have the full code for them.
    },
};
