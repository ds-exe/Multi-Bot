const axios = require("axios");
const { hasPermissionRole, hasPermissionUser } = require("./SQLDatabase.js");
const { isDM } = require("./utility.js");
const { prefix } = require("./config.json");

module.exports = {
    loadPage: async (sub, message) => {
        if (
            !isDM(message) &&
            !(await hasPermissionRole(message, message.member.roles.cache)) &&
            !(await hasPermissionUser(message, message.author.id))
        ) {
            return await message.channel.send(
                "You do not have permission to use this command!"
            );
        }
        const subs = /^([a-z1-9_]+)$/;
        if (sub[0] === undefined || sub[0] === "help") {
            await message.channel.send(
                `Valid inputs: \n${prefix}reddit {desired subreddit}`
            );
            return;
        }
        const matches = subs.exec(sub[0]);
        if (matches === null) {
            return await message.channel.send("Invalid subreddit");
        }

        await axios
            .get(
                `https://www.reddit.com/r/${matches[1]}.json?limit=100&?sort=top&t=all`
            )

            .then((response) =>
                response.data.data.children.map((v) => v.data.url)
            )
            .then(async (urls) => {
                await postPage(urls, message);
            });
    },
};

async function postPage(urls, message) {
    const randomURL = urls[Math.floor(Math.random() * urls.length) + 1];
    if (randomURL !== undefined) {
        await message.channel.send(randomURL);
    } else {
        await message.channel.send("Sub-Reddit not found");
    }
}
