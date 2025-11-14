const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
    container,
    section,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒 Locks the current channel so members cannot send messages.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    const channel = interaction.channel;

    // Check if already locked
    const everyoneRole = interaction.guild.roles.everyone;
    const currentPerm = channel.permissionOverwrites.cache.get(everyoneRole.id);

    if (currentPerm && currentPerm.deny.has('SendMessages')) {
      return interaction.reply({ content: '🔐 This channel is already locked.', ephemeral: true });
    }

    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
    });

    await replyComponentsV2(interaction, {
        components: [
            container({
                components: [
                    section({
                        content: `🔒 ${channel} has been locked!`
                    })
                ]
            })
        ]
    });
  },
};
