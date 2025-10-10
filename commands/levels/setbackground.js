const { SlashCommandBuilder } = require("discord.js");
const Level = require("../../models/Level");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setbackground")
    .setDescription("Set your custom rank card background image.")
    .addStringOption(opt =>
      opt.setName("url")
        .setDescription("Enter a valid image URL (jpg/png)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString("url");
    if (!url.match(/\.(jpeg|jpg|png|gif)$/i))
      return interaction.reply({ content: "❌ Please provide a valid image URL (jpg/png/gif).", ephemeral: true });

    let user = await Level.findOne({ guildId: interaction.guild.id, userId: interaction.user.id });
    if (!user) user = new Level({ guildId: interaction.guild.id, userId: interaction.user.id });

    user.background = url;
    await user.save();

    interaction.reply({ content: `✅ Your background has been updated!`, ephemeral: true });
  }
};
