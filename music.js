const { Player } = require("discord-music-player");
const { hasPermissionRole, hasPermissionUser } = require("./SQLDatabase.js");

let client = null;

module.exports = {
    init: (mainClient) => {
        client = mainClient;
        const player = new Player(client, { leaveOnEnd: false });
        client.player = player;
        client.player
            // Emitted when channel was empty.
            .on("channelEmpty", (queue) =>
                queue.data.channel.send(
                    `Everyone left the Voice Channel, queue ended.`
                )
            )
            // Emitted when a song was added to the queue.
            .on("songAdd", (queue, song) =>
                queue.data.channel.send(`Song ${song} was added to the queue.`)
            )
            // Emitted when a song changed.
            .on("songChanged", (queue, newSong, oldSong) =>
                queue.data.channel.send(`${newSong} is now playing.`)
            )
            // Emitted when a first song in the queue started playing.
            .on("songFirst", (queue, song) =>
                queue.data.channel.send(`Started playing ${song}.`)
            )
            // Emitted when someone disconnected the bot from the channel.
            .on("clientDisconnect", (queue) =>
                queue.data.channel.send(
                    `I was kicked from the Voice Channel, queue ended.`
                )
            )
            // Emitted when there was an error in runtime
            .on("error", (error, queue) => {
                queue.data.channel.send(
                    `Error: ${error} in ${queue.guild.name}`
                );
            });
    },

    run: async (command, message) => {
        if (
            !(await hasPermissionRole(message, message.member.roles.cache)) &&
            !(await hasPermissionUser(message, message.author.id))
        ) {
            return message.channel.send(
                "You do not have permission to use this command!"
            );
        }
        let guildQueue = client.player.getQueue(message.guild.id);
        switch (command) {
            case "play":
                play(message, guildQueue);
                break;
            case "skip":
                skip(message, guildQueue);
                break;
            case "stop":
                stop(message, guildQueue);
                break;
            default:
                message.channel.send("You need to enter a valid command!");
                break;
        }
    },
};

async function play(message, guildQueue) {
    const args = message.content.split(" ");
    message.suppressEmbeds(/^-$/.exec(args[2]));

    const youtube =
        /^(<)?(https:\/\/(www.)?youtu.be\/[0-9a-zA-Z_-]+|https:\/\/(www.)?youtube.com\/watch\?v=[0-9a-zA-Z_-]+)(>)?/;
    const matches = youtube.exec(args[1]);
    if (matches === null) {
        return message.channel.send("Invalid url");
    }

    let queue = client.player.createQueue(message.guild.id, {
        data: { channel: message.channel },
    });
    await queue.join(message.member.voice.channel);
    let song = await queue.play(matches[2]).catch((_) => {
        if (!guildQueue) queue.stop();
    });
}

function skip(message, guildQueue) {
    if (guildQueue === undefined) {
        message.channel.send("Nothing to skip");
        return;
    }
    guildQueue.skip();
}

function stop(message, guildQueue) {
    if (guildQueue === undefined) {
        message.channel.send("Nothing to stop");
        return;
    }
    guildQueue.stop();
}
