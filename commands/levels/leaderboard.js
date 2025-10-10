const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Level = require("../../models/Level");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Shows the top ranked members of the server."),

  async execute(interaction) {
    const top = await Level.find({ guildId: interaction.guild.id })
      .sort({ level: -1, xp: -1 })
      .limit(10);

    const desc = await Promise.all(top.map(async (u, i) => {
      const user = await interaction.client.users.fetch(u.userId).catch(() => null);
      return `**#${i + 1}** — ${user ? user.username : "Unknown"} | Level **${u.level}**, XP **${u.xp}**`;
    }));

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${interaction.guild.name} Leaderboard`)
      .setDescription(desc.join("\n"))
      .setColor("#FF4D4D")
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
