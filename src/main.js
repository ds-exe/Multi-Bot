import { normalize } from "node:path";
import { readFile } from "fs/promises";

const config = JSON.parse(
    await readFile(new URL(normalize("./../config.json"), import.meta.url))
);

const token = config.token;
const clientId = config.clientId;
const serverIds = config.serverIds;

import { REST, Routes } from "discord.js";

const rest = new REST().setToken(token);

// ...

// for guild-based commands
for (let serverId of serverIds) {
    rest.put(Routes.applicationGuildCommands(clientId, serverId), {
        body: [],
    })
        .then(() => console.log("Successfully deleted all guild commands."))
        .catch(console.error);
}
