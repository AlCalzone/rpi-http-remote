#!/bin/bash
### BEGIN INIT INFO
# Provides:          rpi-http-remote.sh
# Required-Start:    $network $local_fs $remote_fs
# Required-Stop::    $network $local_fs $remote_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: starts rpi-http-remote
# Description:       starts rpi-http-remote
### END INIT INFO
(( EUID )) && echo .You need to have root privileges.. && exit 1
PIDF=/opt/rpi-http-remote/rpi-http-remote.pid
NODECMD=/usr/bin/node
CMD=/opt/rpi-http-remote/build/main.js
RETVAL=0

start() {
            echo -n "Starting rpi-http-remote"
            sudo $NODECMD $CMD start
            RETVAL=$?
}

stop() {
            echo -n "Can't stop, won't stop"
            sudo $NODECMD $CMD stop
            RETVAL=$?
}
case "$1" in
    start)
      start
  ;;
    stop)
      stop
  ;;
    restart)
      stop
      start
  ;;
    *)
      echo "Usage: rpi-http-remote {start|stop|restart}"
      exit 1
  ;;
esac
exit $RETVAL