const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { RankCardBuilder, Font } = require('canvacord');
const Level = require('../../models/Level');
const Jimp = require('jimp'); // Pure JS image library (works on Termux)

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("View your rank or another user's rank card.")
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('Select a user to view their rank')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      // Safe defer
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }

      // Try load default fonts for canvacord (no-op if not available)
      if (Font && typeof Font.loadDefault === 'function') {
        Font.loadDefault();
      }

      const target = interaction.options.getUser('target') || interaction.user;
      let member = null;
      try { member = await interaction.guild.members.fetch(target.id); } catch {}

      // Fetch leveling data
      const memberData = await Level.findOne({ guildId: interaction.guild.id, userId: target.id });
      const currentXP = Number(memberData?.xp) || 0;
      const currentLevel = Number(memberData?.level) || 0;

      const allMembers = await Level.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 });
      let userRank = allMembers.findIndex(m => String(m.userId) === String(target.id)) + 1;
      if (!userRank || userRank <= 0) userRank = allMembers.length + (memberData ? 0 : 1);

      const nextLevelXP = Number((currentLevel + 1) * 100) || 100;
      const percent = Math.max(0, Math.min(1, currentXP / nextLevelXP));

      // Build a minimal canvacord image: only avatar + background, hide everything else
      const rankCard = new RankCardBuilder()
        .setAvatar(target.displayAvatarURL({ extension: 'png' }))
        .setBackground("https://iili.io/KNehlZ7.png") // your company background
        .setOverlay(0) // remove default grey overlay

        // Force disable drawing of default UI elements by providing neutral values
        .setCurrentXP(0)
        .setRequiredXP(1)
        .setLevel(0)
        .setRank(0)
        .setDisplayName(" ") // blank name so canvacord won't draw text
        .setStatus("invisible"); // hide status dot

      const cardBuffer = await rankCard.build({ format: 'png' });

      // ----------------------
      // JIMP POST-PROCESSING
      // ----------------------
      try {
        const base = await Jimp.read(cardBuffer);

        const WIDTH = base.getWidth();
        const HEIGHT = base.getHeight();

        // Avatar sizing & position (tweak if needed)
        const avatarSize = Math.round(Math.min(WIDTH, HEIGHT) * 0.28); // ~28% of smaller dimension
        const avatarX = 28; // left margin
        const avatarY = Math.round((HEIGHT - avatarSize) / 2) - 8; // vertically centered-ish

        // Load avatar and resize
        const avatarUrl = target.displayAvatarURL({ extension: 'png', size: 1024 });
        const avatarImg = await Jimp.read(avatarUrl);
        avatarImg.resize(avatarSize, avatarSize);

        // Create circular mask
        const mask = new Jimp(avatarSize, avatarSize, 0x00000000);
        const cx = avatarSize / 2;
        const cy = avatarSize / 2;
        const r = avatarSize / 2;
        mask.scan(0, 0, mask.bitmap.width, mask.bitmap.height, function (x, y, idx) {
          const dx = x - cx;
          const dy = y - cy;
          if (Math.sqrt(dx * dx + dy * dy) <= r) {
            mask.bitmap.data[idx + 3] = 255;
          }
        });
        avatarImg.mask(mask, 0, 0);

        // Outer white ring
        const ringSize = avatarSize + 16;
        const ring = new Jimp(ringSize, ringSize, 0x00000000);
        const ringCx = ring.bitmap.width / 2;
        const ringCy = ring.bitmap.height / 2;
        const outerR = ringSize / 2;
        const innerR = avatarSize / 2 + 3;
        ring.scan(0, 0, ring.bitmap.width, ring.bitmap.height, function (x, y, idx) {
          const dx = x - ringCx;
          const dy = y - ringCy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= outerR && dist >= innerR) {
            ring.bitmap.data[idx + 0] = 255;
            ring.bitmap.data[idx + 1] = 255;
            ring.bitmap.data[idx + 2] = 255;
            ring.bitmap.data[idx + 3] = 255;
          } else {
            ring.bitmap.data[idx + 3] = 0;
          }
        });

        // Halo (soft cyan glow)
        const halo = new Jimp(ring.bitmap.width, ring.bitmap.height, 0x00000000);
        halo.scan(0, 0, halo.bitmap.width, halo.bitmap.height, function (x, y, idx) {
          const dx = x - ringCx;
          const dy = y - ringCy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const haloOuter = outerR + 8;
          if (dist <= haloOuter) {
            const alpha = Math.max(0, Math.round((1 - (dist / haloOuter)) * 70)); // up to ~70 alpha
            halo.bitmap.data[idx + 0] = 0;
            halo.bitmap.data[idx + 1] = 230;
            halo.bitmap.data[idx + 2] = 255;
            halo.bitmap.data[idx + 3] = alpha;
          } else {
            halo.bitmap.data[idx + 3] = 0;
          }
        });

        // Composite halo -> ring -> avatar onto base
        const ringX = avatarX - 8;
        const ringY = avatarY - 8;
        await base.composite(halo, ringX, ringY, { mode: Jimp.BLEND_SOURCE_OVER, opacitySource: 0.28 });
        await base.composite(ring, ringX, ringY);
        await base.composite(avatarImg, avatarX, avatarY);

        // --- Progress Bar ---
        const progressW = Math.round(WIDTH * 0.55);
        const progressH = Math.round(HEIGHT * 0.08); // bar height
        const progressX = avatarX + avatarSize + 36;
        const progressY = avatarY + Math.round(avatarSize * 0.36);

        // Track (rounded approximation)
        const track = new Jimp(progressW, progressH, 0x00000000);
        track.scan(0, 0, track.bitmap.width, track.bitmap.height, function (x, y, idx) {
          const rx = progressH / 2;
          if (x < rx) {
            const dx = rx - x;
            const dy = Math.abs(y - progressH / 2);
            if (Math.sqrt(dx * dx + dy * dy) <= rx) {
              track.bitmap.data[idx + 0] = 255;
              track.bitmap.data[idx + 1] = 255;
              track.bitmap.data[idx + 2] = 255;
              track.bitmap.data[idx + 3] = Math.round(255 * 0.08);
            } else {
              track.bitmap.data[idx + 3] = 0;
            }
          } else if (x > track.bitmap.width - rx) {
            const dx = x - (track.bitmap.width - rx);
            const dy = Math.abs(y - progressH / 2);
            if (Math.sqrt(dx * dx + dy * dy) <= rx) {
              track.bitmap.data[idx + 0] = 255;
              track.bitmap.data[idx + 1] = 255;
              track.bitmap.data[idx + 2] = 255;
              track.bitmap.data[idx + 3] = Math.round(255 * 0.08);
            } else {
              track.bitmap.data[idx + 3] = 0;
            }
          } else {
            track.bitmap.data[idx + 0] = 255;
            track.bitmap.data[idx + 1] = 255;
            track.bitmap.data[idx + 2] = 255;
            track.bitmap.data[idx + 3] = Math.round(255 * 0.08);
          }
        });
        await base.composite(track, progressX, progressY);

        // Fill gradient (cyan -> red)
        const fillW = Math.max(8, Math.round(progressW * percent));
        const fill = new Jimp(fillW, progressH, 0x00000000);
        const leftColor = { r: 0, g: 229, b: 255 };
        const rightColor = { r: 255, g: 77, b: 77 };
        fill.scan(0, 0, fill.bitmap.width, fill.bitmap.height, function (x, y, idx) {
          const t = x / Math.max(1, fill.bitmap.width - 1);
          const rcol = Math.round(leftColor.r * (1 - t) + rightColor.r * t);
          const gcol = Math.round(leftColor.g * (1 - t) + rightColor.g * t);
          const bcol = Math.round(leftColor.b * (1 - t) + rightColor.b * t);
          const rx = progressH / 2;
          if (x < rx) {
            const dx = rx - x;
            const dy = Math.abs(y - progressH / 2);
            if (Math.sqrt(dx * dx + dy * dy) <= rx) {
              fill.bitmap.data[idx + 0] = rcol;
              fill.bitmap.data[idx + 1] = gcol;
              fill.bitmap.data[idx + 2] = bcol;
              fill.bitmap.data[idx + 3] = 255;
            } else {
              fill.bitmap.data[idx + 3] = 0;
            }
          } else if (x > fill.bitmap.width - rx) {
            const dx = x - (fill.bitmap.width - rx);
            const dy = Math.abs(y - progressH / 2);
            if (Math.sqrt(dx * dx + dy * dy) <= rx) {
              fill.bitmap.data[idx + 0] = rcol;
              fill.bitmap.data[idx + 1] = gcol;
              fill.bitmap.data[idx + 2] = bcol;
              fill.bitmap.data[idx + 3] = 255;
            } else {
              fill.bitmap.data[idx + 3] = 0;
            }
          } else {
            fill.bitmap.data[idx + 0] = rcol;
            fill.bitmap.data[idx + 1] = gcol;
            fill.bitmap.data[idx + 2] = bcol;
            fill.bitmap.data[idx + 3] = 255;
          }
        });
        await base.composite(fill, progressX, progressY);

        // Gloss highlight (small white strip)
        const gloss = new Jimp(fillW, Math.max(4, Math.round(progressH * 0.25)), 0xFFFFFFFF);
        gloss.opacity(0.12);
        await base.composite(gloss, progressX, progressY + 3);

        // Percent text using a built-in font (choose appropriate size)
        let jimpFont = Jimp.FONT_SANS_32_WHITE;
        if (WIDTH < 900) jimpFont = Jimp.FONT_SANS_16_WHITE;
        const loadedFont = await Jimp.loadFont(jimpFont);
        const percentText = `${Math.floor(percent * 100)}%`;
        const textX = progressX + progressW - Jimp.measureText(loadedFont, percentText);
        const textY = progressY - Math.round(progressH * 1.6);
        await base.print(loadedFont, textX, textY, percentText);

        // Bottom stats (LEVEL | XP | RANK)
        const labelFont = await Jimp.loadFont(WIDTH >= 1200 ? Jimp.FONT_SANS_32_WHITE : Jimp.FONT_SANS_16_WHITE);
        const smallFont = await Jimp.loadFont(WIDTH >= 1200 ? Jimp.FONT_SANS_64_WHITE : Jimp.FONT_SANS_32_WHITE); // numbers
        const nameX = progressX;
        const bottomY = progressY + Math.round(progressH * 2.8);

        // Labels (faded)
        await base.print(labelFont, nameX, bottomY, 'LEVEL');
        await base.print(labelFont, nameX + 220, bottomY, 'XP');
        await base.print(labelFont, nameX + 420, bottomY, 'RANK');

        // Values
        await base.print(smallFont, nameX, bottomY + Math.round(progressH * 0.8), String(currentLevel));
        await base.print(smallFont, nameX + 220, bottomY + Math.round(progressH * 0.8), `${currentXP}/${nextLevelXP}`);
        await base.print(smallFont, nameX + 420, bottomY + Math.round(progressH * 0.8), `#${userRank}`);

        // Final buffer and send
        const finalBuffer = await base.getBufferAsync(Jimp.MIME_PNG);
        const attachment = new AttachmentBuilder(finalBuffer, { name: 'rank.png' });

        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ files: [attachment] });
        } else {
          await interaction.reply({ files: [attachment] });
        }
      } catch (postErr) {
        console.error('Post-process (Jimp) error:', postErr);
        // fallback to sending the original canvacord image
        const fallbackAttach = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ files: [fallbackAttach] });
        } else {
          await interaction.reply({ files: [fallbackAttach] });
        }
      }

    } catch (err) {
      console.error('Rank command error:', err);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: '❌ An error occurred while generating the rank card.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ An error occurred while generating the rank card.', ephemeral: true });
      }
    }
  }
};
