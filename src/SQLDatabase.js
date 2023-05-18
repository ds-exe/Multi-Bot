import sqlite3 from "sqlite3";
import { sendMessage, getTimezone, react } from "./utility.js";
let db = null;

export function open() {
    db = new sqlite3.Database(
        "./MultiDatabase.db",
        sqlite3.OPEN_READWRITE,
        (err) => {
            if (err) return console.error(err.message);

            console.log("connection successful");
        }
    );

    db.run(
        "CREATE TABLE IF NOT EXISTS timezones(userID PRIMARY KEY, timezone)"
    );
    (err) => {
        if (err) return console.error(err.message);
    };
    db.run(
        "CREATE TABLE IF NOT EXISTS permissions(roleID, guildID, PRIMARY KEY (roleID, guildID))"
    );
    (err) => {
        if (err) return console.error(err.message);
    };
    db.run(
        "CREATE TABLE IF NOT EXISTS permissionsUser(userID, guildID, PRIMARY KEY (userID, guildID))"
    );
    (err) => {
        if (err) return console.error(err.message);
    };
    db.run(
        "CREATE TABLE IF NOT EXISTS notifications(userID, timestamp int, message, PRIMARY KEY (userID, timestamp))"
    );
    (err) => {
        if (err) return console.error(err.message);
    };
    //db.run("DROP TABLE IF EXISTS resinData");
    db.run(
        "CREATE TABLE IF NOT EXISTS resinData(userID, account, game, startResin int, startTimestamp int, resinCapTimestamp int, PRIMARY KEY (userID, account))"
    );
    (err) => {
        if (err) return console.error(err.message);
    };
    db.run(
        "CREATE TABLE IF NOT EXISTS resinNotifications(userID, account, timestamp int, resinCapTimestamp int, PRIMARY KEY (userID, account))"
    );
    (err) => {
        if (err) return console.error(err.message);
    };
    db.run(
        "CREATE TABLE IF NOT EXISTS resinNotificationsCustom(userID, account, timestamp int, resinCapTimestamp int, PRIMARY KEY (userID, account))"
    );
    (err) => {
        if (err) return console.error(err.message);
    };
}

export function setTimezone(message, word) {
    const userID = message.author.id;
    const timezone = getTimezone(word);
    if (timezone === null) {
        return sendMessage(message, "Invalid timezone syntax");
    }
    db.run(
        `REPLACE INTO timezones (userID, timezone) VALUES ('${userID}', '${timezone}')`
    );
    sendMessage(message, "Successfully set timezone");
    return;
}

export function getUserTimezone(userID) {
    const query = `SELECT timezone FROM timezones WHERE userID = '${userID}'`;
    return new Promise((resolve, reject) => {
        db.all(query, function (err, rows) {
            if (err) {
                reject(err);
            }
            if (rows.length > 0) {
                resolve(rows[0].timezone);
            } else {
                resolve("UTC+0");
            }
        });
    });
}

export function allowRole(message, roleId, guildId) {
    db.run(
        `REPLACE INTO permissions (roleID, guildID) VALUES ('${roleId}', '${guildId}')`
    );
    sendMessage(message, "Successfully added permissions");
    return;
}

export function denyRole(message, roleId, guildId) {
    db.run(
        `DELETE FROM permissions WHERE roleID = '${roleId}' AND guildID = '${guildId}'`
    );
    sendMessage(message, "Successfully removed permissions");
    return;
}

export function hasPermissionRole(message, roles, guildId) {
    return new Promise((resolve, reject) => {
        const roleQuery = roles.map((role) => role.id);
        const query = `SELECT * FROM permissions WHERE guildID = '${guildId}' AND roleID in (${roleQuery
            .map(() => "?")
            .join(",")})`;
        db.all(query, roleQuery, function (err, rows) {
            if (err) {
                reject(err);
            }
            if (rows.length > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

export function allowUser(message, userId, guildId) {
    db.run(
        `REPLACE INTO permissionsUser (userID, guildID) VALUES ('${userId}', '${guildId}')`
    );
    sendMessage(message, "Successfully added permissions");
    return;
}

export function denyUser(message, userId, guildId) {
    db.run(
        `DELETE FROM permissionsUser WHERE userID = '${userId}' AND guildID = '${guildId}'`
    );
    sendMessage(message, "Successfully removed permissions");
    return;
}

export function hasPermissionUser(message, userId, guildId) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM permissionsUser WHERE userID = '${userId}' AND guildID = '${guildId}'`;
        db.all(query, function (err, rows) {
            if (err) {
                reject(err);
            }
            if (rows.length > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

export function addNotification(userID, timestamp, text, message) {
    const notifyRegex = /^([A-Za-z0-9 ,]+)$/;
    const matches = notifyRegex.exec(text);
    if (matches === null) {
        return sendMessage(message, "Invalid text for notification"); // error does not match
    }
    db.run(
        `REPLACE INTO notifications(userID, timestamp, message) VALUES ('${userID}', ${timestamp}, '${text}')`
    );
    react(message, "👍");
}

export function sendNotifications(client, currentTimeSeconds) {
    const sqlRead = `SELECT * FROM notifications WHERE timestamp <= ${currentTimeSeconds}`;

    db.all(sqlRead, [], (err, rows) => {
        if (err) return console.error(err.message);

        rows.forEach(async (row) => {
            (await client.users.fetch(row.userID))
                .send(row.message)
                .then(() => {
                    db.run(
                        `DELETE FROM notifications WHERE timestamp = ${row.timestamp} AND userID = '${row.userID}'`
                    );
                })
                .catch((err) => {});
        });
    });
    db.run(
        `DELETE FROM notifications WHERE timestamp <= ${
            currentTimeSeconds - 86400
        }`
    );
}

export function printTimezoneDataBase() {
    const sqlRead = "SELECT * FROM timezones";

    db.all(sqlRead, [], (err, rows) => {
        if (err) return console.error(err.message);

        rows.forEach((row) => {
            console.log(row);
        });
    });
}

export function printNotifications() {
    const sqlRead = "SELECT * FROM notifications";

    db.all(sqlRead, [], (err, rows) => {
        if (err) return console.error(err.message);

        rows.forEach((row) => {
            console.log(row);
        });
    });
}

export function getUserPermissionData(guildId) {
    return new Promise((resolve, reject) => {
        const sqlRead = `SELECT userID FROM permissionsUser WHERE guildID = '${guildId}'`;

        db.all(sqlRead, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    });
}

export function getRolePermissionData(guildId) {
    return new Promise((resolve, reject) => {
        const sqlRead = `SELECT roleID FROM permissions WHERE guildID = '${guildId}'`;

        db.all(sqlRead, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    });
}

export function close() {
    db.close((err) => {
        if (err) return console.error(err.message);
    });
    console.log("shutdown successful");
}
