const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // --- Command Handling (unchanged) ---
        if (interaction.isChatInputCommand()) {
            // ... (keep your existing command handling logic here)
        } 
        
        // --- Button Handling ---
        else if (interaction.isButton()) {
            const { customId, guild, channel, user } = interaction;
            const guildConfig = getConfig(guild.id);

            // --- Ticket Creation Buttons (unchanged) ---
            const isTicketButton = ['create_order_ticket', 'create_enquiry_ticket', 'create_support_ticket'].includes(customId);
            if (isTicketButton) {
                // ... (keep your existing ticket creation logic here)
            } 
            
            // --- Ticket Closing Button (COMPLETELY REWRITTEN) ---
            else if (customId === 'close_ticket_button') {
                await interaction.reply({ content: 'Saving transcript and closing this ticket...', ephemeral: true });

                const logChannelId = guildConfig.ticketLogChannelId;
                if (!logChannelId) {
                    // If no log channel is set, just delete the ticket after a delay
                    setTimeout(() => channel.delete(), 5000);
                    return interaction.editReply({ content: 'Closing ticket. Note: No log channel is configured.', ephemeral: true });
                }

                const logChannel = guild.channels.cache.get(logChannelId);
                if (!logChannel) {
                    // If the configured channel doesn't exist, do the same
                    setTimeout(() => channel.delete(), 5000);
                    return interaction.editReply({ content: 'Closing ticket. Note: The configured log channel could not be found.', ephemeral: true });
                }

                // Generate the transcript
                let transcript = `Ticket created by: ${channel.topic.split('. User ID: ')[0].replace('Ticket for ', '')}\n`;
                transcript += `User ID: ${channel.topic.split('. User ID: ')[1]}\n`;
                transcript += `Ticket closed by: ${user.tag}\n\n`;

                const messages = await channel.messages.fetch({ limit: 100 });
                messages.reverse().forEach(msg => {
                    const timestamp = msg.createdAt.toLocaleString('en-US', { timeZone: 'UTC' });
                    transcript += `[${timestamp} UTC] ${msg.author.tag}: ${msg.content}\n`;
                });
                
                // Create a buffer from the transcript text
                const buffer = Buffer.from(transcript, 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}-transcript.txt` });

                // Create a summary embed
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF474D)
                    .setTitle('Ticket Closed')
                    .addFields(
                        { name: 'Ticket Name', value: channel.name, inline: true },
                        { name: 'Closed By', value: user.tag, inline: true },
                        { name: 'Timestamp', value: new Date().toUTCString(), inline: false }
                    )
                    .setTimestamp();
                
                try {
                    await logChannel.send({ embeds: [logEmbed], files: [attachment] });
                } catch (error) {
                    console.error("Failed to send log file:", error);
                }

                // Finally, delete the ticket channel
                await channel.delete();
            }
            
            // --- Ticket Claiming Button (unchanged) ---
            else if (customId === 'claim_ticket_button') {
                // ... (keep your existing claim logic here)
            }
        }
    },
};
