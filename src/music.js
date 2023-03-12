import { Player } from "discord-music-player";
import { isDM, sendMessage, react } from "./utility.js";
import { hasPermissionRole, hasPermissionUser } from "./SQLDatabase.js";
import { trackAdded, trackPlaying, playlistAdded } from "./embeds.js";
import { PermissionsBitField } from "discord.js";

let client = null;

export function init(mainClient) {
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
            if (song.data && song.data.errored) {
                return;
            }
            if (queue.repeatMode !== 0) {
                return;
            }
            sendMessage(queue.data.message, {
                embeds: [trackAdded(song)],
            });
        })
        .on("playlistAdd", (queue, playlist) => {
            sendMessage(queue.data.message, {
                embeds: [playlistAdded(playlist)],
            });
        })
        // Emitted when a song changed.
        .on("songChanged", async (queue, newSong, oldSong) => {
            if (queue.data.previousMessage) {
                queue.data.previousMessage.delete();
            }
            queue.data.previousMessage = await sendMessage(queue.data.message, {
                embeds: [trackPlaying(newSong.name, newSong.url)],
            });
        })
        // Emitted when a first song in the queue started playing.
        .on("songFirst", async (queue, song) => {
            queue.data.previousMessage = await sendMessage(queue.data.message, {
                embeds: [trackPlaying(song.name, song.url)],
            });
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
            handleError(error, queue);
        });
}

export async function run(command, message) {
    if (isDM(message)) {
        sendMessage(message, "Can't use this command in DM's");
        return;
    }
    if (
        !(await hasPermissionRole(
            message,
            message.member.roles.cache,
            message.guild.id
        )) &&
        !(await hasPermissionUser(message, message.author.id, message.guild.id))
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
    if (
        !permissions.has(PermissionsBitField.Flags.Connect) ||
        !permissions.has(PermissionsBitField.Flags.Speak)
    ) {
        return sendMessage(
            message,
            "I need the permissions to join and speak in your voice channel!"
        );
    }

    let guildQueue = client.player.getQueue(message.guild.id);
    switch (command) {
        case "play":
            await play(message);
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
        case "shuffle":
            shuffle(message, guildQueue);
            break;
        case "loop":
            loop(message, guildQueue);
            break;
        case "setvolume":
            setVolume(message, guildQueue);
            break;
        default:
            sendMessage(message, "You need to enter a valid command!");
            break;
    }
}

async function play(message) {
    const args = message.content.split(" ");
    args.shift();

    let shuffle = false;
    if (args[0] === "shuffle") {
        shuffle = true;
        args.shift();
    }
    if (args[0] === undefined) {
        sendMessage(message, "Invalid url/query");
        return;
    }
    let { match, isPlaylist } = validateUrl(args[0], message);
    if (match === null) {
        return;
    }
    let queue = client.player.createQueue(message.guild.id, {
        data: { message: message },
    });
    await queue.join(message.member.voice.channel);
    if (isPlaylist) {
        let song = await queue.playlist(match, {
            requestedBy: message.author.id,
            shuffle: shuffle,
        });
    } else {
        let song = await queue.play(match, { requestedBy: message.author.id });
    }
}

function validateUrl(url, message) {
    const youtube =
        /^(<)?(https:\/\/(www.)?youtu.be\/[0-9a-zA-Z_-]+|https:\/\/(www.)?youtube.com\/watch\?v=[0-9a-zA-Z_-]+)(>)?/;
    let matches = youtube.exec(url);
    if (matches !== null) {
        return { match: matches[2], isPlaylist: false };
    }

    const spotify =
        /^(<)?(https:\/\/open.spotify.com\/track\/[a-zA-Z0-9-_()]+\?si=[a-zA-Z0-9-_()]+)(>)?/;
    matches = spotify.exec(url);
    if (matches !== null) {
        return { match: matches[2], isPlaylist: false };
    }
    return validatePlaylistUrl(url, message);
}

function validatePlaylistUrl(url, message) {
    const youtube =
        /^(<)?(https:\/\/(www.)?youtube.com\/playlist\?list=[0-9a-zA-Z_-]+)(>)?/;
    let matches = youtube.exec(url);
    if (matches !== null) {
        return { match: matches[2], isPlaylist: true };
    }

    const spotify =
        /^(<)?(https:\/\/open.spotify.com\/playlist\/[a-zA-Z0-9-_()]+\?si=[a-zA-Z0-9-_()]+)(>)?/;
    matches = spotify.exec(url);
    if (matches !== null) {
        return { match: matches[2], isPlaylist: true };
    }
    return validateSearch(url, message);
}

function validateSearch(query, message) {
    const search = /^([a-zA-Z0-9-_() ]+)$/;
    let matches = search.exec(query);
    if (matches !== null) {
        return { match: matches[1], isPlaylist: false };
    }
    sendMessage(message, "Invalid url/query");
    return { match: null };
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
    react(message, "👍");
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
    react(message, "👍");
}

function leave(message, guildQueue) {
    if (guildQueue === undefined) {
        sendMessage(message, "I need to be in a voice channel to leave");
        return;
    }
    guildQueue.leave();
    react(message, "👍");
}

function shuffle(message, guildQueue) {
    if (guildQueue === undefined) {
        sendMessage(message, "I need to be in a voice channel to shuffle");
        return;
    }
    if (!guildQueue.isPlaying) {
        sendMessage(message, "Nothing to shuffle");
        return;
    }
    guildQueue.shuffle();
    react(message, "👍");
}

function loop(message, guildQueue) {
    if (guildQueue === undefined) {
        sendMessage(message, "I need to be in a voice channel to loop");
        return;
    }
    guildQueue.setRepeatMode(1 - guildQueue.repeatMode);
    sendMessage(
        message,
        "Looping " + (guildQueue.repeatMode !== 0 ? "enabled" : "disabled")
    );
}

function setVolume(message, guildQueue) {
    let args = message.content.split(" ");
    args.shift();
    if (guildQueue === undefined) {
        return sendMessage(
            message,
            "I need to be in a voice channel to set volume"
        );
    }
    const volume = /^([0-9]+)$/;
    let matches = volume.exec(args.join(" "));
    if (matches === null) {
        return sendMessage(
            message,
            "Invalid option specified, please use 1-100"
        );
    }
    if (matches[1] > 100 || matches[1] < 1) {
        return sendMessage(message, "Invalid volume, please use 1-100");
    }
    guildQueue.setVolume(matches[1]);
    sendMessage(message, `Volume set to ${matches[1]}`);
}

function handleError(error, queue) {
    if (error === "Status code: 410") {
        if (queue.nowPlaying.data && queue.nowPlaying.data.errored) {
            sendMessage(
                queue.data.message,
                `Failed to find non age-restricted version of \`${queue.nowPlaying.name}\``
            );
            return;
        }
        sendMessage(
            queue.data.message,
            `Searching for non age-restricted version`
        );
        queue
            .play(queue.nowPlaying.name, {
                requestedBy: null,
                data: { errored: true },
            })
            .catch((_) => {});
    } else if (error === "Status code: 403") {
        if (queue.nowPlaying.data && queue.nowPlaying.data.errored) {
            sendMessage(
                queue.data.message,
                `Playback of \`${queue.nowPlaying.name}\` failed`
            );
            return;
        }
        queue
            .play(queue.nowPlaying.url, {
                requestedBy: null,
                data: { errored: true },
            })
            .catch((_) => {});
    } else {
        sendMessage(
            queue.data.message,
            `Error: ${error}\nPlayback of \`${queue.nowPlaying.name}\` failed`
        );
    }
}
