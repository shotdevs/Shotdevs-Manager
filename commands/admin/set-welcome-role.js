const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-welcome-role')
        .setDescription('Sets the role to be automatically given to new members.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option =>
            option.setName('role').setDescription('The role to assign').setRequired(true)),
    async execute(interaction) {
        const role = interaction.options.getRole('role');
        await setConfig(interaction.guild.id, 'welcomeRoleId', role.id);
        await interaction.reply({ content: `✅ Welcome role set to **${role.name}**.`, flags: [ 'Ephemeral' ] });
    },
};
