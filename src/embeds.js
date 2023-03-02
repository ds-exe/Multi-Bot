const path = require("node:path");
const Discord = require("discord.js");
const { prefix, botTitle, embedThumbnail } = require(path.normalize(
    "./../config.json"
));

let client = null;

exports.init = async (mainClient) => {
    client = mainClient;
    this.helpEmbed = await generateEmbed(
        `\`\`\`📌${prefix}music\n📌${prefix}notify\n📌${prefix}time or ${prefix}until\n📌${prefix}now\n📌${prefix}timezone\n📌${prefix}reddit\n📌${prefix}perms\`\`\``
    );
    this.musicEmbed = await generateEmbed(
        `\`\`\`📌${prefix}play\n📌${prefix}skip\n📌${prefix}stop\n📌${prefix}leave\n📌${prefix}shuffle\n📌${prefix}loop\n📌${prefix}setvolume\`\`\``
    );
    this.permsEmbed = await generateEmbed(
        `\`\`\`📌${prefix}perms allowRole/denyRole {role id/role name}\n📌${prefix}perms allowUser/denyUser {user id}\n📌${prefix}perms listUsers/listRoles\`\`\``
    );
};

exports.helpEmbed = null;

exports.musicEmbed = null;

exports.permsEmbed = null;

exports.timestampEmbed = new Discord.EmbedBuilder()
    .setColor("#00FFFF")
    .setTitle("Local time:")
    .setDescription(`<t:0:F>`);

exports.trackAdded = (song) => {
    return new Discord.EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`Added Track`)
        .setThumbnail(`${song.thumbnail}`)
        .setDescription(`[${song.name}](${song.url})`)
        .addFields(
            { name: "Track Length", value: song.duration, inline: true },
            { name: "Added by", value: `<@${song.requestedBy}>`, inline: true }
        );
};

exports.playlistAdded = (playlist) => {
    return new Discord.EmbedBuilder()
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
};

exports.trackPlaying = (name, link) => {
    return new Discord.EmbedBuilder()
        .setColor("#0099ff")
        .setDescription(`Started playing [${name}](${link})`);
};

async function generateEmbed(commands) {
    const creatorID = "74968333413257216";
    const creator = await client.users.fetch(creatorID);
    const userString = creator.username + "#" + creator.discriminator;
    return new Discord.EmbedBuilder()
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
