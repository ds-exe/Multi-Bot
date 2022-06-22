const sqlite3 = require("sqlite3").verbose();
const timezones = require("./timezones.json");
const { owner } = require("./config.json");
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
            "CREATE TABLE IF NOT EXISTS permissions(roleID PRIMARY KEY, guildID)"
        );
        (err) => {
            if (err) return console.error(err.message);
        };
        db.run(
            "CREATE TABLE IF NOT EXISTS permissionsUser(userID PRIMARY KEY, guildID)"
        );
        (err) => {
            if (err) return console.error(err.message);
        };
    },

    setTimezone: async (message, timezone) => {
        zonesRegex = /^([a-z]+)$/;
        const userID = message.author.id;
        const zoneMatches = zonesRegex.exec(timezone);
        if (zoneMatches !== null) {
            if (zoneMatches[1] in timezones) {
                const zone = timezones[zoneMatches[1]];
                db.run(
                    `REPLACE INTO timezones (userID, timezone) VALUES ('${userID}', '${zone}')`
                );
                await message.channel.send("Successfully set timezone");
                return;
            }
        }

        timezoneRegex = /^(utc[+-]{1}[0-9]{1,2})$/;
        const matches = timezoneRegex.exec(timezone);
        if (matches === null) {
            await message.channel.send("Invalid timezone syntax");
            return; // error does not match
        }
        db.run(
            `REPLACE INTO timezones (userID, timezone) VALUES ('${userID}', '${matches[1].toUpperCase()}')`
        );
        await message.channel.send("Successfully set timezone");
    },

    getTimezone: (userID) => {
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

    allowRole: async (message, roleId, guildId) => {
        db.run(
            `REPLACE INTO permissions (roleID, guildID) VALUES ('${roleId}', '${guildId}')`
        );
        await message.channel.send("Successfully added permissions");
        return;
    },

    denyRole: async (message, roleId, guildId) => {
        db.run(`DELETE FROM permissions WHERE roleID = '${roleId}'`);
        await message.channel.send("Successfully removed permissions");
        return;
    },

    hasPermissionRole: (message, roles) => {
        return new Promise((resolve, reject) => {
            const roleQuery = roles.map((role) => role.id);
            const query = `SELECT * FROM permissions WHERE roleID in (${roleQuery
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

    allowUser: async (message, userId, guildId) => {
        db.run(
            `REPLACE INTO permissionsUser (userID, guildID) VALUES ('${userId}', '${guildId}')`
        );
        await message.channel.send("Successfully added permissions");
        return;
    },

    denyUser: async (message, userId, guildId) => {
        db.run(`DELETE FROM permissionsUser WHERE userID = '${userId}'`);
        await message.channel.send("Successfully removed permissions");
        return;
    },

    hasPermissionUser: (message, userId) => {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM permissionsUser WHERE userID = '${userId}'`;
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

    printPermissionDataBase: () => {
        const sqlRead = "SELECT * FROM permissions";

        db.all(sqlRead, [], (err, rows) => {
            if (err) return console.error(err.message);

            rows.forEach((row) => {
                console.log(row);
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
