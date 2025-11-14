const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const { getConfig } = require('../configManager');
const {
    container,
    section,
    separator,
    button,
    actionRow,
    sendComponentsV2Message
} = require('../utils/componentsV2Builder');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton() && !interaction.isChatInputCommand()) return;

        // --- SLASH COMMAND HANDLING ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`, error);
                
                // Check if interaction is still valid and not already acknowledged
                if (!interaction.isRepliable()) {
                    console.log(`Interaction ${interaction.id} is no longer repliable`);
                    return;
                }
                
                if (interaction.deferred || interaction.replied) {
                    try {
                        await interaction.editReply({ content: 'There was an error while executing this command!' });
                    } catch (editError) {
                        console.error('Failed to edit reply:', editError);
                    }
                } else {
                    try {
                        await interaction.reply({ content: 'There was an error while executing this command!', flags: ['Ephemeral'] });
                    } catch (replyError) {
                        console.error('Failed to reply to interaction:', replyError);
                    }
                }
            }
            return;
        }

        // --- BUTTON HANDLING ---
        if (interaction.isButton()) {
            const { customId, guild, channel, user, member } = interaction;
            const guildConfig = await getConfig(guild.id);
            
            const isTicketCreationButton = ['create_order_ticket', 'create_enquiry_ticket', 'create_support_ticket'].includes(customId);

            // --- TICKET CREATION LOGIC ---
            if (isTicketCreationButton) {
                const staffRole = guild.roles.cache.get(guildConfig.staffRoleId);
                let categoryId, channelName, ticketType;

                if (customId === 'create_order_ticket') {
                    categoryId = guildConfig.orderCategoryId;
                    channelName = `order-${user.username}`;
                    ticketType = 'Order';
                } else if (customId === 'create_enquiry_ticket') {
                    categoryId = guildConfig.enquiryCategoryId;
                    channelName = `enquiry-${user.username}`;
                    ticketType = 'Enquiry';
                } else if (customId === 'create_support_ticket') {
                    categoryId = guildConfig.supportCategoryId;
                    channelName = `support-${user.username}`;
                    ticketType = 'Support';
                }

                if (!categoryId || !staffRole) return interaction.reply({ content: '❌ Ticket system is not fully configured.', flags: ['Ephemeral'] });
                const category = guild.channels.cache.get(categoryId);
                if (!category) return interaction.reply({ content: '❌ The configured category for this ticket type does not exist.', flags: ['Ephemeral'] });

                await interaction.deferReply({ flags: ['Ephemeral'] });
                const ticketChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category,
                    topic: `Ticket for ${user.tag}. User ID: ${user.id}`,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                        { id: staffRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] }
                    ]
                });

                // Build Components V2 ticket creation message
                const btnLabels = guildConfig.ticketButtonLabels || {};
                await sendComponentsV2Message(interaction.client, ticketChannel.id, {
                    content: `${staffRole}`,
                    components: [
                        container({
                            components: [
                                section({
                                    content: `# ${ticketType} Ticket\n\nWelcome ${user}!\nA staff member will be with you shortly. Please describe your reason for opening this ticket in detail.`
                                }),
                                separator(),
                                section({
                                    content: `**${guild.name}** | Ticket System`
                                }),
                                separator(),
                                actionRow([
                                    button({
                                        custom_id: 'close_ticket_button',
                                        label: btnLabels.close || 'Close',
                                        style: 4, // Danger (red)
                                        emoji: '🔒'
                                    }),
                                    button({
                                        custom_id: 'claim_ticket_button',
                                        label: btnLabels.claim || 'Claim',
                                        style: 3, // Success (green)
                                        emoji: '🙋'
                                    }),
                                    button({
                                        custom_id: 'transcript_ticket_button',
                                        label: btnLabels.transcript || 'Transcript',
                                        style: 1, // Primary (blue)
                                        emoji: '📝'
                                    })
                                ])
                            ]
                        })
                    ]
                });
                await interaction.editReply({ content: `Ticket created in ${ticketChannel}!` });
            } 
            // --- TICKET CLOSING LOGIC ---
            else if (customId === 'close_ticket_button') {
                await interaction.reply({ content: 'Saving transcript and closing ticket...', flags: [ 'Ephemeral' ] });
                try {
                    // Prefer a dedicated transcript channel if set, otherwise fall back to log channel
                    const logChannelId = guildConfig.ticketTranscriptChannelId || guildConfig.ticketLogChannelId;
                    const logChannel = guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        let transcript = `Ticket created by: ${channel.topic?.split('. User ID: ')[0].replace('Ticket for ', '') || 'Unknown User'}\n`;
                        transcript += `User ID: ${channel.topic?.split('. User ID: ')[1] || 'Unknown'}\n`;
                        transcript += `Ticket closed by: ${user.tag}\n\n`;
                        const messages = await channel.messages.fetch({ limit: 100 });
                        messages.reverse().forEach(msg => {
                            const timestamp = msg.createdAt.toLocaleString('en-US', { timeZone: 'UTC' });
                            transcript += `[${timestamp} UTC] ${msg.author.tag}: ${msg.content}\n`;
                        });
                        const buffer = Buffer.from(transcript, 'utf-8');
                        const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}-transcript.txt` });
                        
                        // Send Components V2 log message
                        await sendComponentsV2Message(interaction.client, logChannel.id, {
                            components: [
                                container({
                                    components: [
                                        section({
                                            content: '# Ticket Closed'
                                        }),
                                        separator(),
                                        section({
                                            content: `**Ticket Name:** ${channel.name}\n**Closed By:** ${user.tag}`
                                        })
                                    ]
                                })
                            ],
                            files: [attachment]
                        });
                    }
                } catch (error) {
                    console.error("Failed to log ticket:", error);
                }

                // Use configurable close delay (seconds) if provided
                const delaySeconds = guildConfig.ticketCloseDelaySeconds ?? 5;
                setTimeout(() => channel.delete(), Math.max(0, delaySeconds) * 1000);
            }
            // --- TICKET CLAIMING LOGIC ---
            else if (customId === 'claim_ticket_button') {
                await interaction.deferUpdate();
                
                // Rebuild the entire container with updated footer and disabled claim button
                const ticketType = channel.name.split('-')[0]; // Extract ticket type from channel name
                const originalMessage = interaction.message;
                const btnLabels = guildConfig.ticketButtonLabels || {};
                
                // Get user mention from original message content
                const userMention = originalMessage.content.match(/<@&?\d+>/)?.[0] || '';
                
                await interaction.message.edit({
                    content: userMention,
                    flags: 1 << 15, // IS_COMPONENTS_V2
                    components: [
                        container({
                            components: [
                                section({
                                    content: `# ${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} Ticket\n\nWelcome!\nA staff member will be with you shortly. Please describe your reason for opening this ticket in detail.`
                                }),
                                separator(),
                                section({
                                    content: `**${guild.name}** | Ticket System\n**Ticket claimed by:** ${interaction.user.tag}`
                                }),
                                separator(),
                                actionRow([
                                    button({
                                        custom_id: 'close_ticket_button',
                                        label: btnLabels.close || 'Close',
                                        style: 4,
                                        emoji: '🔒'
                                    }),
                                    button({
                                        custom_id: 'claim_ticket_button',
                                        label: 'Claimed',
                                        style: 3,
                                        emoji: '🙋',
                                        disabled: true
                                    }),
                                    button({
                                        custom_id: 'transcript_ticket_button',
                                        label: btnLabels.transcript || 'Transcript',
                                        style: 1,
                                        emoji: '📝'
                                    })
                                ])
                            ]
                        })
                    ]
                });
            }
            // --- TRANSCRIPT LOGIC ---
            else if (customId === 'transcript_ticket_button') {
                await interaction.reply({ content: 'Saving transcript...', flags: [ 'Ephemeral' ] });
                let transcript = `Transcript for ticket #${channel.name}\n\n`;
                const messages = await channel.messages.fetch({ limit: 100 });
                messages.reverse().forEach(msg => {
                    const timestamp = msg.createdAt.toLocaleString('en-US', { timeZone: 'UTC' });
                    transcript += `[${timestamp} UTC] ${msg.author.tag}: ${msg.content}\n`;
                });
                const buffer = Buffer.from(transcript, 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}-transcript.txt` });
                await user.send({ content: `Here is the transcript for your ticket, #${channel.name}.`, files: [attachment] }).catch(err => {
                    interaction.followUp({ content: 'I could not DM you the transcript. Do you have DMs disabled?', flags: [ 'Ephemeral' ] });
                });
            }
            // --- BUTTON ROLE LOGIC ---
            else if (customId.startsWith('button_role_')) {
                await interaction.deferReply({ flags: [ 'Ephemeral' ] });
                const roleId = customId.split('_')[2];
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) {
                    return interaction.editReply('This role no longer exists.');
                }
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    await interaction.editReply(`The **${role.name}** role has been removed.`);
                } else {
                    await member.roles.add(role);
                    await interaction.editReply(`You have been given the **${role.name}** role.`);
                }
            }
        }
    },
};
