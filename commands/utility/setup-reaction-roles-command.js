const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

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
                .setDescription('Emoji for the third role'))
}