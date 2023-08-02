import { addFilterDB, deleteFilterDB, getFilters } from "./SQLDatabase.js";
import { deleteMessage, react, sendMessage } from "./utility.js";

export async function filterMessage(message) {
    const filters = await getFilters(message.guild.id);
    let filtered = false;
    for (const filterItem of filters) {
        const filter = filterItem.filter;
        if (message.content.includes(filter)) {
            message.content = message.content.replace(filter, "[redacted]");
            filtered = true;
        }
    }
    if (!filtered) {
        return;
    }
    sendMessage(
        message,
        `${message.author.username} sent:\n> ${message.content}`
    );
    deleteMessage(message);
}

export async function addFilter(message, filter) {
    if (!filter) {
        return sendMessage(message, "Missing filter");
    }
    await addFilterDB(message.guild.id, filter);
    react(message, "👍");
}

export async function deleteFilter(message, filter) {
    if (!filter) {
        return sendMessage(message, "Missing filter");
    }
    await deleteFilterDB(message.guild.id, filter);
    react(message, "👍");
}
