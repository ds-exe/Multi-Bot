module.exports = {
    isDM: (message) =>
        message.channel.type === "DM" || message.channel.type === "GROUP",
    sendMessage: (message, msg) => {
        message.channel.send(msg).catch((err) => {});
    },
};
