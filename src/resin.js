import { react, sendMessage } from "./utility.js";
import { generateUnixTimeNow } from "./timestamp.js";
import {
    addResinData,
    addResinNotification,
    deleteResinData,
    getResinData,
    getResinDataAll,
} from "./SQLDatabase.js";
import { resinNotificationEmbed } from "./embeds.js";

const games = {
    hsr: { maxResin: 180, resinMins: 6 },
    genshin: { maxResin: 160, resinMins: 8 },
};

export async function resin(message, words) {
    if (words[0] === undefined) {
        return await sendResinDataAll(message, message.author.id);
    }
    if (words[0] === "help") {
        return sendMessage(message, "Help message for resin");
    }

    const { game, account, resin } = getGameAndResinData(words);

    if (game === undefined || account === undefined) {
        return sendMessage(message, "Resin error message");
    }
    if (words[1] === "delete") {
        deleteResinData(message.author.id, account);
        react(message, "👍");
        return;
    }
    if (resin === undefined) {
        return await sendResinData(message, message.author.id, account);
    }

    const customWarningTimeResin = 60; //Make editable option
    const currentTime = generateUnixTimeNow();
    const secondsUntilFull =
        (games[game]["maxResin"] - resin) * games[game]["resinMins"] * 60;
    const secondsUntilWarning =
        (games[game]["maxResin"] - resin - 20) * games[game]["resinMins"] * 60;
    const secondsUntilCustomWarning =
        (customWarningTimeResin - resin) * games[game]["resinMins"] * 60;
    const fullTime = currentTime + secondsUntilFull;
    const warningTime = currentTime + secondsUntilWarning;
    const customWarningTime = currentTime + secondsUntilCustomWarning;

    //Wipe current account notifications, not needed unless adding custom option
    addResinData(
        message.author.id,
        account,
        game,
        resin,
        currentTime,
        fullTime
    );
    addResinNotification(
        message.author.id,
        account,
        customWarningTimeResin,
        customWarningTime,
        fullTime
    );
    addResinNotification(
        message.author.id,
        account,
        games[game]["maxResin"] - 20,
        warningTime,
        fullTime
    );
    addResinNotification(
        message.author.id,
        account,
        games[game]["maxResin"],
        fullTime,
        fullTime
    );
    sendMessage(
        message,
        `Set resin count for ${account} as ${resin}\nFull <t:${fullTime}:R>`
    );
}

function getGameAndResinData(words) {
    const gameRegex = /^([A-z]+)[0-9]?$/;
    const gameMatches = gameRegex.exec(words[0]);
    if (gameMatches === null) {
        return {};
    }
    const game = gameMatches[1];
    const account = gameMatches[0];

    if (!(game in games)) {
        return {};
    }
    if (words[1] === undefined) {
        return { game, account };
    }

    const resinRegex = /^([0-9]+)$/;
    const resinMatches = resinRegex.exec(words[1]);
    if (resinMatches === null) {
        return { game, account };
    }
    const resin = Number(resinMatches[1]);

    return { game, account, resin };
}

async function sendResinData(message, userID, account) {
    const rows = await getResinData(userID, account);
    if (rows.length <= 0) {
        return sendMessage(message, "No resin data found");
    }
    rows.forEach(async (row) => {
        sendMessage(message, {
            embeds: [
                resinNotificationEmbed(
                    row.account,
                    generateCurrentResin(row),
                    row.resinCapTimestamp
                ),
            ],
        });
    });
}

async function sendResinDataAll(message, userID) {
    const rows = await getResinDataAll(userID);
    if (rows.length <= 0) {
        return sendMessage(message, "No resin data found");
    }
    rows.forEach(async (row) => {
        sendMessage(message, {
            embeds: [
                resinNotificationEmbed(
                    row.account,
                    generateCurrentResin(row),
                    row.resinCapTimestamp
                ),
            ],
        });
    });
}

function generateCurrentResin(row) {
    return Math.min(
        Math.floor(
            row.startResin +
                (generateUnixTimeNow() - row.startTimestamp) /
                    games[row.game]["resinMins"] /
                    60
        ),
        games[row.game]["maxResin"]
    );
}