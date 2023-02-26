const config = require("./config.json");
const Discord = require("discord.js");
const Timestamp = require("./timestamp.js");
const client = new Discord.Client();

const token = config.token;
const prefix = config.prefix;
const botOwner = config.owner;
const botID = config.botID;

client.on("ready", () => {
    console.log("Connected as " + client.user.tag);
    //Setting activity: "Now listening to !help"
    client.user.setActivity("!help", { type: "LISTENING" });
});

client.on("message", (message) => {
    if (message.content.startsWith(prefix) && message.author.id !== botID) {
        next(message);
    }
});

async function next(message) {
    let isBotOwner = message.author.id === botOwner;
    let targetChannel = client.channels.cache.get(message.channel.id);
    msg = message.content;
    msg = msg.replace(`${prefix}`, "").toLowerCase();

    //words = msg.replace(/[\|&;\$%@"<>\(\)\+,]/g, "").split(" ");
    words = msg.split(" ");
    command = words[0];

    switch (command) {
        case "time":
        case "date":
            Timestamp.generateTimestamp(targetChannel, words);
            break;
        case "stop":
            if (isBotOwner) {
                message.channel.send("Shutting down").then((m) => {
                    client.destroy();
                });
            } else {
                targetChannel.send("Error only available to bot owner");
            }
            break;
        case "help":
            if (isBotOwner) {
                targetChannel.send("Available commands:\n!time\n!date\n!stop");
            } else {
                targetChannel.send("Available commands:\n!time\n!date");
            }
            break;
        default:
            targetChannel.send("Syntax Error");
            break;
    }
}

client.on("error", console.error);
client.login(token);
