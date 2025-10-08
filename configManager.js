const fs = require('node:fs');
const path = require('node:path');

const configPath = path.join(__dirname, 'guild_configs.json');

function readConfigs() {
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function writeConfigs(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 4));
}

module.exports = {
    getConfig: function(guildId) {
        const configs = readConfigs();
        return configs[guildId] || {};
    },
    setConfig: function(guildId, key, value) {
        const configs = readConfigs();
        if (!configs[guildId]) {
            configs[guildId] = {};
        }
        configs[guildId][key] = value;
        writeConfigs(configs);
    }
};
