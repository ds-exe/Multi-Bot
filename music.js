const ytdl = require("ytdl-core");
const { hasPermissionRole, hasPermissionUser } = require("./SQLDatabase.js");

const queue = new Map();
let client = null;

module.exports = {
    run: async (command, message, mainClient) => {
        client = mainClient;
        if (
            !(await hasPermissionRole(message, message.member.roles.cache)) &&
            !(await hasPermissionUser(message, message.author.id))
        ) {
            return message.channel.send(
                "You do not have permission to use this command!"
            );
        }
        const serverQueue = queue.get(message.guild.id);
        switch (command) {
            case "play":
                execute(message, serverQueue);
                break;
            case "skip":
                skip(message, serverQueue);
                break;
            case "stop":
                stop(message, serverQueue);
                break;
            case "leave":
                leave(message, serverQueue);
                break;
            default:
                message.channel.send("You need to enter a valid command!");
                break;
        }
    },
};

async function execute(message, serverQueue) {
    const args = message.content.split(" ");
    message.suppressEmbeds(/^-$/.exec(args[2]));

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
            "You need to be in a voice channel to play music!"
        );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
            "I need the permissions to join and speak in your voice channel!"
        );
    }

    const youtube =
        /^(<)?(https:\/\/(www.)?youtu.be\/[0-9a-zA-Z_-]+|https:\/\/(www.)?youtube.com\/watch\?v=[0-9a-zA-Z_-]+)(>)?/;
    const matches = youtube.exec(args[1]);
    if (matches === null) {
        return message.channel.send("Invalid url");
    }
    const songInfo = await ytdl.getInfo(matches[2]);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            let connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(
            `${song.title} has been added to the queue!`
        );
    }
}

async function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");

    if (!serverQueue.songs[0]) {
        return message.channel.send("There is no song that I could stop!");
    }
    message.react("👍");
    if (serverQueue.connection.dispatcher !== null) {
        serverQueue.connection.dispatcher.end();
    } else {
        const voiceChannel = message.member.voice.channel;
        serverQueue.voiceChannel = voiceChannel;
        try {
            let connection = await voiceChannel.join();
            serverQueue.connection = connection;
            serverQueue.songs.shift();
            play(message.guild, serverQueue.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );

    if (!serverQueue)
        return message.channel.send("There is no song that I could stop!");

    if (!serverQueue.songs[0]) {
        return message.channel.send("There is no song that I could stop!");
    }
    serverQueue.songs = [];
    message.react("👍");
    if (serverQueue.connection.dispatcher !== null) {
        serverQueue.connection.dispatcher.end();
    } else {
        serverQueue.voiceChannel.leave();
        queue.delete(message.guild.id);
    }
}

function leave(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );

    if (!serverQueue)
        return message.channel.send("There is no song that I could stop!");

    if (serverQueue.connection.dispatcher !== null) {
        serverQueue.connection.dispatcher.end();
    }
    message.react("👍");
    serverQueue.voiceChannel.leave();
    queue.delete(message.guild.id);
}

async function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    let time = 0;
    while (!song) {
        if (time === 0) {
            client.user.setActivity("!help", { type: "LISTENING" });
            time = new Date().getTime();
        }
        if (!queue.get(guild.id)) {
            return;
        }
        await sleep(2000);
        song = serverQueue.songs[0];
        if (new Date().getTime() - time > 300000) {
            serverQueue.voiceChannel.leave();
            queue.delete(guild.id);
            return;
        }
    }

    client.user.setActivity("Music", { type: "PLAYING" });
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url, { filter: "audioonly", highWaterMark: 1 << 25 }), {
            type: "unknown",
        })
        .once("finish", () => {
            serverQueue.songs.shift();
            //maybe need try statement here for crash
            play(guild, serverQueue.songs[0]);
        })
        .once("error", (error) => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
