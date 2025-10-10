const { Schema, model } = require('mongoose');

const guildConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    staffRoleId: { type: String },
    ticketPanelTitle: { type: String },
    ticketPanelDescription: { type: String },
    orderCategoryId: { type: String },
    enquiryCategoryId: { type: String },
    supportCategoryId: { type: String },
    ticketLogChannelId: { type: String },
    welcomeChannelId: { type: String },
    welcomeRoleId: { type: String },
    welcomeMessage: { type: String, default: 'Welcome {user} to {servername}!' },
    welcomeEnabled: { type: Boolean, default: false },
    // NEW: Add this line for the button role system
    buttonRoles: { type: Array, default: [] },
});

module.exports = model('GuildConfig', guildConfigSchema);
