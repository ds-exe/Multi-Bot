const { Player } = require("discord-music-player");
const { isDM } = require("./utility.js");
const { hasPermissionRole, hasPermissionUser } = require("./SQLDatabase.js");

let client = null;

module.exports = {
    init: async (mainClient) => {
        client = mainClient;
        const player = new Player(client, {
            timeout: 900000, // 15 mins
        });
        client.player = player;
        client.player
            // Emitted when channel was empty.
            .on("channelEmpty", (queue) =>
                queue.data.channel
                    .send(`Everyone left the Voice Channel, queue ended.`)
                    .catch((err) => {})
            )
            // Emitted when a song was added to the queue.
            .on("songAdd", (queue, song) =>
                queue.data.channel
                    .send(`Song ${song} was added to the queue.`)
                    .catch((err) => {})
            )
            // Emitted when a song changed.
            .on("songChanged", (queue, newSong, oldSong) =>
                queue.data.channel
                    .send(`${newSong} is now playing.`)
                    .catch((err) => {})
            )
            // Emitted when a first song in the queue started playing.
            .on("songFirst", (queue, song) =>
                queue.data.channel
                    .send(`Started playing ${song}.`)
                    .catch((err) => {})
            )
            // Emitted when someone disconnected the bot from the channel.
            .on("clientDisconnect", (queue) =>
                queue.data.channel
                    .send(`I was kicked from the Voice Channel, queue ended.`)
                    .catch((err) => {})
            )
            // Emitted when there was an error in runtime
            .on("error", (error, queue) => {
                queue.data.channel
                    .send(`Error: ${error} in ${queue.guild.name}`)
                    .catch((err) => {});
            });
    },

    run: async (command, message) => {
        if (isDM(message)) {
            await message.channel.send("Can't use this command in DM's");
            return;
        }
        if (
            !(await hasPermissionRole(message, message.member.roles.cache)) &&
            !(await hasPermissionUser(message, message.author.id))
        ) {
            return await message.channel.send(
                "You do not have permission to use this command!"
            );
        }
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
            return await message.channel.send(
                "You need to be in a voice channel to use music commands!"
            );
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return await message.channel.send(
                "I need the permissions to join and speak in your voice channel!"
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
            case "leave":
                leave(message, guildQueue);
                break;
            default:
                await message.channel.send(
                    "You need to enter a valid command!"
                );
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
        return await message.channel.send("Invalid url");
    }

    let queue = client.player.createQueue(message.guild.id, {
        data: { channel: message.channel },
    });
    await queue.join(message.member.voice.channel);
    let song = await queue.play(matches[2]).catch((_) => {});
}

async function skip(message, guildQueue) {
    if (guildQueue === undefined) {
        await message.channel.send("I need to be in a voice channel to skip");
        return;
    }
    if (!guildQueue.isPlaying) {
        await message.channel.send("Nothing to skip");
        return;
    }
    guildQueue.skip();
    message.react("👍");
}

async function stop(message, guildQueue) {
    if (guildQueue === undefined) {
        await message.channel.send("I need to be in a voice channel to stop");
        return;
    }
    if (!guildQueue.isPlaying) {
        await message.channel.send("Nothing to stop");
        return;
    }
    guildQueue.clearQueue();
    guildQueue.skip();
    message.react("👍");
}

async function leave(message, guildQueue) {
    if (guildQueue === undefined) {
        await message.channel.send("I need to be in a voice channel to leave");
        return;
    }
    guildQueue.leave();
    message.react("👍");
}
