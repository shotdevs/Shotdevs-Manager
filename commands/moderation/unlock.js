const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
    container,
    section,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

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

    await replyComponentsV2(interaction, {
        components: [
            container({
                components: [
                    section({
                        content: `🔓 ${channel} has been unlocked!`
                    })
                ]
            })
        ]
    });
  },
};
