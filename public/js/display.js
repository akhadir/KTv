var myApp = angular.module('myApp', ['ngRoute']),
    recentVideosScope,
    relatedVideosScope,
    currentPlaylistIndex = 0,
    recentFocusFlag = true,
    loadCount = 0,
    videoInfo = {};

myApp.controller('MyRelVideos', ['$scope', function ($scope) {
    $scope.name = 'Related Videos';
    relatedVideosScope = $scope;
}]);
myApp.controller('MyVideos', ['$scope', function ($scope) {
    $scope.name = 'Recent Videos';
    recentVideosScope = $scope;
    // var videos = [{
    //     id: "2322ddf32",
    //     title: "Dhere Dhere Se",
    //     img: "https://i.ytimg.com/vi/lfQyiBB4ucw/default.jpg",
    //     duration: "5H:2M:3S"
    // }];
    // $scope.videos = videos;
}]);

window.onLoadCallback = function () {
    console.log("Google API Loaded");
}

function search(q, related, callback) {
    var count = related ? 50 : 1;
    gapi.client.setApiKey('AIzaSyAfxyAv_fgiacWErpsdj0S4tCprFqIdVAA');
    gapi.client.load('youtube', 'v3').then(function () {
        var request;
        if (!related) {
            request = gapi.client.youtube.videos.list({
                id: q,
                // maxResults: count,
                part: 'snippet,contentDetails'
            });
        } else {
            request = gapi.client.youtube.search.list({
                relatedToVideoId: q,
                maxResults: count,
                part: 'snippet',
                type: 'video'
            });
        }
        request.execute(function (response) {
            callback(response);
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
        request.execute(function (response) {
            callback(response.result);
        });
    });
    return "";
}
function hidePlayList() {
	$("#playlist").addClass("hide");
}
var host = document.location.origin;
var socket = io.connect(host);
socket.on('connect', function (data) {
    socket.emit('screen');
});

socket.on('controlling', function (data) {
    var current = $(".selected"),
        activeEle,
        index,
        videoId;
    if (data.action === "goLeft") {
       if ($("#playlist").hasClass("hide")) {
	        $(".selected").removeClass("selected");
	        if ($(current).prev().attr("id") === "start-block") {
	            $("#end-block").prev().addClass("selected");
	        } else {
	            $(current).prev().addClass("selected");
	        }
	    } else {
	    	// if (currentPlaylistIndex) {
	    	//  	$(".video-list-wrap .block")[--currentPlaylistIndex].focus();
	    	// }
            if ($(document.activeElement).prev().length) {
                $(document.activeElement).prev().focus();
            }
	    }
    } else if (data.action === "swipeUp") {
        recentFocusFlag = true;
        currentPlaylistIndex = 0;
        $(".list1 .block").first().focus();
    } else if (data.action === "swipeDown") {
        recentFocusFlag = false;
        $(".list2 .block").first().focus();
    } else if (data.action === "goRight") {
    	if ($("#playlist").hasClass("hide")) {
	        $(".selected").removeClass("selected");
	        if ($(current).next().attr("id") === "end-block") {
	            $("#start-block").next().addClass("selected");
	        } else {
	            $(current).next().addClass("selected");
	        }
	    } else {
	    	// if (currentPlaylistIndex >= 0 && currentPlaylistIndex  < $(".video-list-wrap .block").length - 1 ) {
	    	//  	$(".video-list-wrap .block")[++currentPlaylistIndex].focus();
	    	// }
            if ($(document.activeElement).next().length) {
                $(document.activeElement).next().focus();
            }

	    }
    } else if (data.action === "enter") {
        activeEle = $(document.activeElement);
    	hidePlayList();
        if (YTPlayer) {
            YTPlayer.stopVideo();
        }
        if (recentFocusFlag) {
            index = $(".video-list-wrap .block").index(activeEle);
            playVideoByIndex("player", index);
        } else {
            recentFocusFlag = true;
            playVideo("player", activeEle.data("id"));
        }
    } else if (data.action === "playVideo") {
    	hidePlayList();
    	setVideoInfo(data.id);
        playVideo("player", data.id);
        //window.open("/video/"+data.id);	  
    } else if (data.action === "playVideoList") {
        hidePlayList();
        queueChannel("player", data.cid);
        //window.open("/video/"+data.id);	  
    } else if (data.action === "queueVideo") {
        hidePlayList();
        setVideoInfo(data.id);
        queueVideo("player", data.id);
    } else if (data.action === "player-pause") {
        YTPlayer.pauseVideo();
    } else if (data.action === "player-stop") {
        YTPlayer.pauseVideo();
        location.reload();
    } else if (data.action === "player-play") {
    	hidePlayList();
        YTPlayer.playVideo();
    } else if (data.action === "player-mute") {
        YTPlayer.mute();
    } else if (data.action === "player-unmute") {
        YTPlayer.unMute();
    } else if (data.action === "player-volumeup") {
        var currVolume = YTPlayer.getVolume();
        if (!currVolume) {
            currVolume = 0;
        }
        YTPlayer.setVolume(currVolume + 5);
    } else if (data.action === "player-volumedown") {
        var currVolume = YTPlayer.getVolume();
        if (!currVolume || currVolume - 5 < 5) {
            currVolume = 5;
        }
        YTPlayer.setVolume(currVolume - 5);
    } else if (data.action === "player-seekforward") {
    	hidePlayList();
        var currTime = YTPlayer.getCurrentTime();
        if (currTime) {
            YTPlayer.seekTo(currTime + 10, true);
        }
    } else if (data.action === "player-seekbackward") {
    	hidePlayList();
        var currTime = YTPlayer.getCurrentTime();
        if (currTime && currTime > 9) {
            YTPlayer.seekTo(currTime - 10, true);
        }
    } else if (data.action === "player-prev") {
    	hidePlayList();
        window.prevVideo();
    } else if (data.action === "player-next") {
    	hidePlayList();
        window.nextVideo();
    } else if (data.action === "player-qlist") {
        YTPlayer.pauseVideo();
        showPlayList();
    }
    function showPlayList() {
        var queuedList = window.getQueuedList();
        loadVideoInfo(queuedList, function (videos) {
            recentVideosScope.videos = videos;
            loadPlayList();
        });
    }
    function setVideoInfo (videoId) {
    	// search(videoId, false, function (resp) {
     //        var item = resp.items[0],
     //        video = {
     //            id: videoId,
     //            img: item.snippet.thumbnails.medium.url,
     //            title: item.snippet.title,
     //            duration: resp.items[0].contentDetails.duration.replace("PT", "").replace("H", "H:").replace("M", "M:").replace("S", "S")
     //        };
     //        videoInfo[videoId] = video;
     //    });
    }
    function loadVideoInfo(videoList, callback) {
    	var video,
            i,
            len = videoList.length,
            videos = [],
            pendingVideos = videoList,
            pendingVideosStr,
    		videoId;
        // for (i = 0; i < len; i++) {
        //     videoId = videoList[i];
        // 	if (videoInfo[videoId]) {
        // 		video = videoInfo[videoId];
        //         videos.push(video);
        // 	} else {
        // 		pendingVideos.push(videoId);
        // 	}
        // }
        if (pendingVideos.length) {
            pendingVideosStr = pendingVideos.join(",");
            search(pendingVideosStr, false, function (resp) {
                var item;
                for (i = 0; i < len; i++) {
                    item = resp.items[i];
                    video = {
                        id: item.id.videoId ? item.id.videoId : item.id,
                        img: item.snippet.thumbnails.medium.url,
                        title: item.snippet.title,
                        duration: item.contentDetails.duration.replace("PT", "").replace("H", "H:").replace("M", "M:").replace("S", "S")
                    };
                    videoInfo[videoId] = video;
                    videos.push(video);
                }
                callback(videos);
            });
        }        
    }
    window.onVideoEnd = function (videoId) {
        showRelatedVideos(videoId);
    }
    function showRelatedVideos(videoId) {
        var relVideos = [],
            pendingVideos = [];
        search(videoId, true, function (resp) {
            var i,
                item,
                video,
                items = resp.items,
                len = items.length;
            for (i = 0; i < len; i++) {
                item = resp.items[i];
                if (item.id.videoId) {
                    pendingVideos.push(item.id.videoId);
                }
            }
            loadVideoInfo(pendingVideos, function (videos) {
                relatedVideosScope.videos = videos;
                relatedVideosScope.$apply();
            });
        });
    }
    function loadPlayList() {
        var selChild,
            videoId;
		recentVideosScope.$apply();
    	$("#playlist").removeClass("hide");
    	if (window.videoId) {
            videoId = window.videoId;
    		currentPlaylistIndex =  window.getCurrentIndex();
            selChild = $(".video-list-wrap .block").eq(currentPlaylistIndex).focus();
    		if (selChild.length) {
                selChild[0].scrollIntoView({block: "end", behavior: "smooth"});
            }
        } else {
        	currentPlaylistIndex = 0;
            selChild = $(".video-list-wrap .block").first().focus();
        	videoId = selChild.data("id");
        }
        showRelatedVideos(videoId);
    }
})
