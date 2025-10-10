const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const canvacord = require('canvacord');
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
        // Defer reply to prevent interaction timeout for image generation
        await interaction.deferReply();

        try {
            const target = interaction.options.getUser('target') || interaction.user;
            const member = interaction.guild.members.cache.get(target.id);

            let memberData = await MemberProfile.findOne({ guildId: interaction.guild.id, userId: target.id });
            if (!memberData) {
                memberData = { xp: 0, level: 0 }; // Use a default object if no user data
            }

            const allMembers = await MemberProfile.find({ guildId: interaction.guild.id }).sort({ xp: -1 });
            const userRank = allMembers.findIndex(m => m.userId === target.id) + 1 || allMembers.length + 1;

            const nextLevelXP = (memberData.level + 1) * 100;

            // --- THIS IS THE CORRECTED PART ---
            const rankCard = await canvacord.Image.rank({
                avatar: target.displayAvatarURL({ extension: 'png' }),
                currentXP: memberData.xp,
                level: memberData.level,
                rank: userRank,
                requiredXP: nextLevelXP,
                username: target.username,
                status: member?.presence?.status || "offline",
                progressBar: {
                    bar: "#FFFFFF",
                    background: "#555555"
                },
                background: {
                    type: "image",
                    source: "https://i.ibb.co/9N6y0sM/custom-bg.png"
                }
            });
            // ------------------------------------

            const attachment = new AttachmentBuilder(rankCard, { name: 'rank.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (err) {
            console.error(err);
            // The error message is now ephemeral (private to the command user)
            await interaction.editReply({
                content: '❌ An error occurred while generating the rank card.',
                ephemeral: true
            });
        }
    }
};
