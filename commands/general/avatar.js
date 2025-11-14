const { SlashCommandBuilder } = require('discord.js');
const {
    container,
    section,
    thumbnail,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Displays a user\'s avatar.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose avatar you want to see.')
                .setRequired(false)), // Optional, defaults to the command user
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const avatarURL = user.displayAvatarURL({ size: 512 });

        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `# ${user.username}'s Avatar\n\n[View Full Size](${avatarURL})`,
                            accessory: thumbnail(avatarURL)
                        })
                    ]
                })
            ]
        });
    },
};
