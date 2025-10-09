const { Schema, model } = require('mongoose');

const guildConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    staffRoleId: { type: String },
    ticketPanelTitle: { type: String, default: 'Create a Ticket' },
    ticketPanelDescription: { type: String, default: 'Please select a reason for opening a ticket.' },
    orderCategoryId: { type: String },
    enquiryCategoryId: { type: String },
    supportCategoryId: { type: String },
    ticketLogChannelId: { type: String },
});

module.exports = model('GuildConfig', guildConfigSchema);
