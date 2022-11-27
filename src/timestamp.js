const { DateTime } = require("luxon");
const Embeds = require("./embeds.js");
const { getUserTimezone } = require("./SQLDatabase.js");
const { sendMessage, getTimezone } = require("./utility");

const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Leap year check performed on usage
const instructions =
    "\nTime in form: `hh:mm`\nOptional date in form: `dd/mm` or `dd/mm/yyyy` or `yyyy-mm-dd`\nOptional timezone specifier: `UTC{+/-}hh` or abbreviation";

module.exports = {
    generateTimestamp: async (message, words) => {
        const unixTime = await generateTimestampHelper(message, words);
        if (!unixTime) {
            return;
        }
        Embeds.timestampEmbed.setDescription(`<t:${unixTime}:F>`);
        Embeds.timestampEmbed.fields = [];
        Embeds.timestampEmbed.addFields({
            name: `Copy Link:`,
            value: `\\<t:${unixTime}:F>`,
        });
        sendMessage(message, { embeds: [Embeds.timestampEmbed] });
    },

    generateTimestampUntil: async (message, words) => {
        const unixTime = await generateTimestampHelper(message, words);
        if (!unixTime) {
            return;
        }
        Embeds.timestampEmbed.setDescription(`<t:${unixTime}:R>`);
        Embeds.timestampEmbed.fields = [];
        Embeds.timestampEmbed.addFields({
            name: `Copy Link:`,
            value: `\\<t:${unixTime}:R>`,
        });
        sendMessage(message, { embeds: [Embeds.timestampEmbed] });
    },

    generateNow: async (message, words) => {
        let date = DateTime.utc();
        tz = await getUserTimezone(message.author.id);
        date = date.setZone(tz, { keepLocalTime: false });
        if (words[0] !== undefined) {
            let success = false;
            ({ date, success } = setTimezoneChangeLocal(
                words[0],
                date,
                success
            ));
            if (!success) {
                sendMessage(message, "Not valid timezone");
                return;
            }
        }
        sendMessage(
            message,
            `\`${date.toLocaleString(DateTime.DATETIME_MED)}\``
        );
    },

    generateUnixTime: async (message, words) => {
        return await generateTimestampHelper(
            message,
            words.slice(0, words.indexOf("-"))
        );
    },

    generateUnixTimeNow: async () => {
        const date = DateTime.utc();
        return parseInt(date.toSeconds());
    },
};

async function generateTimestampHelper(message, words) {
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
            ({ date, success } = mod(word, date, success));
        });
        if (!success) {
            sendMessage(message, "Not following valid formats:" + instructions);
            return;
        }
    }
    return parseInt(date.toSeconds());
}

const dateModifiers = [parseDate, parseTime, setTimezoneKeepLocal];

function setTimezoneKeepLocal(word, date, success) {
    return setTimezone(word, date, success, true);
}

function setTimezoneChangeLocal(word, date, success) {
    return setTimezone(word, date, success, false);
}

function setTimezone(word, date, success, keepLocal) {
    const timezone = getTimezone(word);
    if (timezone !== null) {
        success = true;
        date = date.setZone(timezone, { keepLocalTime: keepLocal });
    }
    return { date, success };
}

function parseTime(word, date, success) {
    timeRegex = /^([0-9]{1,2}):([0-9]{1,2})$/;
    const matches = timeRegex.exec(word);
    if (matches === null) {
        return { date, success }; // error does not match
    }
    const hours = matches[1];
    const minutes = matches[2];
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        success = true;
        date = date.set({ hour: hours, minute: minutes, second: 0 });
    }
    return { date, success };
}

function parseDate(word, date, success) {
    dateRegex = /^([0-9]{1,2})\/([0-9]{1,2})\/?([0-9]{4})?$/;
    const matches = dateRegex.exec(word);
    day = 0;
    month = 0;
    year = 0;
    if (matches === null) {
        isoDateRegex = /^([0-9]{4})\-([0-9]{2})\-([0-9]{2})$/;
        const isoMatches = isoDateRegex.exec(word);
        if (isoMatches === null) {
            return { date, success }; // error does not match
        }
        day = isoMatches[3];
        month = isoMatches[2];
        year = isoMatches[1];
    } else {
        day = matches[1];
        month = matches[2];
        year = matches[3];
    }

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
    return { date, success };
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
