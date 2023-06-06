import { normalize } from "node:path";
import { readFile } from "fs/promises";
import { DateTime } from "luxon";
import {
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";

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

export async function reply(interaction, msg) {
    return await interaction.reply(msg).catch((err) => {});
}

export async function edit(message, msg) {
    return await message.edit(msg).catch((err) => {});
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

export function getButtons(resin) {
    const lowResin = new ButtonBuilder()
        .setCustomId("lowResin")
        .setLabel("-10")
        .setStyle(ButtonStyle.Secondary);

    const midResin = new ButtonBuilder()
        .setCustomId("midResin")
        .setLabel("-30")
        .setStyle(ButtonStyle.Secondary);

    const highResin = new ButtonBuilder()
        .setCustomId("highResin")
        .setLabel("-40")
        .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder().addComponents(lowResin, midResin, highResin);
}

export function getButtons2(resin) {
    const customResin = new ButtonBuilder()
        .setCustomId("customResin")
        .setLabel(`-${resin}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(resin <= 0);

    const customResin2 = new ButtonBuilder()
        .setCustomId("customResin2")
        .setLabel(`-${resin * 2}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(resin <= 0);

    const refresh = new ButtonBuilder()
        .setCustomId("refresh")
        .setLabel(`↻`)
        .setStyle(ButtonStyle.Primary);

    return new ActionRowBuilder().addComponents(
        customResin,
        customResin2,
        refresh
    );
}
