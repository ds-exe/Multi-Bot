const config = require("./config.json");
const { Client, Intents } = require("discord.js");
const Timestamp = require("./timestamp.js");
const { setTimezone, getTimezone, open, close } = require("./SQLDatabase.js");
const Reddit = require("./reddit.js");
const Music = require("./music");
const Permissions = require("./permissions.js");
const Embeds = require("./embeds.js");
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});

const token = config.token;
const prefix = config.prefix;
const botOwner = config.owner;

client.on("ready", () => {
    console.log("Connected as " + client.user.tag);
    //Setting activity: "Now listening to !help"
    client.user.setActivity("!help", { type: "LISTENING" });
    open();
    Music.init(client);
});

client.on("messageCreate", (message) => {
    if (message.content.startsWith(prefix) && !message.author.bot) {
        member = message.guild.members.cache.find(
            (member) => member.user === message.client.user
        );

        if (member.isCommunicationDisabled()) {
            return;
        }
        if (
            !message.channel
                .permissionsFor(message.client.user)
                .has("SEND_MESSAGES")
        ) {
            return;
        }
        next(message);
    }
});

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
        return message.channel.send("Invalid command");
    }
    words.shift();
    const command = matches[1];
    switch (command) {
        case "time":
        case "date":
            Timestamp.generateTimestamp(message, words);
            break;
        case "timezone":
            if (words[0] === undefined) {
                message.channel.send(
                    "Your timezone is: " +
                        (await getTimezone(message.author.id))
                );
            } else {
                setTimezone(message, words[0]);
            }
            break;
        case "reddit":
            Reddit.loadPage(words, message);
            break;
        case "play":
            Music.run(command, message);
            break;
        case "skip":
            Music.run(command, message);
            break;
        case "stop":
            Music.run(command, message);
            break;
        case "leave":
            Music.run(command, message);
            break;
        case "perms":
            Permissions.run(message, words);
            break;
        case "quit":
            if (isBotOwner) {
                message.channel.send("Shutting down").then((m) => {
                    close();
                    client.destroy();
                    process.exit(1);
                });
            }
            break;
        case "help":
            targetChannel.send(Embeds.helpEmbed);
            break;
        default:
            targetChannel.send("Syntax Error");
            break;
    }
}

client.on("error", console.error);
client.login(token);
