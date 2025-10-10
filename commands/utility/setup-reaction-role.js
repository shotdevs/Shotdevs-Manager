const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { saveReactionRolePanel } = require('../../configManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-reaction-role')
    .setDescription('Create a reaction role panel in a single command.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addChannelOption(option => 
        option.setName('channel')
              .setDescription('The channel where the panel will be created.')
              .setRequired(true))
    .addStringOption(option => 
        option.setName('title')
              .setDescription('The title of the embed.')
              .setRequired(true))
    .addStringOption(option => 
        option.setName('description')
              .setDescription('The description inside the embed.')
              .setRequired(true))
    .addStringOption(option => 
        option.setName('pairs')
              .setDescription('Emoji=Role pairs, comma separated. Example: 😀=@Member,😎=@VIP')
              .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const pairsInput = interaction.options.getString('pairs');

    // Parse emoji=role pairs
    const pairsArray = pairsInput.split(',').map(p => p.trim());
    const roleMap = {};
    let embedDescription = description + '\n\n';

    for (const pair of pairsArray) {
      const [emoji, roleMention] = pair.split('=');
      if (!emoji || !roleMention) continue;

      const roleId = roleMention.replace(/[<@&>]/g, '');
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) continue;

      roleMap[emoji.trim()] = role.id;
      embedDescription += `${emoji.trim()} → <@&${role.id}>\n`;
    }

    if (Object.keys(roleMap).length === 0) {
      return interaction.editReply('❌ No valid emoji-role pairs found.');
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(embedDescription)
      .setColor('Blurple');

    // Send message and add reactions
    const panelMessage = await channel.send({ embeds: [embed] });
    for (const emoji of Object.keys(roleMap)) {
      try {
        await panelMessage.react(emoji);
      } catch (err) {
        console.error(`Failed to react with ${emoji}:`, err);
      }
    }

    // Save to MongoDB
    await saveReactionRolePanel(interaction.guild.id, panelMessage.id, roleMap);

    return interaction.editReply(`✅ Reaction role panel created successfully in ${channel}.`);
  },
};
