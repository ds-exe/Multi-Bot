const axios = require("axios");
const { hasPermissionRole, hasPermissionUser } = require("./SQLDatabase.js");

module.exports = {
    loadPage: async (sub, message) => {
        if (
            !(await hasPermissionRole(message, message.member.roles.cache)) &&
            !(await hasPermissionUser(message, message.author.id))
        ) {
            return message.channel.send(
                "You do not have permission to use this command!"
            );
        }
        const subs = /^([a-z1-9_]+)$/;
        if (sub[0] === undefined || sub[0] === "help") {
            message.channel.send("Valid inputs: \n!reddit {desired subreddit}");
            return;
        }
        const matches = subs.exec(sub[0]);
        if (matches === null) {
            return message.channel.send("Invalid subreddit");
        }
        axios
            .get(
                `https://www.reddit.com/r/${matches[1]}.json?limit=100&?sort=top&t=all`
            )
            .then((response) =>
                response.data.data.children.map((v) => v.data.url)
            )
            .then((urls) => postPage(urls, message));
    },
};

function postPage(urls, message) {
    const randomURL = urls[Math.floor(Math.random() * urls.length) + 1];
    if (randomURL !== undefined) {
        message.channel.send(randomURL);
    } else {
        message.channel.send("Sub-Reddit not found");
    }
}
