const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { RankCardBuilder, Font } = require('canvacord');
const Level = require('../../models/Level');

const {
  createCanvas,
  loadImage,
  registerFont
} = require('canvas');

// OPTIONAL: add custom fonts (recommended for cleaner UI)
// registerFont('./fonts/Inter-Regular.ttf', { family: 'Inter' });
// registerFont('./fonts/Inter-Bold.ttf', { family: 'Inter', weight: 'bold' });

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("View your rank or another user's rank card.")
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Select a user to view their rank')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      // safe defer
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }

      // load canvacord fonts
      if (Font && typeof Font.loadDefault === "function") {
        Font.loadDefault();
      }

      const target = interaction.options.getUser('target') || interaction.user;
      let member = null;
      try { member = await interaction.guild.members.fetch(target.id); } catch {}

      // DB fetch
      const userData = await Level.findOne({ guildId: interaction.guild.id, userId: target.id });
      const xp = Number(userData?.xp) || 0;
      const lvl = Number(userData?.level) || 0;

      const allMembers = await Level
        .find({ guildId: interaction.guild.id })
        .sort({ level: -1, xp: -1 });

      let rank = allMembers.findIndex(u => String(u.userId) === String(target.id)) + 1;
      if (rank <= 0) rank = allMembers.length + 1;

      const nextXP = (lvl + 1) * 100;
      const percent = Math.min(1, xp / nextXP);

      // First build the canvacord base
      const rankCard = new RankCardBuilder()
        .setAvatar(target.displayAvatarURL({ extension: 'png' }))
        .setCurrentXP(xp)
        .setLevel(lvl)
        .setRank(rank)
        .setRequiredXP(nextXP)
        .setDisplayName(target.username)
        .setStatus(member?.presence?.status || "offline")
        .setBackground("https://iili.io/KNehlZ7.png") // your company theme
        .setOverlay(0);

      const baseBuffer = await rankCard.build({ format: "png" });

      // -----------------------------
      // 🔥 POST-PROCESS UI UPGRADE
      // -----------------------------
      const base = await loadImage(baseBuffer);

      const WIDTH = base.width;
      const HEIGHT = base.height;

      const canvas = createCanvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext("2d");

      // Draw base
      ctx.drawImage(base, 0, 0, WIDTH, HEIGHT);

      // Avatar & halo
      const avatarSize = 180;
      const avatarX = 60;
      const avatarY = 90;

      const avatarImg = await loadImage(target.displayAvatarURL({ extension: 'png', size: 512 }));

      // Shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 10, 0, Math.PI * 2);
      ctx.closePath();
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 25;
      ctx.fill();
      ctx.restore();

      // Outer ring
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Neon halo
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,230,255,0.12)";
      ctx.fill();

      // Avatar clip & draw
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Username
      ctx.font = '38px "Inter", sans-serif';
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 8;
      const nameX = avatarX + avatarSize + 40;
      const nameY = avatarY - 10;
      ctx.fillText(target.username, nameX, nameY);
      ctx.shadowBlur = 0;

      // XP Progress bar
      const barW = 580;
      const barH = 30;
      const barX = nameX;
      const barY = nameY + 58;

      // Track
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, barH / 2);
      ctx.fill();

      // Fill gradient
      const fillW = Math.max(10, Math.floor(barW * percent));
      const grad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      grad.addColorStop(0, "#00E5FF");
      grad.addColorStop(1, "#FF4D4D");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, barH / 2);
      ctx.fill();

      // Gloss
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(barX, barY + 4, fillW, 6);
      ctx.globalAlpha = 1;

      // Percent text
      ctx.font = '22px "Inter", sans-serif';
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${Math.floor(percent * 100)}%`, barX + barW - 65, barY - 10);

      // Stats: Level, XP, Rank
      const bottomY = barY + 65;

      ctx.font = '18px "Inter", sans-serif';
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("LEVEL", nameX, bottomY);
      ctx.fillText("XP", nameX + 180, bottomY);
      ctx.fillText("RANK", nameX + 360, bottomY);

      ctx.font = '24px "Inter", sans-serif';
      ctx.fillStyle = "#ffffff";
      ctx.fillText(String(lvl), nameX, bottomY + 26);
      ctx.fillText(`${xp}/${nextXP}`, nameX + 180, bottomY + 26);
      ctx.fillText(`#${rank}`, nameX + 360, bottomY + 26);

      // Final PNG
      const finalBuffer = canvas.toBuffer("image/png");
      const attachment = new AttachmentBuilder(finalBuffer, { name: "rank.png" });

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ files: [attachment] });
      } else {
        await interaction.reply({ files: [attachment] });
      }

    } catch (err) {
      console.error(err);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: "❌ Error generating rank card.", ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ Error generating rank card.", ephemeral: true });
      }
    }
  }
};
