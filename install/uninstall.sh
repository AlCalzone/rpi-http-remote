#!/bin/bash
rpi-http-remote stop
update-rc.d -f rpi-http-remote.sh remove
rm /etc/init.d/rpi-http-remote.sh