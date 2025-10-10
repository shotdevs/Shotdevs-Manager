const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { saveReactionRolePanel } = require('../../configManager'); // adjust path if needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-reaction-role')
    .setDescription('Create a reaction role panel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addChannelOption(option =>
      option.setName('channel')
            .setDescription('Channel where the panel will be created')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true))
    .addStringOption(option =>
      option.setName('title')
            .setDescription('Embed title')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
            .setDescription('Embed description')
            .setRequired(true))
    // Pair 1
    .addRoleOption(option =>
      option.setName('role1')
            .setDescription('Select the first role')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('emoji1')
            .setDescription('Emoji for the first role')
            .setRequired(true))
    // Pair 2
    .addRoleOption(option =>
      option.setName('role2')
            .setDescription('Select the second role'))
    .addStringOption(option =>
      option.setName('emoji2')
            .setDescription('Emoji for the second role'))
    // Pair 3
    .addRoleOption(option =>
      option.setName('role3')
            .setDescription('Select the third role'))
    .addStringOption(option =>
      option.setName('emoji3')
            .setDescription('Emoji for the third role'))
    // Pair 4
    .addRoleOption(option =>
      option.setName('role4')
            .setDescription('Select the fourth role'))
    .addStringOption(option =>
      option.setName('emoji4')
            .setDescription('Emoji for the fourth role'))
    // Pair 5
    .addRoleOption(option =>
      option.setName('role5')
            .setDescription('Select the fifth role'))
    .addStringOption(option =>
      option.setName('emoji5')
            .setDescription('Emoji for the fifth role')),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');

    const roleEmojiPairs = [];
    const embedDescription = [description, '']; // Start with description

    // Loop through 5 possible pairs
    for (let i = 1; i <= 5; i++) {
      const role = interaction.options.getRole(`role${i}`);
      const emoji = interaction.options.getString(`emoji${i}`);
      if (role && emoji) {
        roleEmojiPairs.push({ role, emoji });
        embedDescription.push(`${emoji} → <@&${role.id}>`);
      }
    }

    if (roleEmojiPairs.length === 0)
      return interaction.editReply('❌ You must provide at least one role and emoji pair.');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(embedDescription.join('\n'))
      .setColor('Blurple');

    // Send the panel message
    const panelMessage = await channel.send({ embeds: [embed] });

    // React with emojis
    for (const pair of roleEmojiPairs) {
      try {
        await panelMessage.react(pair.emoji);
      } catch (err) {
        console.error(`Failed to react with ${pair.emoji}:`, err);
      }
    }

    // Save to database
    const roleMap = {};
    roleEmojiPairs.forEach(pair => {
      roleMap[pair.emoji] = pair.role.id;
    });

    await saveReactionRolePanel(interaction.guild.id, panelMessage.id, roleMap);

    await interaction.editReply(`✅ Reaction role panel created successfully in ${channel}.`);
  },
};
