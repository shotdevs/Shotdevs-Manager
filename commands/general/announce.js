const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const {
    container,
    section,
    separator,
    sendComponentsV2Message
} = require('../../utils/componentsV2Builder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an announcement embed to a channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
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
      option.setName("image")
        .setDescription("Image URL to display in the embed")
        .setRequired(false)),
  
  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const message = interaction.options.getString("message");
    const title = interaction.options.getString("title") || "📢 Announcement";
    const image = interaction.options.getString("image");

    // Validate channel permissions
    if (!channel.permissionsFor(interaction.guild.members.me).has(["SendMessages", "ViewChannel"])) {
      return interaction.reply({
        content: "❌ I don't have permission to send messages in that channel!",
        ephemeral: true
      });
    }

    try {
      // Build announcement container
      const components = [
        section({
          content: `# ${title}`
        }),
        separator(),
        section({
          content: message
        })
      ];

      // Add image if provided
      if (image) {
        components.push(separator());
        components.push(section({
          content: `![Image](${image})`
        }));
      }

      // Add footer
      components.push(separator());
      components.push(section({
        content: `**Announcement by:** ${interaction.user.tag}`
      }));

      // Send the announcement with Components V2
      await sendComponentsV2Message(interaction.client, channel.id, {
        components: [
          container({
            components: components
          })
        ]
      });

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
