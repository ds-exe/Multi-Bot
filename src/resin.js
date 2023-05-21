import { react, sendMessage } from "./utility.js";
import { generateUnixTimeNow } from "./timestamp.js";
import {
    addResinData,
    addResinNotification,
    deleteCustomWarningTimeResin,
    deleteResinData,
    deleteResinNotifications,
    getCustomWarningTimeResin,
    getResinData,
    getResinDataAll,
    setCustomWarningTimeResin,
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
        await deleteResinData(message.author.id, account);
        await deleteResinNotifications(message.author.id, account);
        await deleteCustomWarningTimeResin(message.author.id, account);
        react(message, "👍");
        return;
    }
    if (words[1] === "notify") {
        return await setCustomResin(message, words, game, account);
    }
    if (resin === undefined) {
        return await sendResinData(message, message.author.id, account);
    }

    await setResinNotifications(message, game, account, resin);
    const currentTime = generateUnixTimeNow();
    const secondsUntilFull =
        (games[game]["maxResin"] - resin) * games[game]["resinMins"] * 60;
    const fullTime = currentTime + secondsUntilFull;
    sendMessage(message, {
        embeds: [resinNotificationEmbed(account, resin, fullTime)],
    });
}

async function setResinNotifications(message, game, account, resin) {
    const currentTime = generateUnixTimeNow();
    const secondsUntilFull =
        (games[game]["maxResin"] - resin) * games[game]["resinMins"] * 60;
    const secondsUntilWarning =
        (games[game]["maxResin"] - resin - 20) * games[game]["resinMins"] * 60;
    const fullTime = currentTime + secondsUntilFull;
    const warningTime = currentTime + secondsUntilWarning;

    await deleteResinNotifications(message.author.id, account);
    addResinData(
        message.author.id,
        account,
        game,
        resin,
        currentTime,
        fullTime
    );
    await setCustomResinNotifications(
        message,
        game,
        account,
        resin,
        currentTime,
        fullTime
    );

    if (resin >= games[game]["maxResin"]) {
        return;
    }
    addResinNotification(
        message.author.id,
        account,
        games[game]["maxResin"],
        fullTime,
        fullTime
    );
    if (resin >= games[game]["maxResin"] - 20) {
        return;
    }
    addResinNotification(
        message.author.id,
        account,
        games[game]["maxResin"] - 20,
        warningTime,
        fullTime
    );
}

async function setCustomResinNotifications(
    message,
    game,
    account,
    resin,
    currentTime,
    fullTime
) {
    const customWarningTimeResin = await getCustomWarningTimeResin(
        message.author.id,
        account
    );
    if (customWarningTimeResin < 20) {
        return;
    }
    for (
        let customResin = customWarningTimeResin;
        customResin <= games[game]["maxResin"];
        customResin += customWarningTimeResin
    ) {
        if (resin >= customResin) {
            continue;
        }
        const secondsUntilCustomWarning =
            (customResin - resin) * games[game]["resinMins"] * 60;
        const customWarningTime = currentTime + secondsUntilCustomWarning;

        addResinNotification(
            message.author.id,
            account,
            customResin,
            customWarningTime,
            fullTime
        );
    }
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

async function setCustomResin(message, words, game, account) {
    const resinRegex = /^([0-9]+)$/;
    const resinMatches = resinRegex.exec(words[2]);
    if (resinMatches === null) {
        const customResinCurrent = await getCustomWarningTimeResin(
            message.author.id,
            account
        );
        return sendMessage(
            message,
            `Current custom resin amount: ${customResinCurrent}`
        );
    }
    const customResin = Number(resinMatches[1]);
    if (customResin < 0 || customResin > games[game]["maxResin"]) {
        return sendMessage(message, "Resin amount not in valid range");
    }
    await setCustomWarningTimeResin(message, account, customResin);
    react(message, "👍");
    const rows = await getResinData(message.author.id, account);
    if (rows.length <= 0) {
        return;
    }
    setResinNotifications(
        message,
        game,
        account,
        generateCurrentResin(rows[0])
    );
}
