import { sendMessage } from "./utility.js";
import { generateUnixTimeNow } from "./timestamp.js";
import { addResinData, addResinNotification } from "./SQLDatabase.js";

const games = {
    hsr: { maxResin: 180, resinMins: 6 },
    genshin: { maxResin: 160, resinMins: 8 },
};

export function resin(message, words) {
    if (words[0] === undefined) {
        return sendMessage(message, "Display all resin counters for user");
    }
    if (words[0] === "help") {
        return sendMessage(message, "Help message for resin");
    }

    let game = undefined;
    let account = undefined;
    let resin = undefined;
    ({ game, account, resin } = getGameAndResinData(words));

    if (game === undefined || account === undefined) {
        return sendMessage(message, "Resin error message");
    }
    if (resin === undefined) {
        return sendMessage(message, "Display resin counters for game");
    }

    const currentTime = generateUnixTimeNow();
    const secondsUntilFull =
        (games[game]["maxResin"] - resin) * games[game]["resinMins"] * 60;
    const secondsUntilWarning =
        (games[game]["maxResin"] - resin - 20) * games[game]["resinMins"] * 60;
    const fullTime = currentTime + secondsUntilFull;
    const warningTime = currentTime + secondsUntilWarning;

    //Send everything to database
    //Wipe current account notifications
    //Add new ones (including custom)
    addResinData(
        message.author.id,
        account,
        game,
        resin,
        currentTime,
        fullTime
    );
    addResinNotification(message.author.id, account, 60, warningTime, fullTime);
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
    sendMessage(message, `Set resin count for ${account} as ${resin}`);
    sendMessage(message, `Full <t:${fullTime}:R>`);
    sendMessage(message, `Warning <t:${warningTime}:R>`);
    //sendMessage(message, { embeds: [timestampEmbed(`<t:${unixTime}:R>`)] });
}

function getGameAndResinData(words) {
    let game = undefined;
    let account = undefined;
    let resin = undefined;

    const gameRegex = /^([A-z]+)[0-9]?$/;
    const gameMatches = gameRegex.exec(words[0]);
    if (gameMatches === null) {
        return { game, account, resin };
    }
    game = gameMatches[1];
    account = gameMatches[0];

    if (!(game in games)) {
        return { game: undefined, account: undefined, resin };
    }
    if (words[1] === undefined) {
        return { game, account, resin };
    }

    const resinRegex = /^([0-9]+)$/;
    const resinMatches = resinRegex.exec(words[1]);
    if (resinMatches === null) {
        return { game: undefined, account: undefined, resin };
    }
    resin = Number(resinMatches[1]);

    return { game, account, resin };
}
