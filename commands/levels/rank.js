const { SlashCommandBuilder } = require('discord.js');
const { Rank } = require('canvacord');
const MemberProfile = require('../../models/MemberProfile'); // Make sure you have this model
const { AttachmentBuilder } = require('discord.js');

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
        try {
            const target = interaction.options.getUser('target') || interaction.user;

            // Fetch member data from MongoDB
            let memberData = await MemberProfile.findOne({ guildId: interaction.guild.id, userId: target.id });
            if (!memberData) {
                // If no data, create default
                memberData = await MemberProfile.create({
                    guildId: interaction.guild.id,
                    userId: target.id,
                    xp: 0,
                    level: 0
                });
            }

            const userXP = memberData.xp || 0;
            const userLevel = memberData.level || 0;

            // Calculate rank (optional: you can sort all members for global rank)
            const allMembers = await MemberProfile.find({ guildId: interaction.guild.id }).sort({ xp: -1 });
            const userRank = allMembers.findIndex(m => m.userId === target.id) + 1;

            // XP required for next level (example: simple formula)
            const nextLevelXP = (userLevel + 1) * 100;

            // Create rank card
            const rankCard = new Rank()
                .setAvatar(target.displayAvatarURL({ format: 'png' }))
                .setCurrentXP(userXP)
                .setLevel(userLevel)
                .setRank(userRank, 'Rank')
                .setRequiredXP(nextLevelXP)
                .setUsername(target.username)
                .setDiscriminator(target.discriminator)
                .setStatus(target.presence?.status || "online")
                .setProgressBar('#FFFFFF', 'COLOR')
                .setBackground("IMAGE", "https://i.ibb.co/9N6y0sM/custom-bg.png"); // Your custom background URL

            const cardBuffer = await rankCard.build();

            const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });

            await interaction.reply({ files: [attachment] });

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '❌ An error occurred while generating the rank card.', ephemeral: true });
        }
    }
};
