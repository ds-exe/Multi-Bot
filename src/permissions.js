const Discord = require("discord.js");

const {
    allowRole,
    denyRole,
    allowUser,
    denyUser,
    getUserPermissionData,
    getRolePermissionData,
} = require("./SQLDatabase.js");
const { isDM, sendMessage } = require("./utility.js");

let client = null;

module.exports = {
    init: (mainClient) => {
        client = mainClient;
    },

    run: async (message, words) => {
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
                await userAllow(message, words);
                break;
            case "denyuser":
                await userDeny(message, words);
                break;
            case "listusers":
                getUserData(message);
                break;
            case "listroles":
                getRoleData(message);
                break;
            default:
                sendMessage(
                    message,
                    `allowRole/denyRole {role id/role name}\nallowUser/denyUser {user id}\nperms listUsers/listRoles`
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

async function userAllow(message, words) {
    words = words.join(" ");
    user = await getUser(message, words);
    if (user === undefined) {
        return sendMessage(message, "Invalid user");
    } else {
        allowUser(message, user.id.toLowerCase(), user.guild.id.toLowerCase());
    }
}

async function userDeny(message, words) {
    words = words.join(" ");
    user = await getUser(message, words);
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

async function getUser(message, words) {
    const userId = /^([0-9]+)$/;
    const matches2 = userId.exec(words);
    if (matches2 !== null) {
        return await message.guild.members.fetch(words);
    }
    return undefined;
}

async function getUserData(message) {
    let rows = await getUserPermissionData(message.guild.id);
    let out = "```";
    for (const row of rows) {
        tmp = await getUser(message, row.userID);
        out += tmp.user.username + "#" + tmp.user.discriminator + "\n";
    }
    out += "```";
    if (out === "``````") {
        out = "```No user permissions found```";
    }
    sendMessage(message, out);
}

async function getRoleData(message) {
    let rows = await getRolePermissionData(message.guild.id);
    let out = "```";
    for (const row of rows) {
        tmp = await getRole(message, row.roleID);
        out += tmp.name + "\n";
    }
    out += "```";
    if (out === "``````") {
        out = "```No role permissions found```";
    }
    sendMessage(message, out);
}
