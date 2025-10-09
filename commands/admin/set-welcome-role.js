const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-welcome-role')
        .setDescription('Set the role to assign to new members.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option => option.setName('role').setDescription('The role to assign').setRequired(true)),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const role = interaction.options.getRole('role');
        setConfig(guildId, 'welcomeRoleId', role.id);
        await interaction.reply({ content: `✅ Welcome role set to **${role.name}**.`, ephemeral: true });
    },
};
