module.exports = {
    isDM: (message) =>
        message.channel.type === "DM" || message.channel.type === "GROUP",
};
