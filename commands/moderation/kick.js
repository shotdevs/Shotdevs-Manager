const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
    container,
    section,
    separator,
    sendComponentsV2Message,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to kick.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for kicking.')),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided.';
        const member = await interaction.guild.members.fetch(target.id);

        if (!member.kickable) {
            return interaction.reply({ content: 'I cannot kick this user. They may have a higher role than me or I lack permissions.', flags: [ 'Ephemeral' ] });
        }

        // Send DM to user with Components V2
        try {
            await sendComponentsV2Message(interaction.client, (await target.createDM()).id, {
                components: [
                    container({
                        components: [
                            section({
                                content: '# You have been kicked'
                            }),
                            separator(),
                            section({
                                content: `**Server:** ${interaction.guild.name}\n**Reason:** ${reason}`
                            })
                        ]
                    })
                ]
            });
        } catch (err) {
            console.log(`Could not DM user ${target.tag}. They may have DMs disabled.`);
        }

        await member.kick(reason);

        // Send confirmation with Components V2
        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `👢 Successfully kicked **${target.tag}**\n\n**Reason:** ${reason}`
                        })
                    ]
                })
            ]
        });
    },
};
