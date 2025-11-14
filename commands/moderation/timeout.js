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
        .setName('timeout')
        .setDescription('Times out a member for a specified duration.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to time out.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration of the timeout in minutes.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the timeout.')),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') ?? 'No reason provided.';
        const member = await interaction.guild.members.fetch(target.id);

        if (!member.moderatable) {
            return interaction.reply({ content: 'I cannot time out this user. They may have a higher role than me or I lack permissions.', flags: [ 'Ephemeral' ] });
        }
        
        // Duration from minutes to milliseconds
        const durationInMs = duration * 60 * 1000;

        // Send DM to user with Components V2
        try {
            await sendComponentsV2Message(interaction.client, (await target.createDM()).id, {
                components: [
                    container({
                        components: [
                            section({
                                content: `# You have been timed out for ${duration} minute(s)`
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
            console.log(`Could not DM user ${target.tag}.`);
        }

        await member.timeout(durationInMs, reason);

        // Send confirmation with Components V2
        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `🤫 Successfully timed out **${target.tag}** for ${duration} minute(s)\n\n**Reason:** ${reason}`
                        })
                    ]
                })
            ]
        });
    },
};
