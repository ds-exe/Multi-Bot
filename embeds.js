const Discord = require("discord.js");
const { prefix, botTitle, embedThumbnail } = require("./config.json");

let client = null;

exports.init = async (mainClient) => {
    client = mainClient;
    this.helpEmbed = await generateEmbed(
        `\`\`\`📌${prefix}music\n📌${prefix}time or ${prefix}until\n📌${prefix}now\n📌${prefix}timezone\n📌${prefix}reddit\n📌${prefix}perms\`\`\``
    );
    this.musicEmbed = await generateEmbed(
        `\`\`\`📌${prefix}play\n📌${prefix}skip\n📌${prefix}stop\n📌${prefix}leave\n📌${prefix}shuffle\n📌${prefix}loop\n📌${prefix}setvolume\`\`\``
    );
};

exports.helpEmbed = null;

exports.musicEmbed = null;

exports.timestampEmbed = new Discord.MessageEmbed()
    .setColor("#00FFFF")
    .setTitle("Local time:")
    .setDescription(`<t:0:F>`);

exports.trackAdded = (name, link, thumbnail, length) => {
    return new Discord.MessageEmbed()
        .setColor("#0099ff")
        .setTitle(`Added Track`)
        .setThumbnail(`${thumbnail}`)
        .addFields(
            {
                name: "Track",
                value: `[${name}](${link})`,
            },
            // { name: "Estimated time until played", value: time, inline: true, },
            { name: "Track Length", value: length, inline: true }
            // { name: "\u200B", value: "\u200B", inline: true },
            // { name: "tmp name", value: "tmp val", inline: true },
            // { name: "tmp name", value: "tmp val", inline: true },
            // { name: "\u200B", value: "\u200B", inline: true }
        );
};

async function generateEmbed(commands) {
    const creatorID = "74968333413257216";
    const creator = await client.users.fetch(creatorID);
    const userString = creator.username + "#" + creator.discriminator;
    return new Discord.MessageEmbed()
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
