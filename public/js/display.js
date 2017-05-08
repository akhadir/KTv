var myApp = angular.module('myApp', ['ngRoute']);
var recentVideosScope;
var relatedVideosScope;
var currentPlaylistIndex = 0;
var loadCount = 0;
var videoInfo = {};
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

function search(q, count, callback) {
    gapi.client.setApiKey('AIzaSyAfxyAv_fgiacWErpsdj0S4tCprFqIdVAA');
    gapi.client.load('youtube', 'v3').then(function () {
        var request = gapi.client.youtube.search.list({
            q: q,
            maxResults: count,
            part: 'snippet'
        });

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
    var current = $(".selected");
    if (data.action === "goLeft") {
       if ($("#playlist").hasClass("hide")) {
	        $(".selected").removeClass("selected");
	        if ($(current).prev().attr("id") === "start-block") {
	            $("#end-block").prev().addClass("selected");
	        } else {
	            $(current).prev().addClass("selected");
	        }
	    } else {
	    	if (currentPlaylistIndex) {
	    	 	$(".video-list-wrap .block")[--currentPlaylistIndex].focus();
	    	}
	    }
    } else if (data.action === "goRight") {
    	if ($("#playlist").hasClass("hide")) {
	        $(".selected").removeClass("selected");
	        if ($(current).next().attr("id") === "end-block") {
	            $("#start-block").next().addClass("selected");
	        } else {
	            $(current).next().addClass("selected");
	        }
	    } else {
	    	if (currentPlaylistIndex >= 0 && currentPlaylistIndex  < $(".video-list-wrap .block").length - 1 ) {
	    	 	$(".video-list-wrap .block")[++currentPlaylistIndex].focus();
	    	}
	    }
    } else if (data.action === "enter") {
    	hidePlayList();
    	YTPlayer.stopVideo();
        playVideoByIndex("player", currentPlaylistIndex);
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
        var queuedList = window.getQueuedList(),
        	selChild,
        	videos = [],
        	len = queuedList.length,
        	i;
        loadCount = 0;
        recentVideosScope.videos = videos;
        for (i = 0; i < len; i++) {
        	loadCount++;
        	loadQueuedVideoInfo(i, videos);
        }
        if (len) {
        	loadPlayList();
        }
    }
    function setVideoInfo (videoId) {
    	var video = video = {
            id: videoId,
            img: "",
            title: "",
            duration: ""
        };
    	search(videoId, 1, function (resp) {
            var item = resp.items[0];
            video.img =  item.snippet.thumbnails.medium.url;
            video.title =  item.snippet.title;
	        getContentList(videoId, function (resp) {
                video.duration = resp.items[0].contentDetails.duration.replace("PT", "").replace("H", "H:").replace("M", "M:").replace("S", "S");
	        	videoInfo[videoId] = video;
            });
        });
    }
    function loadQueuedVideoInfo(i, videos) {
    	var video,
    		videoId = queuedList[i];
    	if (videoInfo[videoId]) {
    		video = videoInfo[videoId];
    		loadCount--;
    	} else {
    		video = {
	            id: videoId,
	            img: "",
	            title: "",
	            duration: ""
	        };
	    	search(videoId, 1, function (resp) {
	            var item = resp.items[0];
	            video.img =  item.snippet.thumbnails.medium.url;
	            video.title =  item.snippet.title;
		        getContentList(videoId, function (resp) {
	                video.duration = resp.items[0].contentDetails.duration.replace("PT", "").replace("H", "H:").replace("M", "M:").replace("S", "S");
		        	videoInfo[videoId] = video;
		        	loadCount--;
	            });
	        });
    	}
        videos.push(video);
    }
    function showRelatedVideos(videoId) {
        var relVideos = [];
        relatedVideosScope.videos = relVideos;
        search(videoId, 50, function (resp) {
            var i,
                item,
                video,
                items = resp.items,
                len = items.length;
            for (i = 0; i < len; i++) {
                item = resp.items[i];
                if (item.id.videoId) {
                    video = {
                        id: item.id.videoId,
                        img: item.snippet.thumbnails.medium.url,
                        title: item.snippet.title
                    }
                    getContentList(videoId, function (resp) {
                        video.duration = resp.items[0].contentDetails.duration.replace("PT", "").replace("H", "H:").replace("M", "M:").replace("S", "S");
                        relVideos.push(video);
                        relatedVideosScope.$apply();
                        videoInfo[videoId] = video;
                    });
                }
            }
        });
    }
    function loadPlayList() {
        var selChild,
            videoId;
    	if (loadCount === 0) {
    		recentVideosScope.$apply();
			YTPlayer.pauseVideo();
	    	$("#playlist").removeClass("hide");
	    	if (window.videoId) {
                videoId = window.videoId;
	    		selChild =  $(".video-list-wrap .block[data-id='" + window.videoId + "']").focus();
	    		selChild[0].scrollIntoView({block: "end", behavior: "smooth"});
	        	currentPlaylistIndex = $(".video-list-wrap .block").index(selChild);
	        } else {
	        	currentPlaylistIndex = 0;
                selChild = $(".video-list-wrap .block").first().focus();
	        	videoId = selChild.data("id");
	        }
            showRelatedVideos(videoId);
	    } else {
	    	setTimeout(function () {
	    		loadPlayList();
	    	}, 1000);
	    }
    }
})
