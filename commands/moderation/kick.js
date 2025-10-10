const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

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

        const dmEmbed = new EmbedBuilder()
            .setColor(0xFF474D)
            .setTitle('You have been kicked')
            .addFields(
                { name: 'Server', value: interaction.guild.name },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();
        
        await target.send({ embeds: [dmEmbed] }).catch(err => {
            console.log(`Could not DM user ${target.tag}. They may have DMs disabled.`);
        });

        await member.kick(reason);

        const confirmationEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`👢 Successfully kicked **${target.tag}**. Reason: ${reason}`);
        
        await interaction.reply({ embeds: [confirmationEmbed] });
    },
};
