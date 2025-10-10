const { Schema, model } = require('mongoose');

const guildConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: {type: String, default: '!' },
    // Role Configuration
    staffRoleId: { type: String },
    adminRoles: [{ type: String }],
    moderatorRoles: [{ type: String }],
    
    // Button Roles Configuration
    buttonRoles: [{
        messageId: { type: String },
        roles: [{
            roleId: { type: String },
            label: { type: String },
            emoji: { type: String }
        }]
    }],
    
    // Ticket System Configuration
    ticketPanelTitle: { type: String },
    ticketPanelDescription: { type: String },
    // Categories for ticket types
    orderCategoryId: { type: String },
    enquiryCategoryId: { type: String },
    supportCategoryId: { type: String },
    // Optional generic category mapping
    ticketCategoryId: { type: String },
    // Channels and messages used by the ticket system
    ticketPanelChannelId: { type: String }, // Channel where panel was posted
    ticketPanelMessageId: { type: String }, // Message ID of the ticket panel
    ticketLogChannelId: { type: String },   // Channel to post transcripts/logs
    ticketTranscriptChannelId: { type: String }, // Alternate channel to save transcripts
    // Ticket UI customization
    ticketMessageContent: { type: String },
    ticketCloseDelaySeconds: { type: Number, default: 5 },
    ticketButtonLabels: {
        close: { type: String, default: 'Close' },
        claim: { type: String, default: 'Claim' },
        transcript: { type: String, default: 'Transcript' }
    },
    
    // Welcome System Configuration
    welcomeChannelId: { type: String },
    welcomeRoleId: { type: String },
    welcomeMessage: { type: String, default: 'Welcome {user} to {servername}!' },
    welcomeEnabled: { type: Boolean, default: false },
    
    // Logging Configuration
    logChannelId: { type: String },
});


  // ✅ Multiple reaction panels, stored by message ID
  reactionRoles: {
    type: Map,
    of: Object, // each messageId maps to { emoji: roleId }
    default: {}
  },
});


module.exports = model('GuildConfig', guildConfigSchema);
