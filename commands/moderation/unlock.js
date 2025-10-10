const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Unlocks the current channel so members can chat again.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    const channel = interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: true,
    });

    await interaction.reply(`🔓 ${channel} has been unlocked!`);
  },
};
