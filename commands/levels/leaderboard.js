const { SlashCommandBuilder } = require("discord.js");
const Level = require("../../models/Level");
const {
    container,
    section,
    separator,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Shows the top ranked members of the server.")
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('Page number to view')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Pagination: 10 users per page
    const page = interaction.options.getInteger('page') || 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    const total = await Level.countDocuments({ guildId: interaction.guild.id });
    const totalPages = Math.ceil(total / pageSize);

    const top = await Level.find({ guildId: interaction.guild.id })
      .sort({ level: -1, xp: -1 })
      .skip(skip)
      .limit(pageSize);

    const desc = await Promise.all(top.map(async (u, i) => {
      const user = await interaction.client.users.fetch(u.userId).catch(() => null);
      return `**#${skip + i + 1}** — ${user ? user.username : "Unknown"} | Level **${u.level}**, XP **${u.xp}**`;
    }));

    await replyComponentsV2(interaction, {
      components: [
        container({
          components: [
            section({
              content: `# 🏆 ${interaction.guild.name} Leaderboard`
            }),
            separator(),
            section({
              content: desc.join("\n") || 'No users found.'
            }),
            separator(),
            section({
              content: `**Page ${page} of ${totalPages}**`
            })
          ]
        })
      ]
    });
  }
};
