const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig, getConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Configure an automatic role to give new members when they join.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName('set')
            .setDescription('Set the role to be given automatically to new members')
            .addRoleOption(opt => opt.setName('role').setDescription('Role to assign')))
        .addSubcommand(sub => sub
            .setName('clear')
            .setDescription('Clear the autorole setting'))
        .addSubcommand(sub => sub
            .setName('view')
            .setDescription('View the current autorole setting')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'set') {
            const role = interaction.options.getRole('role');
            if (!role) return interaction.reply({ content: 'Please provide a valid role.', ephemeral: true });
            await setConfig(guildId, 'welcomeRoleId', role.id);
            return interaction.reply({ content: `✅ Autorole set to ${role.name}`, ephemeral: true });
        }

        if (sub === 'clear') {
            await setConfig(guildId, 'welcomeRoleId', null);
            return interaction.reply({ content: '✅ Autorole cleared.', ephemeral: true });
        }

        if (sub === 'view') {
            const config = await getConfig(guildId);
            const roleId = config.welcomeRoleId;
            if (!roleId) return interaction.reply({ content: 'No autorole is set for this server.', ephemeral: true });
            const role = interaction.guild.roles.cache.get(roleId);
            return interaction.reply({ content: `Autorole: ${role ? role.name : `Role ID ${roleId} (not found)`}`, ephemeral: true });
        }

        return interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
    }
};
