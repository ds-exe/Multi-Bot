const timezones = require("./timezones.json");
const { DateTime } = require("luxon");

module.exports = {
    isDM: (message) =>
        message.channel.type === "DM" || message.channel.type === "GROUP",

    sendMessage: (message, msg) => {
        message.channel.send(msg).catch((err) => {});
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
