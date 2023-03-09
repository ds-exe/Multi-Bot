import { normalize } from "node:path";
import { readFile } from "fs/promises";
import { DateTime } from "luxon";
import { ChannelType } from "discord.js";

const timezones = JSON.parse(
    await readFile(new URL(normalize("./../timezones.json"), import.meta.url))
);

export function isDM(message) {
    return (
        message.channel.type === ChannelType.DM ||
        message.channel.type === ChannelType.GroupDM
    );
}

export async function sendMessage(message, msg) {
    return await message.channel.send(msg).catch((err) => {});
}

export async function react(message, reaction) {
    return await message.react(reaction).catch((err) => {});
}

export function getTimezone(timezone) {
    let zonesRegex = /^([a-z]+)$/;
    const zoneMatch = zonesRegex.exec(timezone);
    if (zoneMatch !== null && zoneMatch[1] in timezones) {
        return timezones[zoneMatch[1]];
    }

    zonesRegex = /^(utc[+-]{1}[0-9]{1,2}|[a-z\/_]+)$/;
    const zoneMatches = zonesRegex.exec(timezone);
    if (
        zoneMatches !== null &&
        DateTime.now().setZone(zoneMatches[1]).isValid
    ) {
        return zoneMatches[1];
    }
    return null;
}
