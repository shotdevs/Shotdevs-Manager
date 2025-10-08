const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        } else if (interaction.isButton()) {
            const { customId, guild } = interaction;
            const guildConfig = getConfig(guild.id);
            if (customId === 'create_support_ticket' || customId === 'create_bug_report_ticket') {
                const category = guild.channels.cache.get(guildConfig.ticketCategoryId);
                const staffRole = guild.roles.cache.get(guildConfig.staffRoleId);
                if (!category || !staffRole) {
                    return interaction.reply({ content: '❌ The ticket system is not configured. Please ask an admin to use `/ticket-config`.', ephemeral: true });
                }
                await interaction.deferReply({ ephemeral: true });
                const channelName = customId === 'create_support_ticket' ? `support-${interaction.user.username}` : `bug-${interaction.user.username}`;
                const welcomeMessage = customId === 'create_support_ticket' ? `Welcome ${interaction.user}! Please describe your support issue.` : `Welcome ${interaction.user}! Please describe the bug you found in detail.`;
                const ticketChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                        { id: staffRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] },
                    ],
                });
                const ticketEmbed = new EmbedBuilder().setColor(0x57F287).setDescription(welcomeMessage);
                const closeButton = new ButtonBuilder().setCustomId('close_ticket_button').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒');
                const claimButton = new ButtonBuilder().setCustomId('claim_ticket_button').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('🙋');
                const row = new ActionRowBuilder().addComponents(closeButton, claimButton);
                await ticketChannel.send({ content: `${staffRole}`, embeds: [ticketEmbed], components: [row] });
                await interaction.editReply({ content: `Ticket created in ${ticketChannel}!`, ephemeral: true });
            } else if (customId === 'close_ticket_button') {
                await interaction.reply('Closing this ticket in 5 seconds...');
                setTimeout(() => interaction.channel.delete(), 5000);
            } else if (customId === 'claim_ticket_button') {
                await interaction.deferUpdate();
                const originalEmbed = interaction.message.embeds[0];
                const updatedEmbed = EmbedBuilder.from(originalEmbed).setFooter({ text: `Ticket claimed by ${interaction.user.username}` });
                const closeButton = interaction.message.components[0].components[0];
                const claimedButton = ButtonBuilder.from(interaction.component).setDisabled(true).setLabel('Claimed');
                const updatedRow = new ActionRowBuilder().addComponents(closeButton, claimedButton);
                await interaction.message.edit({ embeds: [updatedEmbed], components: [updatedRow] });
            }
        }
    },
};
