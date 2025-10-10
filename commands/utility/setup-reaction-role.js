const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const {
  saveReactionRolePanel,
  deleteReactionRolePanel,
  listReactionRolePanels,
} = require('../../configManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reaction')
    .setDescription('Manage reaction role panels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a new reaction role panel')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Where to post the panel').setRequired(true))
        .addStringOption(opt =>
          opt.setName('title').setDescription('Panel title').setRequired(true))
        .addStringOption(opt =>
          opt.setName('emoji_role_pairs').setDescription('Format: 😀=@Role, 😎=@Role2').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Delete a reaction role panel')
        .addStringOption(opt =>
          opt.setName('message_id').setDescription('Message ID to delete').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all reaction role panels')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title');
      const input = interaction.options.getString('emoji_role_pairs');

      const pairs = input.split(',').map(s => s.trim());
      const roleMap = {};
      let description = '';

      for (const pair of pairs) {
        const [emoji, roleMention] = pair.split('=');
        const roleId = roleMention.replace(/[<@&>]/g, '');
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) continue;
        roleMap[emoji.trim()] = role.id;
        description += `${emoji.trim()} → ${role}\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description || 'No roles configured')
        .setColor('Blurple');

      const msg = await channel.send({ embeds: [embed] });

      for (const emoji of Object.keys(roleMap)) {
        await msg.react(emoji).catch(() => {});
      }

      await saveReactionRolePanel(interaction.guild.id, msg.id, roleMap);

      return interaction.reply({
        content: `✅ Reaction role panel created in ${channel}.`,
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const messageId = interaction.options.getString('message_id');
      await deleteReactionRolePanel(interaction.guild.id, messageId);
      return interaction.reply({ content: `🗑️ Panel \`${messageId}\` removed.`, ephemeral: true });
    }

    if (sub === 'list') {
      const panels = await listReactionRolePanels(interaction.guild.id);
      if (panels.length === 0) return interaction.reply({ content: 'No panels found.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('📋 Reaction Role Panels')
        .setColor('Green');

      for (const [messageId, roles] of panels) {
        embed.addFields({
          name: `Message ID: ${messageId}`,
          value: Object.entries(roles).map(([e, r]) => `${e} → <@&${r}>`).join('\n'),
          inline: false
        });
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
