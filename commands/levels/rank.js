// commands/levels/rank.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const Level = require('../../models/Level');

// OPTIONAL: register your preferred fonts (place the ttf files in a fonts/ folder)
// registerFont('./fonts/Inter-Regular.ttf', { family: 'Inter' });
// registerFont('./fonts/Inter-Bold.ttf', { family: 'Inter', weight: 'bold' });

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("View your rank or another user's rank card.")
    .addUserOption(option =>
      option.setName('target').setDescription('Select a user to view their rank').setRequired(false)
    ),

  async execute(interaction) {
    try {
      // Safe defer
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }

      const target = interaction.options.getUser('target') || interaction.user;
      let member = null;
      try { member = await interaction.guild.members.fetch(target.id); } catch { member = null; }

      const memberData = await Level.findOne({ guildId: interaction.guild.id, userId: target.id });
      const currentXP = Number(memberData?.xp) || 0;
      const currentLevel = Number(memberData?.level) || 0;

      const allMembers = await Level.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 });
      let userRank = allMembers.findIndex(m => String(m.userId) === String(target.id)) + 1;
      if (!userRank || userRank <= 0) userRank = allMembers.length + (memberData ? 0 : 1);

      const nextLevelXP = Number((currentLevel + 1) * 100) || 100;
      const percent = Math.max(0, Math.min(1, currentXP / nextLevelXP)); // 0..1

      // Canvas size - wide card
      const WIDTH = 1200;
      const HEIGHT = 360;
      const canvas = createCanvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext('2d');

      // --- Background (your company/theme background) ---
      // keep your existing background image URL
      const backgroundUrl = 'https://iili.io/KNehlZ7.png'; // your background
      const bg = await loadImage(backgroundUrl);
      // draw bg to fill (cover)
      const bgRatio = bg.width / bg.height;
      const canvasRatio = WIDTH / HEIGHT;
      if (bgRatio > canvasRatio) {
        // bg is wider — crop sides
        const scale = HEIGHT / bg.height;
        const newW = bg.width * scale;
        const xOff = (newW - WIDTH) / -2;
        ctx.drawImage(bg, xOff, 0, newW, HEIGHT);
      } else {
        // bg is taller — crop top/bottom
        const scale = WIDTH / bg.width;
        const newH = bg.height * scale;
        const yOff = (newH - HEIGHT) / -2;
        ctx.drawImage(bg, 0, yOff, WIDTH, newH);
      }

      // --- subtle full-card vignette (keeps background but focuses center-left) ---
      const vignette = ctx.createLinearGradient(WIDTH * 0.25, 0, WIDTH * 0.75, 0);
      // darken mid-right slightly to keep logo bright but text readable
      vignette.addColorStop(0, 'rgba(0,0,0,0.45)'); // left (under text)
      vignette.addColorStop(0.6, 'rgba(0,0,0,0.15)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.0)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // --- left panel darkening specifically behind text (rounded) ---
      const overlayW = WIDTH * 0.66;
      const overlayH = HEIGHT * 0.7;
      const overlayX = 40;
      const overlayY = (HEIGHT - overlayH) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      // rounded rect helper
      const roundRect = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
      };
      roundRect(overlayX, overlayY, overlayW, overlayH, 20);

      // --- Avatar ---
      const avatarSize = 170;
      const avatarX = overlayX + 20;
      const avatarY = overlayY + 10;
      // draw avatar circle with shadow
      try {
        const avatarUrl = target.displayAvatarURL({ extension: 'png', size: 512 });
        const avatarImg = await loadImage(avatarUrl);

        // shadow
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
        ctx.closePath();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 16;
        ctx.fillStyle = 'rgba(0,0,0,0.0)';
        ctx.fill();
        ctx.restore();

        // ring (outer white)
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // inner neon halo (thin)
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,230,255,0.08)'; // cyan-ish halo
        ctx.fill();

        // avatar clip
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // draw avatar
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);

        // remove clip
        ctx.restore();
      } catch (e) {
        console.error('Failed to draw avatar', e);
      }

      // --- Username & Progress bar area ---
      const nameX = avatarX + avatarSize + 30;
      const nameY = avatarY + 30;
      // fonts (use system fallback if you didn't register fonts)
      ctx.font = '36px "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      // name with slight shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.fillText(target.username, nameX, nameY);
      ctx.shadowBlur = 0;

      // small discriminator could be drawn if wanted
      // progress bar position
      const progressW = overlayW - (nameX - overlayX) - 30;
      const progressH = 26;
      const progressX = nameX;
      const progressY = nameY + 56;

      // progress track (semi-transparent)
      ctx.beginPath();
      const r = progressH / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.roundRect
        ? ctx.roundRect(progressX, progressY, progressW, progressH, r) // if node-canvas supports roundRect
        : (() => {
            ctx.beginPath();
            ctx.moveTo(progressX + r, progressY);
            ctx.arcTo(progressX + progressW, progressY, progressX + progressW, progressY + progressH, r);
            ctx.arcTo(progressX + progressW, progressY + progressH, progressX, progressY + progressH, r);
            ctx.arcTo(progressX, progressY + progressH, progressX, progressY, r);
            ctx.arcTo(progressX, progressY, progressX + progressW, progressY, r);
            ctx.closePath();
          })();
      ctx.fill();

      // progress fill (gradient)
      const fillW = Math.max(6, Math.floor(progressW * percent));
      const grad = ctx.createLinearGradient(progressX, progressY, progressX + fillW, progressY);
      grad.addColorStop(0, '#00E5FF'); // cyan
      grad.addColorStop(1, '#FF4D4D'); // red-ish
      ctx.fillStyle = grad;
      // draw filled portion with rounded ends
      ctx.beginPath();
      const rx = progressH / 2;
      ctx.moveTo(progressX + rx, progressY);
      ctx.arcTo(progressX + fillW, progressY, progressX + fillW, progressY + progressH, rx);
      ctx.arcTo(progressX + fillW, progressY + progressH, progressX, progressY + progressH, rx);
      ctx.arcTo(progressX, progressY + progressH, progressX, progressY, rx);
      ctx.arcTo(progressX, progressY, progressX + fillW, progressY, rx);
      ctx.closePath();
      ctx.fill();

      // tiny top highlight (gloss)
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.moveTo(progressX + rx, progressY + 2);
      ctx.lineTo(progressX + fillW - 2, progressY + 2);
      ctx.quadraticCurveTo(progressX + fillW - 1, progressY + 2, progressX + fillW - 1, progressY + 4);
      ctx.lineTo(progressX + rx, progressY + 4);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.globalAlpha = 1;

      // percent text on right of bar
      ctx.font = '18px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      const percentText = `${Math.floor(percent * 100)}%`;
      const percentX = progressX + progressW - ctx.measureText(percentText).width;
      const percentY = progressY - 28;
      ctx.fillText(percentText, percentX, percentY);

      // --- bottom row: LEVEL | XP | RANK ---
      const bottomY = overlayY + overlayH - 70;
      const labelFont = '16px "Inter", sans-serif';
      const valueFont = '20px "Inter", sans-serif';
      const gap = 220;

      // LEVEL
      ctx.font = labelFont;
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillText('LEVEL', nameX, bottomY);
      ctx.font = valueFont;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(currentLevel), nameX, bottomY + 22);

      // XP
      ctx.font = labelFont;
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillText('XP', nameX + gap, bottomY);
      ctx.font = valueFont;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${currentXP}/${nextLevelXP}`, nameX + gap, bottomY + 22);

      // RANK
      ctx.font = labelFont;
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillText('RANK', nameX + gap * 2, bottomY);
      ctx.font = valueFont;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`#${userRank}`, nameX + gap * 2, bottomY + 22);

      // small branding (optional) - keep shotdevs logo on right but make sure it doesn't overlap text
      // (we already used the background image, so if the logo is part of the bg, it's kept)

      // Final buffer
      const finalBuffer = canvas.toBuffer('image/png');

      const attachment = new AttachmentBuilder(finalBuffer, { name: 'rank.png' });

      // reply/editReply depending on acknowledged state
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ files: [attachment] });
      } else {
        await interaction.reply({ files: [attachment] });
      }
    } catch (err) {
      console.error('Rank command error:', err);
      // use followUp if ack'd
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: '❌ An error occurred while generating the rank card.', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ An error occurred while generating the rank card.', ephemeral: true });
        }
      } catch (rErr) {
        console.error('Failed to send error notification', rErr);
      }
    }
  },
};
