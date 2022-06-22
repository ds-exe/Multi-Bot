const Discord = require("discord.js");
const { prefix } = require("./config.json");

exports.helpEmbed = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle("🍑 UwU Bot")
    .setDescription("Use Me Senpai")
    .setThumbnail("https://i.imgur.com/twtmzmr.png")
    .addFields({
        name: "UwU Commands Available Here 🔎",
        value: `\`\`\`📌${prefix}time or ${prefix}date\n📌${prefix}timezone\n📌${prefix}reddit\n📌${prefix}play\n📌${prefix}skip\n📌${prefix}stop\n📌${prefix}leave\n📌${prefix}perms\`\`\``,
    })
    .setFooter(
        "BOT made by @ds#8460",
        "https://cdn.discordapp.com/avatars/74968333413257216/3bf0047dd6175e5b623ce6d5ade1a76e.webp"
    );

exports.timestampEmbed = new Discord.MessageEmbed()
    .setColor("#00FFFF")
    .setTitle("Local time:")
    .setDescription(`<t:0:F>`);
