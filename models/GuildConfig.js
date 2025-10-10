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
    // NEW WELCOME SYSTEM FIELDS
    welcomeChannelId: { type: String },
    welcomeRoleId: { type: String },
    welcomeMessage: { type: String, default: 'Welcome {user} to {servername}!' },
    welcomeEnabled: { type: Boolean, default: false },
});

module.exports = model('GuildConfig', guildConfigSchema);
