#!/bin/bash
update-rc.d -f rpi-http-remote.sh remove
rm -f /etc/init.d/rpi-http-remote.sh