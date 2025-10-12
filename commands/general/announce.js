const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement embed to a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Main announcement text')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Optional embed title')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('color')
        .setDescription('Optional hex color like #ff0000')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('image')
        .setDescription('Optional image URL')
        .setRequired(false)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Optional target channel')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),

  async execute(interaction) {
    const announcementMessage = interaction.options.getString('message');
    const title = interaction.options.getString('title');
    const colorInput = interaction.options.getString('color');
    const imageUrl = interaction.options.getString('image');
    const targetChannelOption = interaction.options.getChannel('channel');

    const parsedHex = (value) => {
      if (!value) return '#ff0000';
      const match = value.match(/^#?[0-9a-fA-F]{6}$/);
      if (!match) return '#ff0000';
      return value.startsWith('#') ? value : `#${value}`;
    };

    const chosenColor = parsedHex(colorInput);

    const embed = new EmbedBuilder()
      .setColor(chosenColor)
      .setDescription(announcementMessage)
      .setFooter({ text: `📢 Announcement by ${interaction.user.username}` });

    if (title) {
      embed.setTitle(title);
    }

    if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
      embed.setImage(imageUrl);
    }

    const channelToSend = targetChannelOption ?? interaction.channel;

    try {
      await channelToSend.send({ embeds: [embed] });
      await interaction.reply({ content: '✅ Announcement sent successfully!', ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: '❌ I could not send the announcement. Please check my permissions and the target channel.', ephemeral: true });
    }
  },
};
