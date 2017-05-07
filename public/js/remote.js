window.onLoadCallback = function() {
    console.log("Google API Loaded");
    var host = document.location.origin;
    var playFlag = false;
    var localData = null;
    var googleData = null;
    var showList;
    var getQueuedList;
    $(".search input").change(function() {
        //Youtube.getVideo($(this).val(), socket);
        var val = $(this).val().trim();
        if (val) {
            search(val);
            if (window.io) {
                searchLocal(val);
            }
        }
    });
    
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
            googleData = parseGoogleData(response.result);
            mergeShow();
            //showList(response.result);
        //    $('.list-wrapper ul').html('<pre>' + str + '</pre>');
          });
        });
    }
    function searchLocal(q) {
        // localData = [ {
        //     id: 'file:///C:/Users/mbasha/Desktop/Desktops/Raising_SR_for_DB_changes.jpg',
        //     title: 'Moulaya Salli',
        //     thumbnail: '/images/video.jpg',
        //     duration: '1H:45M'
        // }]
        // mergeShow();
        $.getJSON("/getVideos/" + q, function (data) {
            localData = data;
            mergeShow();
        });
    }
    function parseGoogleData(data) {
        var items = [];
        $(data.items).each(function(key, item) {
            var jsonObj = {
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.default.url,
                duration: ""
            };
            if (item.id.videoId) {
                jsonObj.id = item.id.videoId;
                jsonObj.google = "google";
            } else if (item.id.channelId) {
                jsonObj.cid = item.id.channelId;
            }
            items.push(jsonObj);
        });
        return items;
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
    function mergeShow() {
        if (localData != null && googleData != null) {
            var list = $.merge(localData, googleData);
            showList(list);
            localData = null;
            googleData = null;
        }
    }
    function showVidList(data) {
        $("ul.video").html("");
        var template = $('#videoTpl').html();
        $(data).each(function (index, item) {
            var html = Mustache.to_html(template, item),
                child;
            $('ul.video').append(html);
            child = $('ul.video li').last();
            if (item.id && item.id.indexOf('file') == -1) {
                getContentList(item.id, function (resp) {
                    var durText = resp.items[0].contentDetails.duration.replace("PT","").replace("H","H:").replace("M", "M:").replace("S", "S:");
                    child.find(".dur-txt").html(durText.substring(0, durText.length - 1));
                });
            }
        });
    }
    $("body").click(function (e) {
        if ($(".options .opt-list").has(e.target) && !$("#options").is(e.target)) {
            $(".options .opt-list").addClass("hide");
        }
    });
    $("#playerControl").click(function () {
        $("#rplayer").removeClass("hide");
        $(".options .opt-list").addClass("hide");
    });
    $("#options").click(function () {
        $(".options .opt-list").toggleClass("hide");
    });
    if (window.io) {
        var socket = io.connect(host); 
        socket.on('connect', function(data) {
            socket.emit('remote');
            //Youtube
            showList = function (data) {
                $(".watch").off("click");
                showVidList(data);
                $(".watch").on("click",function(){
                    var videoId = $(this).data('id');
                    if (videoId) {
                        if (videoId.indexOf("file") == -1) {
                            socket.emit('video',{action:"play", video_id:videoId});
                            playFlag = true;
                            $("#rplayer").removeClass("hide");
                        } else {
                            socket.emit('local-video',{action:"play", video_id:videoId});
                            playFlag = true;
                            $("#rplayer").removeClass("hide");
                        }
                    }
                });
                $(".queue").on("click",function(){
                    var videoId = $(this).data('id');
                    if (videoId) {
                        if (videoId.indexOf("file") == -1) {
                            $("#mesg").removeClass('hide');
                            setTimeout(function () {
                                $("#mesg").addClass('hide');
                            }, 3000);
                            socket.emit('video',{action:"queue", video_id:videoId});
                            playFlag = true;
                            // $("#rplayer").removeClass("hide");
                        } else {
                            socket.emit('local-video',{action:"queue", video_id:videoId});
                            playFlag = true;
                            $("#rplayer").removeClass("hide");
                        }
                    }
                });
            }
            $$(".r-container").swipeUp(function(){
                $(".r-container").addClass("hide");
                socket.emit('controll',{action:"player-play"}); 
            });
            $$(".r-container").swipeDown(function(){
                $(".r-container").addClass("hide");
                socket.emit('controll',{action:"enter"}); 
            });
            $$(".r-container").swipeLeft(function(){
                socket.emit('controll',{action:"swipeLeft"}); 
            });
            $$(".r-container").swipeRight(function(){
                socket.emit('controll',{action:"swipeRight"}); 
            });
            $(".player-qlist").on("click", function () {
                $(".r-container").removeClass("hide");
                socket.emit('controll',{action:"player-qlist"}); 
                // $.getJSON("/getQueuedList", function(result){
                //     //list videos
                // });
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
            
            $("#sdown").click(function () {
                if (confirm("Confirm Shutdown?")) {
                    socket.emit('controll',{action:"shutdown"}); 
                    $(".options .opt-list").addClass("hide");
                }
            });
            $("#fscreen").click(function () {
                 socket.emit('controll',{action:"fullscreen"}); 
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
                    setTimeout(function () {
                        continueAction(action);
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
            $(".player-prev").on("click", function () {
                socket.emit('controll',{action: "player-prev"});
            })
            $(".player-next").on("click", function () {
                socket.emit('controll',{action: "player-next"});
            })
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
            
             
            socket.on("loading", function(data){
                console.log(data);
            });
        });
    }
    if (location.href.indexOf("file") === 0) {
        var data = { "kind": "youtube#searchListResponse", "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/sHM6VGrzds6GKSUH0joYNJKolLo\"", "nextPageToken": "CDIQAA", "regionCode": "IN", "pageInfo": { "totalResults": 6236, "resultsPerPage": 1 }, "items": [ { "kind": "youtube#searchResult", "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/pHBNDUO_1P6rcteY2hwa42xBje8\"", "id": { "kind": "youtube#video", "videoId": "lfQyiBB4ucw" }, "snippet": { "publishedAt": "2016-05-11T07:01:15.000Z", "channelId": "UCN-XFi_5sVg17byJoZiXvQQ", "title": "Dheres Udané Cover by Formatie Sahabat", "description": "Muziek Formatie Sahabat From Suriname.", "thumbnails": { "default": { "url": "https://i.ytimg.com/vi/lfQyiBB4ucw/default.jpg", "width": 120, "height": 90 }, "medium": { "url": "https://i.ytimg.com/vi/lfQyiBB4ucw/mqdefault.jpg", "width": 320, "height": 180 }, "high": { "url": "https://i.ytimg.com/vi/lfQyiBB4ucw/hqdefault.jpg", "width": 480, "height": 360 } }, "channelTitle": "soegijoma masdjo", "liveBroadcastContent": "none" } }]};
        googleData = parseGoogleData(data);
        showVidList(googleData);
    }
}
