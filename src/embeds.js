import { normalize } from "node:path";
import { EmbedBuilder } from "discord.js";
import { readFile } from "fs/promises";

const json = JSON.parse(
    await readFile(new URL(normalize("./../config.json"), import.meta.url))
);
const prefix = json.prefix;
const botTitle = json.botTitle;
const embedThumbnail = json.embedThumbnail;

let client = null;

export async function init(mainClient) {
    client = mainClient;
    helpEmbed = await generateEmbed(
        `\`\`\`📌${prefix}music\n📌${prefix}notify\n📌${prefix}time or ${prefix}until\n📌${prefix}now\n📌${prefix}timezone\n📌${prefix}reddit\n📌${prefix}perms\`\`\``
    );
    musicEmbed = await generateEmbed(
        `\`\`\`📌${prefix}play\n📌${prefix}skip\n📌${prefix}stop\n📌${prefix}leave\n📌${prefix}shuffle\n📌${prefix}repeat\n📌${prefix}setvolume\n📌${prefix}nowplaying\`\`\``
    );
    permsEmbed = await generateEmbed(
        `\`\`\`📌${prefix}perms allowRole/denyRole {role id/role name}\n📌${prefix}perms allowUser/denyUser {user id}\n📌${prefix}perms listUsers/listRoles\`\`\``
    );
}

export let helpEmbed = null;

export let musicEmbed = null;

export let permsEmbed = null;

export function timestampEmbed(time) {
    return new EmbedBuilder()
        .setColor("#00FFFF")
        .setTitle("Local time:")
        .setDescription(time)
        .addFields({
            name: `Copy Link:`,
            value: `\\${time}`,
        });
}

export function resinNotificationEmbed(
    account,
    notificationResin,
    resinCapTimestamp
) {
    account = account.replace("hsr", "Honkai Star Rail");
    account = account.replace("genshin", "Genshin");
    account = account.replace(/[0-9]/, " $&");
    return new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`${account}:`)
        .setDescription(`Current Resin: ${notificationResin}`)
        .addFields({
            name: `Resin full:`,
            value: `<t:${resinCapTimestamp}:R>`,
            inline: true,
        });
}

export function resinNextNotificationEmbed(
    account,
    notificationResin,
    nextAlertTimestamp,
    resinCapTimestamp
) {
    account = account.replace("hsr", "Honkai Star Rail");
    account = account.replace("genshin", "Genshin");
    account = account.replace(/[0-9]/, " $&");
    return new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`${account}:`)
        .setDescription(`Current Resin: ${notificationResin}`)
        .addFields(
            {
                name: `Next alert:`,
                value: `<t:${nextAlertTimestamp}:R>`,
                inline: true,
            },
            { name: "\u200b", value: `\u200b`, inline: true },
            {
                name: `Resin full:`,
                value: `<t:${resinCapTimestamp}:R>`,
                inline: true,
            }
        );
}

export function trackAdded(song) {
    return new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`Added Track`)
        .setThumbnail(`${song.thumbnail}`)
        .setDescription(`[${song.name}](${song.url})`)
        .addFields(
            { name: "Track Length", value: song.duration, inline: true },
            { name: "Added by", value: `<@${song.requestedBy}>`, inline: true }
        );
}

export function nowPlayingEmbed(song, progressBar) {
    return new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`Now Playing`)
        .setThumbnail(`${song.thumbnail}`)
        .setDescription(`[${song.name}](${song.url})`)
        .addFields(
            { name: "Track Progress", value: progressBar.times, inline: true },
            { name: "Added by", value: `<@${song.requestedBy}>`, inline: true }
        );
}

export function playlistAdded(playlist) {
    return new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`Added Playlist`)
        .setDescription(`[${playlist}](${playlist.url})`)
        .addFields(
            {
                name: "Playlist Length",
                value: `${playlist.songs.length}`,
                inline: true,
            },
            { name: "\u200b", value: `\u200b`, inline: true },
            {
                name: "Added by",
                value: `<@${playlist.songs[0].requestedBy}>`,
                inline: true,
            }
        );
}

export function trackPlaying(name, link) {
    return new EmbedBuilder()
        .setColor("#0099ff")
        .setDescription(`Started playing [${name}](${link})`);
}

async function generateEmbed(commands) {
    const creatorID = "74968333413257216";
    const creator = await client.users.fetch(creatorID);
    const userString = creator.username + "#" + creator.discriminator;
    return new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`${botTitle}`)
        .setThumbnail(`${embedThumbnail}`)
        .addFields({
            name: "Commands Available Here 🔎",
            value: commands,
        })
        .setFooter({
            text: `BOT made by @${userString}`,
            iconURL: `https://cdn.discordapp.com/avatars/${creatorID}/${creator.avatar}`,
        });
}
