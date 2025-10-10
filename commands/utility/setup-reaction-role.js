const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getConfig, setConfig } = require('../../configManager'); // Adjust path if needed

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-reaction-role')
        .setDescription('Creates a complete reaction role panel in a single command.')
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
                .setDescription('The text description inside the embed.')
                .setRequired(true))
        // Pair 1
        .addRoleOption(option => option.setName('role1').setDescription('The first role to assign.').setRequired(true))
        .addStringOption(option => option.setName('emoji1').setDescription('The emoji for the first role.').setRequired(true))
        // Pair 2 (Optional)
        .addRoleOption(option => option.setName('role2').setDescription('The second role to assign.'))
        .addStringOption(option => option.setName('emoji2').setDescription('The emoji for the second role.'))
        // Pair 3 (Optional)
        .addRoleOption(option => option.setName('role3').setDescription('The third role to assign.'))
        .addStringOption(option => option.setName('emoji3').setDescription('The emoji for the third role.'))
        // Add more pairs if you need them...
    ,

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        
        const roleEmojiPairs = [];
        const descriptionLines = [description, '\n']; // Start with the main description
        
        // Loop through up to 5 potential pairs
        for (let i = 1; i <= 5; i++) {
            const role = interaction.options.getRole(`role${i}`);
            const emoji = interaction.options.getString(`emoji${i}`);

            if (role && emoji) {
                roleEmojiPairs.push({ role, emoji });
                descriptionLines.push(`${emoji} - <@&${role.id}>`);
            }
        }
        
        if (roleEmojiPairs.length === 0) {
            return interaction.editReply({ content: '❌ You must provide at least one role and emoji pair.' });
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(descriptionLines.join('\n'))
            .setColor(0x5865F2); // Discord Blurple

        const panelMessage = await channel.send({ embeds: [embed] });

        // Add the reactions to the message
        try {
            for (const pair of roleEmojiPairs) {
                await panelMessage.react(pair.emoji);
            }
        } catch (error) {
            console.error("Failed to add reactions:", error);
            return interaction.editReply({ content: '❌ One of the emojis was invalid. Please use a standard emoji or one from a server I am in.' });
        }

        // Save the configuration
        const guildId = interaction.guild.id;
        const config = await getConfig(guildId);
        if (!config.reactionRoles) {
            config.reactionRoles = {};
        }

        const newReactionRoleData = {};
        for (const pair of roleEmojiPairs) {
            newReactionRoleData[pair.emoji] = pair.role.id;
        }
        
        config.reactionRoles[panelMessage.id] = newReactionRoleData;
        await setConfig(guildId, 'reactionRoles', config.reactionRoles);

        await interaction.editReply({ content: `✅ Reaction role panel created successfully in ${channel}!` });
    },
};
