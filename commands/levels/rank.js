const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { RankCardBuilder, Font } = require('canvacord');
const Level = require('../../models/Level');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('View user ranks or set your custom rank card background.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your rank or another user\'s rank card.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('Select a user to view their rank')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setbackground')
                .setDescription('Set a custom background image for your rank card.')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('Enter a valid image URL (jpg/png/gif)')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setbackground') {
            const url = interaction.options.getString("url");
            if (!url.match(/\.(jpeg|jpg|png|gif)$/i)) {
                return interaction.reply({ content: "❌ Please provide a valid image URL (jpg/png/gif).", ephemeral: true });
            }

            let userProfile = await Level.findOne({ guildId: interaction.guild.id, userId: interaction.user.id });
            if (!userProfile) {
                userProfile = new Level({ guildId: interaction.guild.id, userId: interaction.user.id });
            }

            userProfile.background = url;
            await userProfile.save();

            return interaction.reply({ content: `✅ Your rank card background has been updated!`, ephemeral: true });
        }

        if (subcommand === 'view') {
            await interaction.deferReply({ ephemeral: false });

            try {
                if (Font && typeof Font.loadDefault === 'function') {
                    Font.loadDefault();
                }

                const target = interaction.options.getUser('target') || interaction.user;
                let member = await interaction.guild.members.fetch(target.id).catch(() => null);

                let memberData = await Level.findOne({ guildId: interaction.guild.id, userId: target.id });
                const currentXP = Number(memberData?.xp) || 0;
                const currentLevel = Number(memberData?.level) || 0;

                // --- THIS IS THE UPDATED LINE ---
                const backgroundUrl = memberData?.background || "https://iili.io/KNehlZ7.png";
                // --------------------------------

                const allMembers = await Level.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 });
                let userRank = allMembers.findIndex(m => String(m.userId) === String(target.id)) + 1;
                if (!userRank || userRank <= 0) userRank = allMembers.length + (memberData ? 0 : 1);

                const nextLevelXP = Number((currentLevel + 1) * 100) || 100;

                const rankCard = new RankCardBuilder()
                    .setAvatar(target.displayAvatarURL({ extension: 'png' }))
                    .setCurrentXP(currentXP)
                    .setLevel(currentLevel)
                    .setRank(userRank)
                    .setRequiredXP(nextLevelXP)
                    .setDisplayName(target.username)
                    .setStatus(member?.presence?.status || "offline")
                    .setBackground(backgroundUrl);

                const cardBuffer = await rankCard.build({ format: 'png' });
                const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });

                await interaction.editReply({ files: [attachment] });

            } catch (err) {
                console.error(err);
                await interaction.editReply({
                    content: '❌ An error occurred while generating the rank card.'
                });
            }
        }
    }
};
