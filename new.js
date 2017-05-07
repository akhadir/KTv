/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()  
  , server = require('http').createServer(app)
  , path = require('path')
  , io = require('socket.io').listen(server)
  , spawn = require('child_process').spawn
  , glob = require("glob")
  , path = require('path')
  , playPID;
 // , child;
 // , omx = require('omxcontrol');


process.env.DISPLAY=':0.0';
// all environments
app.set('port', process.env.TEST_PORT || 8080);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(omx());
console.log("ENV: ");
console.log(app.get("env"));
console.log(server);
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//Routes
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

app.get('/remote', function (req, res) {
  res.sendfile(__dirname + '/public/remote.html');
});
//Following not in use
app.get('/video/:video_id', function (req, res) {
  res.sendfile(__dirname + '/public/video.html');
});
//Following not in use
app.get('/local-video/:video_id', function (req, res) {
  res.sendfile(__dirname + '/public/local-video.html');
});
app.get('/getVideos/:query', function (req, res) {
  console.log(req.params.query);
  // options is optional
  //console.log(process.cwd())
  var options = {
                  cwd: '/media/pi/UUI6/videos',
                  nocase: true,
                  realpath: true
                };
    glob("**/*" + req.params.query + "*.*", options, function (er, files) {
    //console.log(files);
    res.send(getLocalOutput(files));

  })
  //res.sendfile(__dirname + '/public/video.html');
});
function getLocalOutput(files) {
    var i,
        obj,
        out = [];
        len = files.length;
    for (i = 0; i < len; i++) {
        obj = {
            id: 'file:///' + files[i].replace(/ /g, '#~#'),
            title: path.basename(files[i]),
            thumbnail: '/images/video.jpg',
            duration: '0HR'
        }
        out.push(obj);
    }
    return out;
}
//Socket.io Config
io.set('log level', 1);
/*
io.set('transports', [
'websocket'
, 'flashsocket'
, 'htmlfile'
, 'jsonp-polling'
]);
*/

server.listen(app.get('port'), function(){
  console.log('Pirate TV is running on port ' + app.get('port'));
});

var ss;

//Run and pipe shell script output
function run_shell(cmd, args, cb, end) {
    var spawn = require('child_process').spawn,
        child,
        me = this;
    child = spawn(cmd, args);
    child.stdout.on('data', function (buffer) { cb(me, buffer); });
    child.stdout.on('end', end);
    console.log("Running shell..." + child.pid);
    return child;
}
function runShell(cmd, args, env, cb, end) {
    var spawn = require('child_process').spawn,
        child,
        me = this;
    child = spawn(cmd, args, env);
    child.stdout.on('data', function (buffer) { cb(me, buffer); });
    child.stdout.on('end', end);
    console.log("Running shell..." + child.pid);
    return child;
}
//Socket.io Server
io.sockets.on('connection', function (socket) {

 socket.on("screen", function(data){
   socket.type = "screen";
   ss = socket;
   console.log("Screen ready...");
 });
 socket.on("remote", function(data){
   socket.type = "remote";
   console.log("Remote ready...");
 });

 socket.on("controll", function(data){
   if(socket.type === "remote"){

     if(data.action === "tap"){
         if(ss != undefined){
            ss.emit("controlling", {action:"enter"});
         }
     }
     else if(data.action === "swipeLeft"){
      if(ss != undefined){
          ss.emit("controlling", {action:"goLeft"});
      }
     }
     else if(data.action === "swipeRight"){
       if(ss != undefined){
           ss.emit("controlling", {action:"goRight"});
       }
     }
     else if(data.action === "fullscreen"){
     	console.log("Command: Fullscreen");
        runShell("/usr/bin/lxterminal", ['-e', '/usr/bin/xte "key F11" -x:0'], {DISPLAY: ':0.0'},function (me, buffer) {
            console.log(me.stdout + buffer.toString());
        },
        function () {
        });
	
     }
     else if(data.action === "reboot"){
	      run_shell("reboot", [], function() {}, function() {});	
     }
     else if(data.action === "shutdown"){
        run_shell("shutdown", ["-P"], function() {}, function() {});	
     }
     else if (data.action) {
        if (data.action == 'player-stop') {
            if (playPID) {
                console.log("Kill process...." + playPID.pid);
                spawn("pkill", ["-9", "-P", playPID.pid]);
              }
                //playPID.stdin.pause();
                // playPID.lkill('SIGTERM');
                // playPID.kill('SIGKILL');
                playPID = null;
        }
        if(ss != undefined){
            ss.emit("controlling", {action: data.action});
        }
     }
   }
});
socket.on("local-video", function(data) {
    if (data.action === "play"){
    	if (playPID) {
    	//	playPID.kill('SIGTERM');
                spawn("pkill", ["-9", "-P", playPID.pid]);
    	}
        console.log("Playing local file: "+ data.video_id);
        playPID = new run_shell('omxplayer', ['-b', data.video_id.replace(/#~#/g, ' ').replace("file:///","")],
        function (me, buffer) {
            console.log(me.stdout);
        },
        function () {
        });
    }
});
socket.on("video", function(data){
    if( data.action === "play"){
            if (playPID) {
                console.log("Kill process...." + playPID.pid);
                spawn("pkill", ["-9", "-P", playPID.pid]);
              }
	playPID = null;
        var id = data.video_id,
        url = "http://www.youtube.com/watch?v="+id;
	      ss.emit("controlling", {action: "playVideo", id: id});
    }
/*
    var runShell = new run_shell('epiphany-browser',['-a','--profile', '/home/pi/.config', url],
    function (me, buffer) {
        me.stdout += buffer.toString();
        socket.emit("loading",{output: me.stdout});
        console.log(me.stdout);
    },
    function () {
        delete child;
    });	

    var runShell = new run_shell('youtube-dl',['-o','%(id)s.%(ext)s','-f','/18/22',url],
        function (me, buffer) {
            me.stdout += buffer.toString();
            socket.emit("loading",{output: me.stdout});
            console.log(me.stdout);
         },
        function () {
            //child = spawn('omxplayer',[id+'.mp4']);
            //omx.start(id+'.mp4');
        });
    }
*/
 });
});

