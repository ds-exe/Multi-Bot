import { PermissionsBitField } from "discord.js";
import { permsEmbed } from "./embeds.js";
import {
    allowRole,
    denyRole,
    allowUser,
    denyUser,
    getUserPermissionData,
    getRolePermissionData,
} from "./SQLDatabase.js";
import { isDM, sendMessage } from "./utility.js";

let client = null;

export function init(mainClient) {
    client = mainClient;
}

export async function run(message, words) {
    if (isDM(message)) {
        sendMessage(message, "Can't use this command in DM's");
        return;
    }
    if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
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
            sendMessage(message, { embeds: [permsEmbed] });
            break;
    }
}

function roleAllow(message, words) {
    words = words.join(" ");
    let role = getRole(message, words);
    if (role === undefined) {
        return sendMessage(message, "Invalid role");
    } else {
        allowRole(message, role.id.toLowerCase(), role.guild.id.toLowerCase());
    }
}

function roleDeny(message, words) {
    words = words.join(" ");
    let role = getRole(message, words);
    if (role === undefined) {
        return sendMessage(message, "Invalid role");
    } else {
        denyRole(message, role.id.toLowerCase(), role.guild.id.toLowerCase());
    }
}

async function userAllow(message, words) {
    words = words.join(" ");
    let user = await getUser(message, words);
    if (user === undefined) {
        return sendMessage(message, "Invalid user");
    } else {
        allowUser(message, user.id.toLowerCase(), user.guild.id.toLowerCase());
    }
}

async function userDeny(message, words) {
    words = words.join(" ");
    let user = await getUser(message, words);
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
        let role = message.channel.guild.roles.cache.find(
            (role) => role.name.toLowerCase() === words
        );
        return role;
    }
    const roleId = /^([0-9]+)$/;
    const matches2 = roleId.exec(words);
    if (matches2 !== null) {
        let role = message.channel.guild.roles.cache.find(
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
    let out = "";
    for (const row of rows) {
        let tmp = await getUser(message, row.userID);
        out += tmp.user.username + "\n";
    }
    if (out === "") {
        out = "No user permissions found";
    }
    sendMessage(message, "```\n" + out + "```");
}

async function getRoleData(message) {
    let rows = await getRolePermissionData(message.guild.id);
    let out = "";
    for (const row of rows) {
        let tmp = await getRole(message, row.roleID);
        out += tmp.name + "\n";
    }
    if (out === "") {
        out = "No role permissions found";
    }
    sendMessage(message, "```\n" + out + "```");
}
