const { Schema, model } = require('mongoose');

const memberProfileSchema = new Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    warnings: { type: Array, default: [] },
});

module.exports = model('MemberProfile', memberProfileSchema);
