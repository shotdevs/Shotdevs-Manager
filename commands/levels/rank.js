const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
// We are removing require('canvacord') from the top
const MemberProfile = require('../../models/MemberProfile');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('View your rank and level.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Select a user to view their rank')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // --- NEW: Load canvacord dynamically ---
            const { Rank } = await import('canvacord');
            // ------------------------------------

            const target = interaction.options.getUser('target') || interaction.user;
            const member = interaction.guild.members.cache.get(target.id);

            let memberData = await MemberProfile.findOne({ guildId: interaction.guild.id, userId: target.id });
            if (!memberData) {
                memberData = { xp: 0, level: 0 };
            }

            const allMembers = await MemberProfile.find({ guildId: interaction.guild.id }).sort({ xp: -1 });
            const userRank = allMembers.findIndex(m => m.userId === target.id) + 1 || allMembers.length + 1;

            const nextLevelXP = (memberData.level + 1) * 100;

            const rankCard = new Rank()
                .setAvatar(target.displayAvatarURL({ extension: 'png' }))
                .setCurrentXP(memberData.xp)
                .setLevel(memberData.level)
                .setRank(userRank, 'Rank')
                .setRequiredXP(nextLevelXP)
                .setUsername(target.username)
                .setStatus(member?.presence?.status || "offline")
                .setProgressBar('#FFFFFF', 'COLOR')
                .setBackground("IMAGE", "https://i.ibb.co/9N6y0sM/custom-bg.png");

            const cardBuffer = await rankCard.build();
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: '❌ An error occurred while generating the rank card.'
            });
        }
    }
};
