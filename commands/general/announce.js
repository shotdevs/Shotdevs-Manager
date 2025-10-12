const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an announcement embed to a channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option.setName("title")
        .setDescription("Title of the announcement")
        .setRequired(false))
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Main announcement message")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("color")
        .setDescription("Embed color in HEX (example: #ff0000)")
        .setRequired(false))
    .addStringOption(option =>
      option.setName("image")
        .setDescription("Image URL to display in the embed")
        .setRequired(false))
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("Channel to send the announcement in")
        .setRequired(false)),
  
  async execute(interaction) {
    const title = interaction.options.getString("title") || "📢 Announcement";
    const message = interaction.options.getString("message");
    const color = interaction.options.getString("color") || "#ff0000";
    const image = interaction.options.getString("image");
    const channel = interaction.options.getChannel("channel") || interaction.channel;

    // Create Embed
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(color)
      .setFooter({ text: `Announcement by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    if (image) embed.setImage(image);

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      content: `✅ Announcement sent successfully in ${channel}!`,
      ephemeral: true
    });
  }
};
