const { Player } = require("discord-music-player");
const { hasPermissionRole, hasPermissionUser } = require("./SQLDatabase.js");

let client = null;

module.exports = {
    init: (mainClient) => {
        client = mainClient;
        const player = new Player(client, { leaveOnEmpty: false });
        client.player = player;
    },

    run: async (command, message) => {
        if (
            !(await hasPermissionRole(message, message.member.roles.cache)) &&
            !(await hasPermissionUser(message, message.author.id))
        ) {
            return message.channel.send(
                "You do not have permission to use this command!"
            );
        }
        let guildQueue = client.player.getQueue(message.guild.id);
        switch (command) {
            case "play":
                play(message, guildQueue);
                break;
            case "skip":
                guildQueue.skip();
                break;
            case "stop":
                guildQueue.stop();
                break;
            // case "leave":
            //     leave(message, guildQueue);
            //     break;
            default:
                message.channel.send("You need to enter a valid command!");
                break;
        }
    },
};

async function play(message, guildQueue) {
    const args = message.content.split(" ");
    message.suppressEmbeds(/^-$/.exec(args[2]));

    const youtube =
        /^(<)?(https:\/\/(www.)?youtu.be\/[0-9a-zA-Z_-]+|https:\/\/(www.)?youtube.com\/watch\?v=[0-9a-zA-Z_-]+)(>)?/;
    const matches = youtube.exec(args[1]);
    if (matches === null) {
        return message.channel.send("Invalid url");
    }

    let queue = client.player.createQueue(message.guild.id);
    await queue.join(message.member.voice.channel);
    let song = await queue.play(matches[2]).catch((_) => {
        if (!guildQueue) queue.stop();
    });
}
