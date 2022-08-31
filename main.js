const config = require("./config.json");
const { Client, Intents } = require("discord.js");
const Timestamp = require("./timestamp.js");
const {
    setTimezone,
    getUserTimezone,
    open,
    close,
} = require("./SQLDatabase.js");
const Reddit = require("./reddit.js");
const Music = require("./music");
const Permissions = require("./permissions.js");
const Embeds = require("./embeds.js");
const { isDM, sendMessage } = require("./utility.js");
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.DIRECT_MESSAGES,
    ],
    partials: [
        "CHANNEL", // Required to receive DMs
    ],
});

const token = config.token;
const prefix = config.prefix;
const botOwner = config.owner;

client.on("ready", () => {
    console.log("Connected as " + client.user.tag);
    //Setting activity: "Now listening to !help"
    client.user.setActivity(`${config.prefix}help`, { type: "LISTENING" });
    open();
    Music.init(client);
});

client.on("messageCreate", async (message) => {
    if (message.partial) {
        console.log("received partial");
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
                .has("SEND_MESSAGES")
        ) {
            return;
        }
        try {
            await next(message);
        } catch (e) {
            sendMessage(message, "An unknown error occured");
            console.log("crash");
        }
    }
});

function isCommunicationDisabled(message) {
    if (isDM(message)) {
        return false;
    }
    member = message.guild.members.cache.find(
        (member) => member.user === message.client.user
    );

    return member.isCommunicationDisabled();
}

async function next(message) {
    const isBotOwner = message.author.id === botOwner;
    const targetChannel = client.channels.cache.get(message.channel.id);
    msg = message.content;
    msg = msg.replace(`${prefix}`, "").toLowerCase();
    words = msg.split(" ");
    console.log(
        message.author.username,
        message.author.id,
        message.content.split(" ")
    );

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
            await Timestamp.generateTimestamp(message, words);
            break;
        case "until":
            await Timestamp.generateTimestampUntil(message, words);
            break;
        case "now":
            await Timestamp.generateNow(message, words);
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
            await Reddit.loadPage(words, message);
            break;
        case "play":
            await Music.run(command, message);
            break;
        case "skip":
            await Music.run(command, message);
            break;
        case "stop":
            await Music.run(command, message);
            break;
        case "leave":
            await Music.run(command, message);
            break;
        case "shuffle":
            await Music.run(command, message);
            break;
        case "loop":
            await Music.run(command, message);
            break;
        case "perms":
            Permissions.run(message, words);
            break;
        case "shutdown":
            if (isBotOwner) {
                sendMessage(message, "Shutting down");
                close();
                client.destroy();
                process.exit(1);
            }
            break;
        case "help":
            sendMessage(message, { embeds: [Embeds.helpEmbed] });
            break;
        default:
            sendMessage(message, "Syntax Error");
            break;
    }
}

client.on("error", console.error);
client.login(token);
