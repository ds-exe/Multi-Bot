const { Player } = require("discord-music-player");
const { isDM, sendMessage } = require("./utility.js");
const { hasPermissionRole, hasPermissionUser } = require("./SQLDatabase.js");

let client = null;

module.exports = {
    init: (mainClient) => {
        client = mainClient;
        const player = new Player(client, {
            timeout: 900000, // 15 mins
        });
        client.player = player;
        client.player
            // Emitted when channel was empty.
            .on("channelEmpty", (queue) =>
                sendMessage(
                    queue.data.message,
                    `Everyone left the Voice Channel, queue ended.`
                )
            )
            // Emitted when a song was added to the queue.
            .on("songAdd", (queue, song) => {
                sendMessage(
                    queue.data.message,
                    `Song ${song} was added to the queue.`
                );
            })
            // Emitted when a song changed.
            .on("songChanged", async (queue, newSong, oldSong) => {
                if (
                    queue.data.previousMessage !== undefined &&
                    queue.data.previousMessage !== null
                ) {
                    queue.data.previousMessage.delete();
                }
                queue.data.previousMessage = await sendMessage(
                    queue.data.message,
                    `${newSong} is now playing.`
                );
            })
            // Emitted when a first song in the queue started playing.
            .on("songFirst", async (queue, song) => {
                queue.data.previousMessage = await sendMessage(
                    queue.data.message,
                    `${song} is now playing.`
                );
            })
            // Emitted when someone disconnected the bot from the channel.
            .on("clientDisconnect", (queue) =>
                sendMessage(
                    queue.data.message,
                    `I was kicked from the Voice Channel, queue ended.`
                )
            )
            // Emitted when there was an error in runtime
            .on("error", (error, queue) => {
                if (error === "Status code: 410") {
                    sendMessage(
                        queue.data.message,
                        `<@${queue.nowPlaying.requestedBy}> Unable to play age restricted videos`
                    );
                } else {
                    sendMessage(
                        queue.data.message,
                        `Error: ${error} in ${queue.guild.name}`
                    );
                }
            });
    },

    run: async (command, message) => {
        if (isDM(message)) {
            sendMessage(message, "Can't use this command in DM's");
            return;
        }
        if (
            !(await hasPermissionRole(message, message.member.roles.cache)) &&
            !(await hasPermissionUser(message, message.author.id))
        ) {
            return sendMessage(
                message,
                "You do not have permission to use this command!"
            );
        }
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
            return sendMessage(
                message,
                "You need to be in a voice channel to use music commands!"
            );
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return sendMessage(
                message,
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
                sendMessage(message, "You need to enter a valid command!");
                break;
        }
    },
};

async function play(message, guildQueue) {
    const args = message.content.split(" ");
    message.suppressEmbeds(/^-$/.exec(args[2]));

    let { match, isPlaylist } = validateUrl(args[1], message);
    if (match === null) {
        return;
    }
    let queue = client.player.createQueue(message.guild.id, {
        data: { message: message },
    });
    await queue.join(message.member.voice.channel);
    if (isPlaylist) {
        let song = await queue
            .playlist(match, { requestedBy: message.author.id })
            .catch((_) => {});
    } else {
        let song = await queue
            .play(match, { requestedBy: message.author.id })
            .catch((_) => {});
    }
}

function validateUrl(url, message) {
    let isPlaylist = false;
    const youtube =
        /^(<)?(https:\/\/(www.)?youtu.be\/[0-9a-zA-Z_-]+|https:\/\/(www.)?youtube.com\/watch\?v=[0-9a-zA-Z_-]+)(>)?/;
    let matches = youtube.exec(url);
    if (matches !== null) {
        return { match: matches[2], isPlaylist };
    }

    const spotify =
        /^(<)?(https:\/\/open.spotify.com\/track\/[a-zA-Z0-9-_()]+\?si=[a-zA-Z0-9-_()]+)(>)?/;
    matches = spotify.exec(url);
    if (matches !== null) {
        return { match: matches[2], isPlaylist };
    }
    return validatePlaylistUrl(url, message);
}

function validatePlaylistUrl(url, message) {
    let isPlaylist = true;
    const youtube =
        /^(<)?(https:\/\/(www.)?youtube.com\/playlist\?list=[0-9a-zA-Z_-]+)(>)?/;
    let matches = youtube.exec(url);
    if (matches !== null) {
        return { match: matches[2], isPlaylist };
    }

    const spotify =
        /^(<)?(https:\/\/open.spotify.com\/playlist\/[a-zA-Z0-9-_()]+\?si=[a-zA-Z0-9-_()]+)(>)?/;
    matches = spotify.exec(url);
    if (matches !== null) {
        return { match: matches[2], isPlaylist };
    }
    sendMessage(message, "Invalid url");
    return null;
}

function skip(message, guildQueue) {
    if (guildQueue === undefined) {
        sendMessage(message, "I need to be in a voice channel to skip");
        return;
    }
    if (!guildQueue.isPlaying) {
        sendMessage(message, "Nothing to skip");
        return;
    }
    guildQueue.skip();
    message.react("👍");
}

function stop(message, guildQueue) {
    if (guildQueue === undefined) {
        sendMessage(message, "I need to be in a voice channel to stop");
        return;
    }
    if (!guildQueue.isPlaying) {
        sendMessage(message, "Nothing to stop");
        return;
    }
    guildQueue.clearQueue();
    guildQueue.skip();
    message.react("👍");
}

function leave(message, guildQueue) {
    if (guildQueue === undefined) {
        sendMessage(message, "I need to be in a voice channel to leave");
        return;
    }
    guildQueue.leave();
    message.react("👍");
}
