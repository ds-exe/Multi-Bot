# Installation and Setup

Prerequisites:

-   Node.js 16.9 or higher (latest LTS works)
-   git

1. `git clone https://github.com/ds-exe/Multi-Bot.git && cd Multi-Bot`
2. `npm install`
3. Remove `.example` from both `MultiDatabase.db.example` and `config.json.example`
4. Edit `config.json` to populate all fields as required

Run the bot via your chosen script (launch.bat included for windows, launch.sh for linux via pm2)

# Updating existing bot

1. Navigate to Multi-Bot directory
2. `npm run update`
3. Restart bot to run new version
