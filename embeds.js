const Discord = require("discord.js");
const { prefix, botTitle, embedThumbnail } = require("./config.json");

exports.helpEmbed = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle(`${botTitle}`)
    .setThumbnail(`${embedThumbnail}`)
    .addFields({
        name: "Commands Available Here 🔎",
        value: `\`\`\`📌${prefix}time or ${prefix}until\n📌${prefix}now\n📌${prefix}timezone\n📌${prefix}reddit\n📌${prefix}play\n📌${prefix}skip\n📌${prefix}stop\n📌${prefix}leave\n📌${prefix}shuffle\n📌${prefix}perms\`\`\``,
    })
    .setFooter({
        text: "BOT made by @ds#8460",
        iconURL: "https://i.imgur.com/5BzUoNx.png",
    });

exports.timestampEmbed = new Discord.MessageEmbed()
    .setColor("#00FFFF")
    .setTitle("Local time:")
    .setDescription(`<t:0:F>`);
