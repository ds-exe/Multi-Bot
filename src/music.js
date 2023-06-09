//import { Player, RepeatMode } from "discord-music-distube";
import { DisTube, RepeatMode } from "distube";
import { SpotifyPlugin } from "@distube/spotify";
import { isDM, sendMessage, react } from "./utility.js";
import { hasPermissionRole, hasPermissionUser } from "./SQLDatabase.js";
import {
    trackAdded,
    trackPlaying,
    playlistAdded,
    nowPlayingEmbed,
} from "./embeds.js";
import { PermissionsBitField } from "discord.js";

let client = null;

export function init(mainClient) {
    client = mainClient;
    const distube = new DisTube(client, {
        plugins: [new SpotifyPlugin()],
        emptyCooldown: 900000, // 15 mins
        leaveOnEmpty: true,
    });
    client.distube = distube;
    client.distube
        .on("playSong", async (queue, song) => {
            // if (queue.data.previousMessage) {
            //     queue.data.previousMessage.delete();
            // }
            // queue.data.previousMessage = await sendMessage(queue.data.message, {
            //     embeds: [trackPlaying(newSong.name, newSong.url)],
            // });
            sendMessage({ channel: queue.textChannel }, song);
        })
        .on("addSong", (queue, song) => {
            // if (song.data && song.data.errored) {
            //     return;
            // }
            // if (queue.repeatMode !== 0) {
            //     return;
            // }
            // sendMessage(queue.data.message, {
            //     embeds: [trackAdded(song)],
            // });
            sendMessage({ channel: queue.textChannel }, song);
        })
        .on("addList", (queue, playlist) => {
            // sendMessage(queue.data.message, {
            //     embeds: [playlistAdded(playlist)],
            // });
            sendMessage(message, playlist);
        })
        .on("error", (textChannel, e) => {
            sendMessage({ channel: textChannel }, e);
        })
        .on("disconnect", (queue) => {
            sendMessage(
                { channel: queue.textChannel },
                `I was kicked from the Voice Channel, queue ended.`
            );
        })
        .on("empty", (queue) => {
            sendMessage(
                { channel: queue.textChannel },
                `Everyone left the Voice Channel, queue ended.`
            );
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

    switch (command) {
        case "play":
            await play(message);
            break;
        case "skip":
            skip(message);
            break;
        case "stop":
            stop(message);
            break;
        case "leave":
            leave(message);
            break;
        case "shuffle":
            shuffle(message);
            break;
        case "repeat":
            repeat(message);
            break;
        case "setvolume":
            setVolume(message);
            break;
        case "nowplaying":
            nowPlaying(message);
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
    let { match, isPlaylist } = validateUrl(args.join(" ").trim(), message);
    if (match === null) {
        return;
    }
    const voiceChannel = message.member?.voice?.channel;

    if (voiceChannel) {
        await client.distube.play(voiceChannel, match, {
            message,
            textChannel: message.channel,
            member: message.member,
        });
        if (shuffle) {
            shuffle(message);
        }
    } else {
        sendMessage(message, "You must join a voice channel first.");
    }
}

function validateUrl(url, message) {
    const youtube =
        /^(https:\/\/(www.)?youtu.be\/[0-9a-zA-Z_-]+|https:\/\/(www.)?youtube.com\/watch\?v=[0-9a-zA-Z_-]+)/;
    let matches = youtube.exec(url);
    if (matches !== null) {
        return { match: matches[1], isPlaylist: false };
    }

    const urlFixed = url.replace(/com\/intl\-[a-z]+\//, "com/");
    const spotify = /^(https:\/\/open.spotify.com\/track\/[a-zA-Z0-9-_()]+)/;
    matches = spotify.exec(urlFixed);
    if (matches !== null) {
        return { match: matches[1], isPlaylist: false };
    }
    return validatePlaylistUrl(url, message);
}

function validatePlaylistUrl(url, message) {
    const youtube =
        /^(https:\/\/(www.)?youtube.com\/playlist\?list=[0-9a-zA-Z_-]+)/;
    let matches = youtube.exec(url);
    if (matches !== null) {
        return { match: matches[1], isPlaylist: true };
    }

    const spotify =
        /^(https:\/\/open.spotify.com\/playlist\/[a-zA-Z0-9-_()]+|https:\/\/open.spotify.com\/album\/[a-zA-Z0-9-_()]+)/;
    matches = spotify.exec(url);
    if (matches !== null) {
        return { match: matches[1], isPlaylist: true };
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

function skip(message) {
    client.distube.skip(message);
    react(message, "👍");
}

function stop(message) {
    client.distube.stop(message);
    react(message, "👍");
}

function leave(message) {
    client.distube.voices.get(message)?.leave();
    react(message, "👍");
}

function shuffle(message) {
    client.distube.shuffle(message);
    react(message, "👍");
}

function repeat(message) {
    let args = message.content.toLowerCase().split(" ");
    args.shift();
    switch (args[0]) {
        case "off":
            client.distube.setRepeatMode(message, RepeatMode.DISABLED);
            sendMessage(message, "Repeating disabled");
            break;
        case "track":
            client.distube.setRepeatMode(message, RepeatMode.SONG);
            sendMessage(message, "Repeating track");
            break;
        case "queue":
            client.distube.setRepeatMode(message, RepeatMode.QUEUE);
            sendMessage(message, "Repeating queue");
            break;
        default:
            sendMessage(message, "Valid options: track | queue | off");
            break;
    }
}

function setVolume(message) {
    let args = message.content.split(" ");
    args.shift();
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
    client.distube.setVolume(message, matches[1]);
    sendMessage(message, `Volume set to ${matches[1]}`);
}

function nowPlaying(message) {
    const queue = client.distube.getQueue(message);
    if (!queue) {
        sendMessage(message, "Nothing is playing");
        return;
    }
    const progressBar = guildQueue.createProgressBar();
    // sendMessage(message, {
    //     embeds: [nowPlayingEmbed(guildQueue.nowPlaying, progressBar)],
    // });
    sendMessage(message, queue.songs[0].name);
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
