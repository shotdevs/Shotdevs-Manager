const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const { getConfig } = require('../configManager');

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
            }
            return;
        }

        // --- BUTTON HANDLING ---
        if (interaction.isButton()) {
            const { customId, guild, channel, user } = interaction;
            const guildConfig = await getConfig(guild.id);
            
            const isTicketCreationButton = ['create_order_ticket', 'create_enquiry_ticket', 'create_support_ticket'].includes(customId);

            // --- TICKET CREATION LOGIC ---
            if (isTicketCreationButton) {
                const staffRole = guild.roles.cache.get(guildConfig.staffRoleId);
                let categoryId, channelName, ticketType;

                if (customId === 'create_order_ticket') { /* ... same logic ... */ } 
                else if (customId === 'create_enquiry_ticket') { /* ... same logic ... */ }
                else if (customId === 'create_support_ticket') { /* ... same logic ... */ }

                // This part is the same as before, but I've included the full code for clarity
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
                    // FIXED: Added topic to store the creator's info
                    topic: `Ticket for ${user.tag}. User ID: ${user.id}`,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                        { id: staffRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] }
                    ]
                });

                const ticketEmbed = new EmbedBuilder().setColor(0x5865F2).setTitle(`${ticketType} Ticket`).setDescription(`Welcome ${user}!\nA staff member will be with you shortly. Please describe your reason for opening this ticket in detail.`).setFooter({ text: `${guild.name} | Ticket System` }).setTimestamp();
                const ticketButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('close_ticket_button').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                    new ButtonBuilder().setCustomId('claim_ticket_button').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('🙋'),
                    new ButtonBuilder().setCustomId('transcript_ticket_button').setLabel('Transcript').setStyle(ButtonStyle.Primary).setEmoji('📝')
                );

                await ticketChannel.send({ content: `${staffRole}`, embeds: [ticketEmbed], components: [ticketButtons] });
                await interaction.editReply({ content: `Ticket created in ${ticketChannel}!` });
            } 
            // --- TICKET CLOSING LOGIC (FIXED) ---
            else if (customId === 'close_ticket_button') {
                await interaction.reply({ content: 'Saving transcript and closing ticket...', flags: [ 'Ephemeral' ] });

                try {
                    const logChannelId = guildConfig.ticketLogChannelId;
                    const logChannel = guild.channels.cache.get(logChannelId);

                    if (logChannel) {
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
                            { name: 'Closed By', value: user.tag, inline: true }
                        ).setTimestamp();
                        
                        await logChannel.send({ embeds: [logEmbed], files: [attachment] });
                    }
                } catch (error) {
                    console.error("Failed to log ticket:", error);
                }

                // This will now run even if logging fails
                setTimeout(() => channel.delete(), 5000);
            }
            // --- TICKET CLAIMING LOGIC ---
            else if (customId === 'claim_ticket_button') {
                await interaction.deferUpdate();
                const originalEmbed = interaction.message.embeds[0];
                const updatedEmbed = EmbedBuilder.from(originalEmbed).setFooter({ text: `Ticket claimed by ${interaction.user.tag}` });
                const closeButton = interaction.message.components[0].components[0];
                const claimedButton = ButtonBuilder.from(interaction.component).setDisabled(true).setLabel('Claimed');
                const transcriptButton = interaction.message.components[0].components[2];
                const updatedRow = new ActionRowBuilder().addComponents(closeButton, claimedButton, transcriptButton);
                await interaction.message.edit({ embeds: [updatedEmbed], components: [updatedRow] });
            }
            // --- TRANSCRIPT LOGIC ---
            else if (customId === 'transcript_ticket_button') {
                // ... (your existing transcript logic is fine)
            }
        }
    },
};
