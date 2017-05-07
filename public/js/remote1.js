window.onLoadCallback = function() {
    console.log("Google API Loaded");
    var host = document.location.origin;
    var socket = io.connect(host); 
    var playFlag = false;
    var localData = [];
    var googleData = [];
    socket.on('connect', function(data) {
        socket.emit('remote');
        function mergeShow() {
            if (localData.length > 0 && googleData.length > 0) {
                var list = $.merge(localData, googleData);
                showList(list);
                localData = [];
                googleData = [];
            }
        }
        //Youtube
        function showList(data) {
            $("ul.video").html("");
            var jsonObj = [];
            $(data.items).each(function(key, item) {
                var child, 
                    id = item.id.videoId,
                    title = item.snippet.title,
                    thumbnail = item.snippet.thumbnails.default.url,
                    duration = "";    
                
                jsonObj = {
                    id:id,
                    title:title,
                    thumbnail:thumbnail,
                    duration:duration};
                    
                
                var template = $('#videoTpl').html(),
                    html = Mustache.to_html(template, jsonObj);
                $('ul.video').append(html);
                child = $('ul.video li').last();
                if (id != 'local') {
                    getContentList(id, function (resp) {
                        var durText = resp.items[0].contentDetails.duration.replace("PT","").replace("H","H:").replace("M", "M:").replace("S", "S:");
                        child.find(".dur-txt").html(durText.substring(0, durText.length - 1));
                    });
                }
            });

            $(".watch").on("click",function(){
                var video_id = $(this).data('id');
                if (video_id != 'local') {
                    socket.emit('video',{action:"play", video_id:video_id});
                    playFlag = true;
                    $("#rplayer").removeClass("hide");
                } else {
                    socket.emit('local-video',{action:"play", video_id:video_id});
                }
            });
        }
        $$(".r-container").swipeLeft(function(){
            socket.emit('controll',{action:"swipeLeft"}); 
        });

        $$(".r-container").swipeRight(function(){
            socket.emit('controll',{action:"swipeRight"}); 
        });
        $$(".r-header").tap(function(){
            // socket.emit('controll',{action:"tap"}); 
            // $(".app-body").fadeToggle("fast", function () {});    
            // $.get(host+'/omx/quit',function(data){
            //     console.log(data);
            // });
        });
        $$(".app-body").tap(function(){
            // $.get(host+'/omx/pause',function(data){
            //     console.log(data);
            // });
        });
        $(".search input").change(function() {
            //Youtube.getVideo($(this).val(), socket);
            var val = $(this).val();
            if (!val) {
            	searchLocal(val);
                search(val);
            }
         });
        $("#sdown").click(function () {
            if (confirm("Confirm Shutdown?")) {
                socket.emit('controll',{action:"shutdown"}); 
                $(".options .opt-list").addClass("hide");
            }
        });
        $("#options").click(function () {
            $(".options .opt-list").toggleClass("hide");
        });
        $("#fscreen").click(function () {
             socket.emit('controll',{action:"fullscreen"}); 
        });
        $("#playerControl").click(function () {
            $("#rplayer").removeClass("hide");
            $(".options .opt-list").addClass("hide");
        });
        $("#reboot").click(function () {
            if (confirm("Confirm Reboot?")) {
                socket.emit('controll',{action:"reboot"}); 
                $(".options .opt-list").addClass("hide");
            }
        });
        $("#rplayer .close").click(function () {
            $("#rplayer").addClass("hide");    
        });
        $(".player-pause").click(function () {
             if (playFlag) {
             playFlag = false;
                 socket.emit('controll',{action:"player-pause"}); 
             $(".player-pause").html("Play");
             } else {
                 socket.emit('controll',{action:"player-play"}); 
             playFlag = true;
             $(".player-pause").html("Pause");
             }
        });
        $(".player-stop").click(function () {
             socket.emit('controll',{action:"player-stop"}); 
             $("#rplayer").addClass("hide");    
        });
        var clock;
        var startEvent;
        var endEvent;
        if ('ontouchstart' in document.documentElement) {
            startEvent = "touchstart";
            endEvent = "touchend";
        } else {
            startEvent = "mousedown";
            endEvent = "mouseup";
        }
        function continueAction(action) {
            socket.emit('controll',{action:action});
            if (clock) {
                setTimout(function () {
                    socket.emit('controll',{action: action});
                }, 200);
            }
        }
        $(".player-seekforward").on(startEvent, function () {
            clock = true;
            continueAction("player-seekforward");
        }).on(endEvent, function () {
             clock = false;
        });
        $(".player-seekbackward").on(startEvent, function () {
            clock = true;
            continueAction("player-seekbackward");
        }).on(endEvent, function () {
            clock = false;
        });
        $(".player-volumeup").on(startEvent, function () {
            clock = true;
            continueAction("player-volumeup");
        }).on(endEvent, function () {
            clock = false;
        });
        $(".player-volumedown").on(startEvent, function () {
            clock = true;
            continueAction("player-volumedown");
        }).on(endEvent, function () {
            clock = false;
        });

        $(".player-mute").click(function () {
             var muteButton = $(".player-mute");
             if (muteButton.html() == "Mute") { 
             muteButton.html("Un Mute");
                 socket.emit('controll',{action:"player-mute"}); 
             } else {
             muteButton.html("Mute");
                 socket.emit('controll',{action:"player-unmute"}); 
             }
        });
        $("body").click(function (e) {
            if ($(".options .opt-list").has(e.target) && !$("#options").is(e.target)) {
                $(".options .opt-list").addClass("hide");
            }
        });
         
        socket.on("loading", function(data){
            console.log(data);
        });    
        function searchLocal(q) {
            localData = [ {
                id: 'local',
                title: 'Moulaya Salli',
                thumbnail: '/t.jpg',
                duration: '1H:45M'
            }]
            mergeShow();
            // $.getJSON("/getVideos?q=" + q, function (data) {
            //     localData = data;
            //     localData = [ {
            //         id: 'local',
            //         title: 'Moulaya Salli',
            //         thumbnail: '',
            //         duration: '1H:45M'
            //     }]
         //        mergeShow();
            // });
        }
        //https://www.googleapis.com/youtube/v3/videos?id=ID1%2CID2&part=contentDetails&key={API
        function search(q) {
            gapi.client.setApiKey('AIzaSyAfxyAv_fgiacWErpsdj0S4tCprFqIdVAA');
            gapi.client.load('youtube', 'v3').then(function () {
            var request = gapi.client.youtube.search.list({
                q: q,
                maxResults: 50,
                part: 'snippet'
            });

            request.execute(function(response) {
                //var str = JSON.stringify(response.result);
                googleData = response.result;
                mergeShow();
                //showList(response.result);
            //    $('.list-wrapper ul').html('<pre>' + str + '</pre>');
              });
            });
        }
        function getContentList(q, callback) {
            gapi.client.setApiKey('AIzaSyAfxyAv_fgiacWErpsdj0S4tCprFqIdVAA');
            gapi.client.load('youtube', 'v3').then(function () {
              var request = gapi.client.youtube.videos.list({
                id: q,
                part: 'contentDetails'
              });

              request.execute(function(response) {
                //var str = JSON.stringify(response.result);
                callback(response.result);
              });
            });
        }
    });
}
