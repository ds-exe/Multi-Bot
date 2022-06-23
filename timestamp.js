const timezones = require("./timezones.json");
const { DateTime } = require("luxon");
const Embeds = require("./embeds.js");
const { getUserTimezone } = require("./SQLDatabase.js");
const { sendMessage, getTimezone } = require("./utility");

const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Leap year check performed on usage
const instructions =
    "\nTime in form: `hh:mm`\nOptional date in form: `dd/mm` or `dd/mm/yyyy`\nOptional timezone specifier: `UTC{+/-}hh` or abbreviation";

module.exports = {
    generateTimestamp: async (message, words) => {
        if (words[0] === undefined || words[0] === "help") {
            sendMessage(message, "Valid inputs:" + instructions);
            return;
        }
        if (words.join().indexOf(":") <= -1) {
            sendMessage(message, "Not following valid formats:" + instructions);
            return;
        }
        let date = DateTime.utc();
        tz = await getUserTimezone(message.author.id);
        date = date.setZone(tz, { keepLocalTime: true });
        for (let word of words) {
            let success = false;
            dateModifiers.forEach((mod) => {
                vals = mod(word, date, success);
                date = vals[0];
                success = vals[1];
            });
            if (!success) {
                sendMessage(
                    message,
                    "Not following valid formats:" + instructions
                );
                return;
            }
        }
        const unixTime = parseInt(date.toSeconds());
        Embeds.timestampEmbed.setDescription(`<t:${unixTime}:F>`);
        Embeds.timestampEmbed.fields = [];
        Embeds.timestampEmbed.addFields({
            name: `Copy Link:`,
            value: `\\<t:${unixTime}:F>`,
        });
        sendMessage(message, { embeds: [Embeds.timestampEmbed] });
    },
};

const dateModifiers = [parseDate, parseTime, setTimezone];

function setTimezone(word, date, success) {
    const timezone = getTimezone(word);
    if (timezone !== null) {
        success = true;
        date = date.setZone(timezone, { keepLocalTime: true });
    }
    return [date, success];
}

function parseTime(word, date, success) {
    timeRegex = /^([0-9]{1,2}):([0-9]{1,2})$/;
    const matches = timeRegex.exec(word);
    if (matches === null) {
        return [date, success]; // error does not match
    }
    const hours = matches[1];
    const minutes = matches[2];
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        success = true;
        date = date.set({ hour: hours, minute: minutes });
    }
    return [date, success];
}

function parseDate(word, date, success) {
    dateRegex = /^([0-9]{1,2})\/([0-9]{1,2})\/?([0-9]{4})?$/;
    const matches = dateRegex.exec(word);
    if (matches === null) {
        return [date, success]; // error does not match
    }
    const day = matches[1];
    const month = matches[2];
    const year = matches[3];
    if (
        day >= 1 &&
        day <= monthLength(month, year) &&
        month >= 1 &&
        month <= 12
    ) {
        if (year !== undefined) {
            date = date.set({ year: year });
        }
        success = true;
        date = date.set({ day: day, month: month });
    }
    return [date, success];
}

function zoneMatch(zone) {
    if (zone in timezones) {
        return timezones[zone];
    }
    return null;
}

function monthLength(month, year) {
    if (month == 2) {
        if (leapYear(year)) {
            return 29;
        }
    }
    return monthLengths[month - 1];
}

function leapYear(year) {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}
