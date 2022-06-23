const Discord = require("discord.js");
const { prefix } = require("./config.json");

const {
    allowRole,
    denyRole,
    allowUser,
    denyUser,
} = require("./SQLDatabase.js");
const { isDM, sendMessage } = require("./utility.js");

module.exports = {
    run: (message, words) => {
        if (isDM(message)) {
            sendMessage(message, "Can't use this command in DM's");
            return;
        }
        if (
            !message.member.permissions.has(
                Discord.Permissions.FLAGS.ADMINISTRATOR
            )
        ) {
            return sendMessage(
                message,
                "This command requires administrator permissions"
            );
        }
        const commands = /^([a-z]+)$/;
        const matches = commands.exec(words[0]);
        if (matches === null) {
            return sendMessage(message, "Invalid command");
        }
        const command = matches[1];
        words.shift();
        switch (command) {
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
            case "list":
                sendMessage(message, "To be implemented soon!");
                break;
            default:
                sendMessage(
                    message,
                    `${prefix}perms allowRole/denyRole {role id/role name}\n${prefix}perms allowUser/denyUser {user id}\n${prefix}perms list`
                );
                break;
        }
    },
};

function roleAllow(message, words) {
    words = words.join(" ");
    role = getRole(message, words);
    if (role === undefined) {
        return sendMessage(message, "Invalid role");
    } else {
        allowRole(message, role.id.toLowerCase(), role.guild.id.toLowerCase());
    }
}

function roleDeny(message, words) {
    words = words.join(" ");
    role = getRole(message, words);
    if (role === undefined) {
        return sendMessage(message, "Invalid role");
    } else {
        denyRole(message, role.id.toLowerCase(), role.guild.id.toLowerCase());
    }
}

function userAllow(message, words) {
    words = words.join(" ");
    user = getUser(message, words);
    if (user === undefined) {
        return sendMessage(message, "Invalid user");
    } else {
        allowUser(message, user.id.toLowerCase(), user.guild.id.toLowerCase());
    }
}

function userDeny(message, words) {
    words = words.join(" ");
    user = getUser(message, words);
    if (user === undefined) {
        return sendMessage(message, "Invalid user");
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
