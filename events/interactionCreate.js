const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // --- START OF DEBUG LOGGING ---
        console.log(`[LOG] Interaction received from user ${interaction.user.tag} in channel #${interaction.channel?.name}.`);

        if (interaction.isChatInputCommand()) {
            console.log(`[LOG] Interaction is a Chat Input Command: /${interaction.commandName}`);
            
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`[ERROR] No command matching /${interaction.commandName} was found in the commands collection.`);
                return;
            }

            try {
                console.log(`[LOG] Attempting to execute command: /${interaction.commandName}`);
                await command.execute(interaction);
                console.log(`[LOG] Successfully executed command: /${interaction.commandName}`);
            } catch (error) {
                console.error(`[FATAL ERROR] An error occurred while executing /${interaction.commandName}:`, error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'An error occurred while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'An error occurred while executing this command!', ephemeral: true });
                }
            }
        } 
        else if (interaction.isButton()) {
            const { customId, guild, channel, user } = interaction;
            console.log(`[LOG] Interaction is a Button. Custom ID: ${customId}`);
            
            const guildConfig = getConfig(guild.id);
            const isTicketButton = ['create_order_ticket', 'create_enquiry_ticket', 'create_support_ticket'].includes(customId);
            
            if (isTicketButton) {
                console.log(`[LOG] Ticket creation button '${customId}' pressed.`);
                const staffRole = guild.roles.cache.get(guildConfig.staffRoleId);
                let categoryId, channelName, welcomeMessage;

                if (customId === 'create_order_ticket') {
                    categoryId = guildConfig.orderCategoryId;
                    channelName = `order-${user.username}`;
                    welcomeMessage = `Hello ${user}, please provide the details of your order.`;
                } else if (customId === 'create_enquiry_ticket') {
                    categoryId = guildConfig.enquiryCategoryId;
                    channelName = `enquiry-${user.username}`;
                    welcomeMessage = `Hello ${user}, how can we help you with your enquiry today?`;
                } else if (customId === 'create_support_ticket') {
                    categoryId = guildConfig.supportCategoryId;
                    channelName = `support-${user.username}`;
                    welcomeMessage = `Hello ${user}, please describe the issue you need support with.`;
                }

                if (!categoryId || !staffRole) {
                    console.error('[ERROR] Ticket system is missing a category or role setting for this guild.');
                    return interaction.reply({ content: '❌ The ticket system is missing a required category or role setting.', ephemeral: true });
                }
                const category = guild.channels.cache.get(categoryId);
                if (!category) {
                    console.error(`[ERROR] The configured category with ID ${categoryId} does not exist.`);
                    return interaction.reply({ content: '❌ The configured category for this ticket type does not exist.', ephemeral: true });
                }

                await interaction.deferReply({ ephemeral: true });
                
                const ticketChannel = await guild.channels.create({ name: channelName, type: ChannelType.GuildText, parent: category, permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: staffRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] },
                ]});

                const ticketEmbed = new EmbedBuilder().setColor(0x57F287).setDescription(welcomeMessage);
                const closeButton = new ButtonBuilder().setCustomId('close_ticket_button').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒');
                const claimButton = new ButtonBuilder().setCustomId('claim_ticket_button').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('🙋');
                const row = new ActionRowBuilder().addComponents(closeButton, claimButton);

                await ticketChannel.send({ content: `${staffRole}`, embeds: [ticketEmbed], components: [row] });
                await interaction.editReply({ content: `Ticket created in ${ticketChannel}!`, ephemeral: true });
                console.log(`[LOG] Successfully created ticket channel #${ticketChannel.name}.`);
            } 
            else if (customId === 'close_ticket_button') {
                console.log(`[LOG] Close ticket button pressed in #${channel.name}.`);
                await interaction.reply({ content: 'Saving transcript and closing this ticket...', ephemeral: true });
                const logChannelId = guildConfig.ticketLogChannelId;
                if (!logChannelId) {
                    setTimeout(() => channel.delete(), 5000);
                    console.log('[LOG] No log channel configured. Closing ticket without logging.');
                    return interaction.editReply({ content: 'Closing ticket. Note: No log channel is configured.', ephemeral: true });
                }
                const logChannel = guild.channels.cache.get(logChannelId);
                if (!logChannel) {
                    setTimeout(() => channel.delete(), 5000);
                    console.error(`[ERROR] Log channel with ID ${logChannelId} not found.`);
                    return interaction.editReply({ content: 'Closing ticket. Note: The configured log channel could not be found.', ephemeral: true });
                }

                let transcript = `Ticket created by: ${channel.topic.split('. User ID: ')[0].replace('Ticket for ', '')}\n`;
                transcript += `User ID: ${channel.topic.split('. User ID: ')[1]}\n`;
                transcript += `Ticket closed by: ${user.tag}\n\n`;
                const messages = await channel.messages.fetch({ limit: 100 });
                messages.reverse().forEach(msg => {
                    const timestamp = msg.createdAt.toLocaleString('en-US', { timeZone: 'UTC' });
                    transcript += `[${timestamp} UTC] ${msg.author.tag}: ${msg.content}\n`;
                });
                
                const buffer = Buffer.from(transcript, 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}-transcript.txt` });
                const logEmbed = new EmbedBuilder().setColor(0xFF474D).setTitle('Ticket Closed').addFields(
                    { name: 'Ticket Name', value: channel.name, inline: true },
                    { name: 'Closed By', value: user.tag, inline: true },
                    { name: 'Timestamp', value: new Date().toUTCString(), inline: false }
                ).setTimestamp();
                
                try {
                    await logChannel.send({ embeds: [logEmbed], files: [attachment] });
                    console.log(`[LOG] Transcript for #${channel.name} sent to #${logChannel.name}.`);
                } catch (error) {
                    console.error("[FATAL ERROR] Failed to send log file:", error);
                }
                await channel.delete();
            }
            else if (customId === 'claim_ticket_button') {
                console.log(`[LOG] Claim ticket button pressed by ${user.tag} in #${channel.name}.`);
                await interaction.deferUpdate();
                const originalEmbed = interaction.message.embeds[0];
                const updatedEmbed = EmbedBuilder.from(originalEmbed).setFooter({ text: `Ticket claimed by ${interaction.user.tag}` });
                const closeButton = interaction.message.components[0].components[0];
                const claimedButton = ButtonBuilder.from(interaction.component).setDisabled(true).setLabel('Claimed');
                const updatedRow = new ActionRowBuilder().addComponents(closeButton, claimedButton);
                await interaction.message.edit({ embeds: [updatedEmbed], components: [updatedRow] });
                console.log(`[LOG] Ticket #${channel.name} successfully claimed.`);
            }
        }
    },
};
            
