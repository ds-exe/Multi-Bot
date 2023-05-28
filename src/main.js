import { normalize } from "node:path";
import { readFile } from "fs/promises";
import {
    Client,
    GatewayIntentBits,
    Partials,
    PermissionsBitField,
    ActivityType,
    Events,
} from "discord.js";
import {
    generateUnixTimeNow,
    generateTimestamp,
    generateTimestampUntil,
    generateNow,
    generateUnixTime,
} from "./timestamp.js";
import {
    setTimezone,
    getUserTimezone,
    open,
    close,
    addNotification,
    sendNotifications,
    sendResinNotifications,
} from "./SQLDatabase.js";
import { loadPage } from "./reddit.js";
import { init as musicInit, run as musicRun } from "./music.js";
import { init as permsInit, run as permsRun } from "./permissions.js";
import { init as embedsInit, musicEmbed, helpEmbed } from "./embeds.js";
import { isDM, sendMessage } from "./utility.js";
import { handleButtons, resin } from "./resin.js";
import { send } from "node:process";

const config = JSON.parse(
    await readFile(new URL(normalize("./../config.json"), import.meta.url))
);
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [
        Partials.Channel, // Required to receive DMs
    ],
});

const token = config.token;
const prefix = config.prefix;
const botOwner = config.owner;
const errorChannelID = config.errorChannelID;
const enableNotifications = config.enableNotifications;

client.on("ready", () => {
    console.log("Connected as " + client.user.tag);
    //Setting activity: "Now listening to !help"
    client.user.setPresence({
        status: "online",
        activities: [
            {
                name: `${config.prefix}help`,
                type: ActivityType.Listening,
            },
        ],
    });
    open();
    musicInit(client);
    permsInit(client);
    embedsInit(client);
    setInterval(async () => {
        sendNotifications(client, generateUnixTimeNow());
    }, 1000 * 30);
    setInterval(async () => {
        sendResinNotifications(client, generateUnixTimeNow());
    }, 1000 * 30);
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        await handleButtons(interaction);
    } catch (e) {
        reply(interaction, "An unknown error occured");
        const errorChannel = await client.channels
            .fetch(errorChannelID)
            .catch((err) => {});
        if (!errorChannel) {
            return;
        }
        sendMessage(
            {
                channel: errorChannel,
            },
            `\`\`\`${e.stack}\`\`\``
        );
    }
});

client.on("messageCreate", async (message) => {
    if (message.partial) {
        return;
    }
    if (isCommunicationDisabled(message)) {
        return;
    }
    if (message.content.startsWith(prefix) && !message.author.bot) {
        if (
            message.channel.permissionsFor &&
            !message.channel
                .permissionsFor(message.client.user)
                .has(PermissionsBitField.Flags.SendMessages)
        ) {
            return;
        }
        try {
            await next(message);
        } catch (e) {
            sendMessage(message, "An unknown error occured");
            const errorChannel = await client.channels
                .fetch(errorChannelID)
                .catch((err) => {});
            if (!errorChannel) {
                return;
            }
            sendMessage(
                {
                    channel: errorChannel,
                },
                `\`\`\`${e.stack}\`\`\``
            );
        }
    }
});

function isCommunicationDisabled(message) {
    if (isDM(message)) {
        return false;
    }
    let member = message.guild.members.cache.find(
        (member) => member.user === message.client.user
    );

    return member.isCommunicationDisabled();
}

async function next(message) {
    if (!isDM(message)) {
        message.suppressEmbeds(true);
    }
    message.content = message.content.replace(`${prefix} `, `${prefix}`);
    const isBotOwner = message.author.id === botOwner;
    let msg = message.content;
    msg = msg.replace(`${prefix}`, "").toLowerCase();
    let words = msg.split(" ");

    const commands = /^([a-z]+)$/;
    const matches = commands.exec(words[0]);
    if (matches === null) {
        return sendMessage(message, "Invalid command");
    }
    words.shift();
    const command = matches[1];
    switch (command) {
        case "time":
        case "date":
            await generateTimestamp(message, words);
            break;
        case "until":
            await generateTimestampUntil(message, words);
            break;
        case "now":
            await generateNow(message, words);
            break;
        case "notify":
            if (!enableNotifications) {
                return sendMessage(message, "Notifications Disabled");
            }
            const time = await generateUnixTime(message, words);
            if (!time) {
                break;
            }
            addNotification(
                message.author.id,
                time,
                words.slice(words.indexOf("-") + 1).join(" "),
                message
            );
            break;
        case "timezone":
            if (words[0] === undefined) {
                sendMessage(
                    message,
                    "Your timezone is: " +
                        (await getUserTimezone(message.author.id))
                );
            } else {
                setTimezone(message, words[0]);
            }
            break;
        case "reddit":
            await loadPage(words, message);
            break;
        case "play":
        case "skip":
        case "stop":
        case "leave":
        case "shuffle":
        case "repeat":
        case "setvolume":
        case "nowplaying":
            await musicRun(command, message);
            break;
        case "perms":
            await permsRun(message, words);
            break;
        case "restart":
            if (isBotOwner) {
                await sendMessage(message, "Restarting");
                close();
                client.destroy();
                process.exit(1);
            }
            break;
        case "music":
            sendMessage(message, { embeds: [musicEmbed] });
            break;
        case "resin":
            await resin(message, words);
            break;
        case "help":
            sendMessage(message, { embeds: [helpEmbed] });
            break;
        default:
            sendMessage(message, "Syntax Error");
            break;
    }
}

client.on("error", console.error);
client.login(token);
