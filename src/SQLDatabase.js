const path = require("node:path");
const sqlite3 = require("sqlite3").verbose();
const timezones = require(path.normalize("./../timezones.json"));
const { owner } = require(path.normalize("./../config.json"));
const { sendMessage, getTimezone } = require("./utility");
let db = null;

module.exports = {
    open: () => {
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
    },

    setTimezone: (message, word) => {
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
    },

    getUserTimezone: (userID) => {
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
    },

    allowRole: (message, roleId, guildId) => {
        db.run(
            `REPLACE INTO permissions (roleID, guildID) VALUES ('${roleId}', '${guildId}')`
        );
        sendMessage(message, "Successfully added permissions");
        return;
    },

    denyRole: (message, roleId, guildId) => {
        db.run(
            `DELETE FROM permissions WHERE roleID = '${roleId}' AND guildID = '${guildId}'`
        );
        sendMessage(message, "Successfully removed permissions");
        return;
    },

    hasPermissionRole: (message, roles, guildId) => {
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
    },

    allowUser: (message, userId, guildId) => {
        db.run(
            `REPLACE INTO permissionsUser (userID, guildID) VALUES ('${userId}', '${guildId}')`
        );
        sendMessage(message, "Successfully added permissions");
        return;
    },

    denyUser: (message, userId, guildId) => {
        db.run(
            `DELETE FROM permissionsUser WHERE userID = '${userId}' AND guildID = '${guildId}'`
        );
        sendMessage(message, "Successfully removed permissions");
        return;
    },

    hasPermissionUser: (message, userId, guildId) => {
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
    },

    createDataBase: (name) => {
        new sqlite3.Database(`${name}.db`);
        console.log(`Successfully created new database called ${name}`);
    },

    printTimezoneDataBase: () => {
        const sqlRead = "SELECT * FROM timezones";

        db.all(sqlRead, [], (err, rows) => {
            if (err) return console.error(err.message);

            rows.forEach((row) => {
                console.log(row);
            });
        });
    },

    getUserPermissionData: (guildId) => {
        return new Promise((resolve, reject) => {
            const sqlRead = `SELECT userID FROM permissionsUser WHERE guildID = '${guildId}'`;

            db.all(sqlRead, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
    },

    getRolePermissionData: (guildId) => {
        return new Promise((resolve, reject) => {
            const sqlRead = `SELECT roleID FROM permissions WHERE guildID = '${guildId}'`;

            db.all(sqlRead, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
    },

    close: () => {
        db.close((err) => {
            if (err) return console.error(err.message);
        });
        console.log("shutdown successful");
    },
};
