export DISPLAY=:0.0
/usr/bin/nodejs /home/pi/PiR.tv/app.js >>/dev/null  2>&1 &
sleep 10;
#/usr/bin/epiphany-browser -a --profile /home/pi/.config http://localhost:8080/ >>/dev/null 2>&1 &
