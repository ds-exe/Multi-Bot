const Discord = require("discord.js");
const { prefix, botTitle, embedThumbnail } = require("./config.json");

exports.init = async (client) => {
    const owner = "74968333413257216";
    const creator = await client.users.fetch(owner);
    const userString = creator.username + "#" + creator.discriminator;
    console.log(creator.iconURL);
    console.log(creator);
    this.helpEmbed.setFooter({
        text: `BOT made by @${userString}`,
        iconURL: `https://cdn.discordapp.com/avatars/${owner}/${creator.avatar}`,
    });
    this.musicEmbed.setFooter({
        text: `BOT made by @${userString}`,
        iconURL: `https://cdn.discordapp.com/avatars/${owner}/${creator.avatar}`,
    });
};

exports.helpEmbed = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle(`${botTitle}`)
    .setThumbnail(`${embedThumbnail}`)
    .addFields({
        name: "Commands Available Here 🔎",
        value: `\`\`\`📌${prefix}music\n📌${prefix}time or ${prefix}until\n📌${prefix}now\n📌${prefix}timezone\n📌${prefix}reddit\n📌${prefix}perms\`\`\``,
    });

exports.musicEmbed = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle(`${botTitle}`)
    .setThumbnail(`${embedThumbnail}`)
    .addFields({
        name: "Commands Available Here 🔎",
        value: `\`\`\`📌${prefix}play\n📌${prefix}skip\n📌${prefix}stop\n📌${prefix}leave\n📌${prefix}shuffle\n📌${prefix}loop\n📌${prefix}setvolume\`\`\``,
    });

exports.timestampEmbed = new Discord.MessageEmbed()
    .setColor("#00FFFF")
    .setTitle("Local time:")
    .setDescription(`<t:0:F>`);
