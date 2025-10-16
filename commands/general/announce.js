const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an announcement embed to a channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
<<<<<<< HEAD
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("Channel to send the announcement in")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Main announcement message")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("title")
        .setDescription("Title of the announcement")
        .setRequired(false))
    .addStringOption(option =>
=======
    // ✅ MOVED THE REQUIRED 'MESSAGE' OPTION TO THE TOP
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Main announcement message")
        .setRequired(true)) // This is the required option
    .addStringOption(option =>
      option.setName("title")
        .setDescription("Title of the announcement")
        .setRequired(false))
    .addStringOption(option =>
>>>>>>> ad6d358d0a86469eefd2e1be0de22b7f61a0a06b
      option.setName("color")
        .setDescription("Embed color in HEX (example: #ff0000)")
        .setRequired(false))
    .addStringOption(option =>
      option.setName("image")
        .setDescription("Image URL to display in the embed")
        .setRequired(false)),  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const message = interaction.options.getString("message");
    const title = interaction.options.getString("title") || "📢 Announcement";
    const color = interaction.options.getString("color") || "#ff0000";
    const image = interaction.options.getString("image");

    // Validate channel permissions
    if (!channel.permissionsFor(interaction.guild.members.me).has(["SendMessages", "ViewChannel"])) {
      return interaction.reply({
        content: "❌ I don't have permission to send messages in that channel!",
        ephemeral: true
      });
    }

    try {
      // Create Embed
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(color)
        .setFooter({ 
          text: `Announcement by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();

      if (image) {
        try {
          embed.setImage(image);
        } catch (error) {
          return interaction.reply({
            content: "❌ The provided image URL is invalid!",
            ephemeral: true
          });
        }
      }

      // Send the announcement
      await channel.send({ embeds: [embed] });

      // Confirm to the user
      await interaction.reply({
        content: `✅ Announcement sent successfully in ${channel}!`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error sending announcement:', error);
      await interaction.reply({
        content: "❌ Failed to send the announcement. Please check my permissions and try again.",
        ephemeral: true
      });
    }
  }
};
