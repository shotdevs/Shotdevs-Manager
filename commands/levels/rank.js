const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { Rank } = require("canvacord");
const Level = require("../../models/Level");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your or another user's rank card.")
    .addUserOption(opt => opt.setName("user").setDescription("User to view").setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const guildId = interaction.guild.id;

    const userData = await Level.findOne({ guildId, userId: user.id });
    if (!userData) return interaction.reply({ content: "❌ No level data found for this user.", ephemeral: true });

    const allUsers = await Level.find({ guildId }).sort({ level: -1, xp: -1 });
    const rank = allUsers.findIndex(u => u.userId === user.id) + 1;

    const requiredXP = 5 * (userData.level ** 2) + 50 * userData.level + 100;
    const background = userData.background || "https://i.imgur.com/FzK4eED.png";

    const card = new Rank()
      .setAvatar(user.displayAvatarURL({ extension: "png", size: 512 }))
      .setUsername(user.username)
      .setDiscriminator(user.discriminator)
      .setCurrentXP(userData.xp)
      .setRequiredXP(requiredXP)
      .setLevel(userData.level)
      .setRank(rank)
      .setBackground("IMAGE", background)
      .setProgressBar("#FF4D4D", "COLOR")
      .setOverlay("#000000", 0.4)
      .setStatus(interaction.member?.presence?.status || "online");

    const img = await card.build();
    const attachment = new AttachmentBuilder(img, { name: "rank.png" });

    interaction.reply({ files: [attachment] });
  }
};
