import { sendMessage } from "./utility.js";

export async function sendAvatar(message, client, words) {
    if (words[0]) {
        const idRegex = /^<@([\d]*)>$/;

        let matches = idRegex.exec(words[0]);
        if (matches === null) {
            return sendMessage(message, "Formatting error");
        }
        try {
            const creator = await client.users.fetch(`${matches[1]}`);
            sendMessage(
                message,
                `https://cdn.discordapp.com/avatars/${creator.id}/${creator.avatar}`
            );
        } catch {
            return sendMessage(message, "Unknown user");
        }
    } else {
        sendMessage(
            message,
            `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}`
        );
    }
}
