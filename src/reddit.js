import axios from "axios";
import { sendMessage } from "./utility.js";
import { hasPermission } from "./SQLDatabase.js";

export async function loadPage(sub, message) {
    if (!(await hasPermission(message))) {
        return sendMessage(
            message,
            "You do not have permission to use this command!"
        );
    }
    const subs = /^([a-z1-9_]+)$/;
    if (sub[0] === undefined || sub[0] === "help") {
        sendMessage(message, `Invalid subreddit`);
        return;
    }
    const matches = subs.exec(sub[0]);
    if (matches === null) {
        return sendMessage(message, "Invalid subreddit");
    }

    axios
        .get(
            `https://www.reddit.com/r/${matches[1]}.json?limit=100&?sort=top&t=all`
        )
        .then((response) => response.data.data.children.map((v) => v.data.url))
        .then((urls) => {
            postPage(urls, message);
        })
        .catch((err) => {
            sendMessage(message, "Error subreddit not found");
        });
}

function postPage(urls, message) {
    const randomURL = urls[Math.floor(Math.random() * urls.length) + 1];
    if (randomURL !== undefined) {
        sendMessage(message, randomURL);
    } else {
        sendMessage(message, "Sub-Reddit not found");
    }
}
