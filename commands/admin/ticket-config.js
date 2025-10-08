const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-config')
        .setDescription('Configure the ticket system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('category')
                .setDescription('Set the category where new tickets will be created.')
                .addChannelOption(option =>
                    option.setName('channel').setDescription('The category channel').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('role')
                .setDescription('Set the role that can manage tickets.')
                .addRoleOption(option =>
                    option.setName('support-role').setDescription('The support staff role').setRequired(true)))
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

        if (subcommand === 'category') {
            const category = interaction.options.getChannel('channel');
            setConfig(guildId, 'ticketCategoryId', category.id);
            await interaction.editReply(`✅ Ticket category set to **${category.name}**.`);
        } else if (subcommand === 'role') {
            const role = interaction.options.getRole('support-role');
            setConfig(guildId, 'staffRoleId', role.id);
            await interaction.editReply(`✅ Ticket support role set to **${role.name}**.`);
        } else if (subcommand === 'message') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            setConfig(guildId, 'ticketPanelTitle', title);
            setConfig(guildId, 'ticketPanelDescription', description);
            await interaction.editReply(`✅ Ticket panel message updated.`);
        }
    },
};
