const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getConfig, setConfig } = require('../../configManager'); // Adjust path if needed

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-reaction-role')
        .setDescription('Create a reaction role panel in a single command.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where the panel will be created.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the embed.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the embed.')
                .setRequired(true))
        // Role + Emoji Options
        .addRoleOption(option =>
            option.setName('role1')
                .setDescription('Role to assign')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji1')
                .setDescription('Emoji for the role')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role2')
                .setDescription('Optional second role'))
        .addStringOption(option =>
            option.setName('emoji2')
                .setDescription('Emoji for the second role'))
        .addRoleOption(option =>
            option.setName('role3')
                .setDescription('Optional third role'))
        .addStringOption(option =>
            option.setName('emoji3')
                .setDescription('Emoji for the third role')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const channel = interaction.options.getChannel('channel');
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');

            const roleEmojiPairs = [];
            const descriptionLines = [description, '\n'];

            // Collect up to 3 roles and emojis
            for (let i = 1; i <= 3; i++) {
                const role = interaction.options.getRole(`role${i}`);
                const emoji = interaction.options.getString(`emoji${i}`);
                if (role && emoji) {
                    roleEmojiPairs.push({ role, emoji });
                    descriptionLines.push(`${emoji} - <@&${role.id}>`);
                }
            }

            if (roleEmojiPairs.length === 0) {
                return interaction.editReply({ content: '❌ You must provide at least one role and emoji.' });
            }

            // Create the embed
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(descriptionLines.join('\n'))
                .setColor(0x5865F2);

            // Send the panel
            const panelMessage = await channel.send({ embeds: [embed] });

            // React to the message
            for (const pair of roleEmojiPairs) {
                await panelMessage.react(pair.emoji);
            }

            // Save reaction roles in DB
            const guildId = interaction.guild.id;
            const config = await getConfig(guildId);
            if (!config.reactionRoles) config.reactionRoles = {};

            const newReactionRoles = {};
            for (const pair of roleEmojiPairs) {
                newReactionRoles[pair.emoji] = pair.role.id;
            }

            config.reactionRoles[panelMessage.id] = newReactionRoles;
            await setConfig(guildId, 'reactionRoles', config.reactionRoles);

            await interaction.editReply({ content: `✅ Reaction role panel created in ${channel}!` });
        } catch (err) {
            console.error('Error executing setup-reaction-role', err);
            if (!interaction.replied) {
                await interaction.editReply({ content: '❌ Something went wrong.' });
            }
        }
    },
};
