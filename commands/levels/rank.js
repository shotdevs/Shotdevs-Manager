const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { RankCardBuilder, Font } = require('canvacord');
const Level = require('../../models/Level');

const { createCanvas, loadImage, registerFont } = require('canvas');

// Optional: register fonts if you uploaded .ttf into fonts/ folder
// registerFont('./fonts/Inter-Regular.ttf', { family: 'Inter' });
// registerFont('./fonts/Inter-Bold.ttf', { family: 'Inter', weight: 'bold' });

/** roundedRect helper for Node Canvas */
function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("View your rank or another user's rank card.")
    .addUserOption(opt => opt.setName('target').setDescription('Select a user to view their rank').setRequired(false)),

  async execute(interaction) {
    try {
      // Safe defer
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }

      if (Font && typeof Font.loadDefault === 'function') Font.loadDefault();

      const target = interaction.options.getUser('target') || interaction.user;
      let member = null;
      try { member = await interaction.guild.members.fetch(target.id); } catch {}

      // DB
      const memberData = await Level.findOne({ guildId: interaction.guild.id, userId: target.id });
      const currentXP = Number(memberData?.xp) || 0;
      const currentLevel = Number(memberData?.level) || 0;

      const allMembers = await Level.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 });
      let userRank = allMembers.findIndex(m => String(m.userId) === String(target.id)) + 1;
      if (!userRank || userRank <= 0) userRank = allMembers.length + (memberData ? 0 : 1);

      const nextLevelXP = Number((currentLevel + 1) * 100) || 100;
      const percent = Math.max(0, Math.min(1, currentXP / nextLevelXP));

      // --- Build minimal canvacord image: only avatar + background (suppress default UI) ---
      const rankCard = new RankCardBuilder()
        .setAvatar(target.displayAvatarURL({ extension: 'png' }))
        .setBackground('https://iili.io/KNehlZ7.png')
        .setOverlay(0)
        // Neutralize canvacord text/UI
        .setCurrentXP(0)
        .setRequiredXP(1)
        .setLevel(0)
        .setRank(0)
        .setDisplayName(' ')
        .setStatus('invisible');

      const cardBuffer = await rankCard.build({ format: 'png' });

      // --- Canvas post-process (high-quality) ---
      const baseImg = await loadImage(cardBuffer);
      const WIDTH = baseImg.width || 1200;
      const HEIGHT = baseImg.height || 360;
      const canvas = createCanvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext('2d');

      // Draw base
      ctx.drawImage(baseImg, 0, 0, WIDTH, HEIGHT);

      // Config positions (tweak these if needed)
      const avatarSize = Math.round(Math.min(WIDTH, HEIGHT) * 0.28); // ~28%
      const avatarX = 44;
      const avatarY = Math.round((HEIGHT - avatarSize) / 2) - 6;

      // Avatar (load)
      const avatarImg = await loadImage(target.displayAvatarURL({ extension: 'png', size: 512 }));

      // Draw avatar shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 10, 0, Math.PI * 2);
      ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.0)';
      ctx.fill();
      ctx.restore();

      // Outer white ring
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Neon halo
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 4.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,230,255,0.12)';
      ctx.fill();

      // Clip and draw avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // --- Username ---
      const nameX = avatarX + avatarSize + 40;
      const nameY = avatarY - 6;
      // font sizes - change if you registered fonts
      ctx.font = `${Math.round(HEIGHT * 0.12)}px Inter, sans-serif`; // responsive size
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 8;
      // Ensure the font size is reasonable
      // Fallback if font string becomes too large
      try {
        ctx.fillText(target.username, nameX, nameY);
      } catch {
        ctx.font = '36px Inter, sans-serif';
        ctx.fillText(target.username, nameX, nameY);
      }
      ctx.shadowBlur = 0;

      // --- Progress bar ---
      const barW = Math.round(WIDTH * 0.55);
      const barH = Math.max(18, Math.round(HEIGHT * 0.08));
      const barX = nameX;
      const barY = nameY + 58;

      // Track
      ctx.beginPath();
      roundedRect(ctx, barX, barY, barW, barH, barH / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();

      // Fill (gradient)
      const fillW = Math.max(6, Math.round(barW * percent));
      const grad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      grad.addColorStop(0, '#00E5FF');
      grad.addColorStop(1, '#FF4D4D');

      ctx.beginPath();
      roundedRect(ctx, barX, barY, fillW, barH, barH / 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Gloss highlight on filled area
      ctx.globalAlpha = 0.14;
      roundedRect(ctx, barX, barY + 4, fillW, Math.max(4, Math.round(barH * 0.25)), (Math.max(4, Math.round(barH * 0.25))) / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.globalAlpha = 1;

      // Percent text on top-right of bar
      ctx.font = `${Math.round(barH * 0.7)}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      const pctText = `${Math.floor(percent * 100)}%`;
      const pctW = ctx.measureText(pctText).width;
      ctx.fillText(pctText, barX + barW - pctW - 8, barY - 10);

      // --- Bottom stats (LEVEL / XP / RANK) ---
      const statsY = barY + barH + 46;
      ctx.font = `${Math.round(barH * 0.7)}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText('LEVEL', nameX, statsY);
      ctx.fillText('XP', nameX + 180, statsY);
      ctx.fillText('RANK', nameX + 360, statsY);

      ctx.font = `${Math.round(barH * 1.1)}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(currentLevel), nameX, statsY + 26);
      ctx.fillText(`${currentXP}/${nextLevelXP}`, nameX + 180, statsY + 26);
      ctx.fillText(`#${userRank}`, nameX + 360, statsY + 26);

      // Finalize buffer and send
      const finalBuffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(finalBuffer, { name: 'rank.png' });

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ files: [attachment] });
      } else {
        await interaction.reply({ files: [attachment] });
      }

    } catch (err) {
      console.error('Rank command error:', err);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: '❌ Error generating rank card.', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ Error generating rank card.', ephemeral: true });
        }
      } catch (replyErr) {
        console.error('Failed to notify user of error:', replyErr);
      }
    }
  },
};
