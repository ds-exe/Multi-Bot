const Discord = require("discord.js");
const { prefix, botTitle, embedThumbnail } = require("./config.json");

exports.helpEmbed = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle(`${botTitle}`)
    .setThumbnail(`${embedThumbnail}`)
    .addFields({
        name: "Commands Available Here š",
        value: `\`\`\`š${prefix}time or ${prefix}date\nš${prefix}timezone\nš${prefix}reddit\nš${prefix}play\nš${prefix}skip\nš${prefix}stop\nš${prefix}leave\nš${prefix}perms\`\`\``,
    })
    .setFooter({
        text: "BOT made by @ds#8460",
        iconURL: "https://i.imgur.com/5BzUoNx.png",
    });

exports.timestampEmbed = new Discord.MessageEmbed()
    .setColor("#00FFFF")
    .setTitle("Local time:")
    .setDescription(`<t:0:F>`);
