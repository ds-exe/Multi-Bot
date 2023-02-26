const Discord = require("discord.js");

exports.helpEmbed = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle("🍑 UwU Bot")
    .setDescription("Use Me Senpai")
    .setThumbnail("https://i.imgur.com/twtmzmr.png")
    .addFields({
        name: "UwU Commands Available Here 🔎",
        value: "```📌!time or !date\n📌!timezone\n📌!reddit\n📌!play\n📌!skip\n📌!stop\n📌!leave\n📌!perms```",
    })
    .setFooter(
        "BOT made by @ds#8460",
        "https://cdn.discordapp.com/avatars/74968333413257216/3bf0047dd6175e5b623ce6d5ade1a76e.webp"
    );

exports.timestampEmbed = new Discord.MessageEmbed()
    .setColor("#00FFFF")
    .setTitle("Local time:")
    .setDescription(`<t:0:F>`);
