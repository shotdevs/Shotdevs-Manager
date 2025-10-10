const { Schema, model } = require('mongoose');

const guildConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
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
    orderCategoryId: { type: String },
    enquiryCategoryId: { type: String },
    supportCategoryId: { type: String },
    ticketLogChannelId: { type: String },
    ticketMessageContent: { type: String },
    
    // Welcome System Configuration
    welcomeChannelId: { type: String },
    welcomeRoleId: { type: String },
    welcomeMessage: { type: String, default: 'Welcome {user} to {servername}!' },
    welcomeEnabled: { type: Boolean, default: false },
    
    // Logging Configuration
    logChannelId: { type: String },
});

module.exports = model('GuildConfig', guildConfigSchema);
