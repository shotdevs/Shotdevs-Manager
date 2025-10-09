const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-support-role')
        .setDescription('Set the role that can manage tickets.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option => option.setName('support-role').setDescription('The support staff role').setRequired(true)),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const role = interaction.options.getRole('support-role');
        setConfig(guildId, 'staffRoleId', role.id);
        await interaction.reply({ content: `✅ Support staff role set to **${role.name}**.`, ephemeral: true });
    },
};
