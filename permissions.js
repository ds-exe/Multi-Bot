const Discord = require("discord.js");
const Embeds = require("./embeds.js");
const {
    allowRole,
    denyRole,
    allowUser,
    denyUser,
} = require("./SQLDatabase.js");

module.exports = {
    run: (message, words) => {
        if (
            !message.member.permissions.has(
                Discord.Permissions.FLAGS.ADMINISTRATOR
            )
        ) {
            return message.channel.send(
                "This command requires administrator permissions"
            );
        }
        const commands = /^([a-z]+)$/;
        const matches = commands.exec(words[0]);
        if (matches === null) {
            return message.channel.send("Invalid command");
        }
        const command = matches[1];
        words.shift();
        switch (command) {
            case "help":
                break;
            case "allowrole":
                roleAllow(message, words);
                break;
            case "denyrole":
                roleDeny(message, words);
                break;
            case "allowuser":
                userAllow(message, words);
                break;
            case "denyuser":
                userDeny(message, words);
                break;
            default:
                message.channel.send(
                    "!perms allowRole/denyRole {role id/role name}\n!perms allowUser/denyUser {user id}"
                );
                break;
        }
    },
};

function roleAllow(message, words) {
    words = words.join(" ");
    role = getRole(message, words);
    if (role === undefined) {
        return message.channel.send("Invalid role");
    } else {
        allowRole(message, role.id.toLowerCase(), role.guild.id.toLowerCase());
    }
}

function roleDeny(message, words) {
    words = words.join(" ");
    role = getRole(message, words);
    if (role === undefined) {
        return message.channel.send("Invalid role");
    } else {
        denyRole(message, role.id.toLowerCase(), role.guild.id.toLowerCase());
    }
}

function userAllow(message, words) {
    words = words.join(" ");
    user = getUser(message, words);
    if (user === undefined) {
        return message.channel.send("Invalid user");
    } else {
        allowUser(message, user.id.toLowerCase(), user.guild.id.toLowerCase());
    }
}

function userDeny(message, words) {
    words = words.join(" ");
    user = getUser(message, words);
    if (user === undefined) {
        return message.channel.send("Invalid user");
    } else {
        denyUser(message, user.id.toLowerCase(), user.guild.id.toLowerCase());
    }
}

function getRole(message, words) {
    const roleName = /^([a-z _-]+)$/;
    const matches = roleName.exec(words);
    if (matches !== null) {
        role = message.channel.guild.roles.cache.find(
            (role) => role.name.toLowerCase() === words
        );
        return role;
    }
    const roleId = /^([0-9]+)$/;
    const matches2 = roleId.exec(words);
    if (matches2 !== null) {
        role = message.channel.guild.roles.cache.find(
            (role) => role.id.toLowerCase() === words
        );
        return role;
    }
    return undefined;
}

function getUser(message, words) {
    const userId = /^([0-9]+)$/;
    const matches2 = userId.exec(words);
    if (matches2 !== null) {
        user = message.channel.guild.members.cache.find(
            (user) => user.id.toLowerCase() === words
        );
        return user;
    }
    return undefined;
}
