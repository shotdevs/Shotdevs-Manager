const { SlashCommandBuilder } = require('discord.js');
const {
    container,
    section,
    separator,
    thumbnail,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user-info')
        .setDescription('Displays information about a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get info about.')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        const userAvatar = user.displayAvatarURL({ size: 128 });

        // Format roles list
        const roles = member.roles.cache
            .filter(r => r.id !== interaction.guild.id) // Exclude @everyone
            .map(r => r.toString())
            .join(', ') || 'None';

        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `# ${user.username}\nUser Information`,
                            accessory: thumbnail(userAvatar)
                        }),
                        separator(),
                        section({
                            content: `**User Tag:** ${user.tag}\n**User ID:** ${user.id}\n**Bot Account:** ${user.bot ? 'Yes' : 'No'}\n**Joined Server:** <t:${parseInt(member.joinedTimestamp / 1000)}:R>\n**Account Created:** <t:${parseInt(user.createdTimestamp / 1000)}:R>`
                        }),
                        separator(),
                        section({
                            content: `**Roles:** ${roles}`
                        })
                    ]
                })
            ]
        });
    },
};
