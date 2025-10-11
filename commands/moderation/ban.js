const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a member from the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for banning.')),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided.';
        const member = await interaction.guild.members.fetch(target.id);

        if (!member.bannable) {
            return interaction.reply({ content: 'I cannot ban this user. They may have a higher role than me or I lack permissions.', flags: [ 'Ephemeral' ] });
        }

        const dmEmbed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('You have been banned')
            .addFields(
                { name: 'Server', value: interaction.guild.name },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await target.send({ embeds: [dmEmbed] }).catch(err => {
            console.log(`Could not DM user ${target.tag}.`);
        });

        await member.ban({ reason: reason });

        const confirmationEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`🔨 Successfully banned **${target.tag}**. Reason: ${reason}`);

        await interaction.reply({ embeds: [confirmationEmbed] });

        // --- Moderation Log ---
        try {
            const configManager = require('../../configManager');
            const guildConfig = await configManager.getConfig(interaction.guild.id);
            const modlogChannelId = guildConfig && (guildConfig.modlogChannelId || guildConfig.modLogChannelId || guildConfig.moderationLogChannelId);
            if (modlogChannelId) {
                const modlogChannel = interaction.guild.channels.cache.get(modlogChannelId);
                if (modlogChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle('User Banned')
                        .addFields(
                            { name: 'User', value: `${target.tag} (${target.id})` },
                            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                            { name: 'Reason', value: reason }
                        )
                        .setTimestamp();
                    await modlogChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (e) {
            console.error('Failed to log to moderation channel:', e);
        }
    },
};
