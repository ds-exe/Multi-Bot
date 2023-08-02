import { deleteMessage, sendMessage } from "./utility.js";

export function filterMessage(message) {
    const filters = getFilters(message.guild.id);

    for (const filter of filters) {
        if (message.content.includes(filter)) {
            const cleanedMessage = message.content.replace(filter, "");
            sendMessage(
                message,
                `Banned word used, cleaned message:\n> ${cleanedMessage}`
            );
            deleteMessage(message);
            return;
        }
    }
}

function getFilters() {
    return ["🥹"];
}

export function addFilter(message, words) {
    console.log(words);
}

export function deleteFilter(message, words) {
    console.log(words);
}
