#!/bin/bash
cp ./rpi-http-remote.sh /etc/init.d/rpi-http-remote.sh
chmod 755 /etc/init.d/rpi-http-remote.sh
update-rc.d rpi-http-remote.sh defaults
rpi-http-remote start