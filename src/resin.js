import { sendMessage } from "./utility.js";
import { generateUnixTimeNow } from "./timestamp.js";

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
    let gameInstance = undefined;
    let resin = undefined;
    ({ game, gameInstance, resin } = getGameAndResinData(words));

    if (game === undefined || gameInstance === undefined) {
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
    sendMessage(message, `Set resin count for ${gameInstance} as ${resin}`);
    sendMessage(message, `Full <t:${fullTime}:R>`);
    sendMessage(message, `Warning <t:${warningTime}:R>`);
    //sendMessage(message, { embeds: [timestampEmbed(`<t:${unixTime}:R>`)] });
}

function getGameAndResinData(words) {
    let game = undefined;
    let gameInstance = undefined;
    let resin = undefined;

    const gameRegex = /^([A-z]+)[0-9]?$/;
    const gameMatches = gameRegex.exec(words[0]);
    if (gameMatches === null) {
        return { game, gameInstance, resin };
    }
    game = gameMatches[1];
    gameInstance = gameMatches[0];

    if (!(game in games)) {
        return { game: undefined, gameInstance: undefined, resin };
    }
    if (words[1] === undefined) {
        return { game, gameInstance, resin };
    }

    const resinRegex = /^([0-9]+)$/;
    const resinMatches = resinRegex.exec(words[1]);
    if (resinMatches === null) {
        return { game: undefined, gameInstance: undefined, resin };
    }
    resin = Number(resinMatches[1]);

    return { game, gameInstance, resin };
}
