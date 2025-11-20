const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { RankCardBuilder, Font } = require('canvacord');
const Level = require('../../models/Level');

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
    // Safe defer: only defer if the interaction hasn't been acknowledged yet
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }

      // load default fonts for canvacord if available
      if (Font && typeof Font.loadDefault === 'function') {
        Font.loadDefault();
      }

      const target = interaction.options.getUser('target') || interaction.user;
      let member = null;
      try {
        member = await interaction.guild.members.fetch(target.id);
      } catch {
        member = null;
      }

      const memberData = await Level.findOne({ guildId: interaction.guild.id, userId: target.id });
      const currentXP = Number(memberData?.xp) || 0;
      const currentLevel = Number(memberData?.level) || 0;

      const allMembers = await Level.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 });
      let userRank = allMembers.findIndex(m => String(m.userId) === String(target.id)) + 1;
      if (!userRank || userRank <= 0) userRank = allMembers.length + (memberData ? 0 : 1);

      const nextLevelXP = Number((currentLevel + 1) * 100) || 100;

      // Build the rank card (canvacord v6)
      const rankCard = new RankCardBuilder()
        .setAvatar(target.displayAvatarURL({ extension: 'png' }))
        .setCurrentXP(currentXP)
        .setLevel(currentLevel)
        .setRank(userRank)
        .setRequiredXP(nextLevelXP)
        .setDisplayName(target.username)
        .setStatus(member?.presence?.status || 'offline')
        // keep your red background image but remove the default grey overlay
        .setBackground('https://iili.io/KNehlZ7.png')
        .setOverlay(0);

      const cardBuffer = await rankCard.build({ format: 'png' });
      const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });

      // If we already deferred, use editReply; otherwise reply.
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ files: [attachment] });
      } else {
        await interaction.reply({ files: [attachment] });
      }

    } catch (err) {
      console.error('Rank command error:', err);

      // If interaction already acknowledged, use followUp; otherwise reply.
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: '❌ An error occurred while generating the rank card.', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ An error occurred while generating the rank card.', ephemeral: true });
        }
      } catch (replyErr) {
        console.error('Failed to notify user about error:', replyErr);
      }
    }
  },
};
