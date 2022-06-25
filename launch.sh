#!/usr/bin/env bash
pushd /home/pi/Multi-Bot
pm2 start Multi-Bot.config.js
popd
