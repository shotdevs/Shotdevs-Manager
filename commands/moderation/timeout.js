const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

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

        const dmEmbed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle(`You have been timed out for ${duration} minute(s)`)
            .addFields(
                { name: 'Server', value: interaction.guild.name },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await target.send({ embeds: [dmEmbed] }).catch(err => {
            console.log(`Could not DM user ${target.tag}.`);
        });

        await member.timeout(durationInMs, reason);

        const confirmationEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`🤫 Successfully timed out **${target.tag}** for ${duration} minute(s). Reason: ${reason}`);
        
        await interaction.reply({ embeds: [confirmationEmbed] });
    },
};
