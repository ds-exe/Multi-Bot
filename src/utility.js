const path = require("node:path");
const timezones = require(path.normalize("./../timezones.json"));
const { DateTime } = require("luxon");

module.exports = {
    isDM: (message) =>
        message.channel.type === "DM" || message.channel.type === "GROUP",

    sendMessage: async (message, msg) => {
        return await message.channel.send(msg).catch((err) => {});
    },

    react: async (message, reaction) => {
        return await message.react(reaction).catch((err) => {});
    },

    getTimezone: (timezone) => {
        zonesRegex = /^([a-z]+)$/;
        const zoneMatch = zonesRegex.exec(timezone);
        if (zoneMatch !== null && zoneMatch[1] in timezones) {
            return timezones[zoneMatch[1]];
        }

        zonesRegex = /^(utc[+-]{1}[0-9]{1,2}|[a-z\/_]+)$/;
        const zoneMatches = zonesRegex.exec(timezone);
        if (
            zoneMatches !== null &&
            DateTime.now().setZone(zoneMatches[1]).isValid
        ) {
            return zoneMatches[1];
        }
        return null;
    },
};
