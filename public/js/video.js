(function () {
    var queuedVideos = [],
        currentIndex = -1;
    function showPlayer() {
        if (window.YTPlayer) {
            window.YTPlayer.destroy();
            delete window.YTPlayer;
            $("#player").unbind().remove();
            $("body").prepend("<div id='player'></div>")

            //var player = $("div", {id:"player"});
            //$("body").prepend(player);

        }
        window.YTPlayer = new YT.Player("player", {
            height: $(window).innerHeight,
            width: $(window).innerWidth,
            videoId: window.videoId, //'M7lc1UVf-VE',
            playerVars: {
                autoplay: 1,
                enablejsapi: 0,
                loop: 1,
                html5: 1,
                controls: 0,
                modestbranding: 1,
                showinfo: 0,
                rel: 1,
                iv_load_policy: 3,
                disablekb: 0,
                vq: "medium"
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
        // window.YTPlayer.setPlaybackQuality("medium");
    }
    window.onYouTubeIframeAPIReady = function () {
        window.playerReady = true;
        showPlayer();
    }

    function onPlayerReady(event) {
        event.target.playVideo();
    }

    var done = false;
    function playNext() {
        if (currentIndex < queuedVideos.length - 1) {
            YTPlayer.stopVideo();
            currentIndex++;
            var videoId = window.videoId = queuedVideos[currentIndex];
            YTPlayer.cueVideoById({videoId: videoId});
            YTPlayer.setPlaybackQuality("medium");
            YTPlayer.playVideo();
        } else {
            return false;
        }
        return true;
    }
    function playPrev() {
        if (currentIndex > 0) {
            YTPlayer.stopVideo();
            currentIndex--;
            var videoId = window.videoId = queuedVideos[currentIndex];
            YTPlayer.cueVideoById({videoId: videoId});
            YTPlayer.setPlaybackQuality("medium");
            YTPlayer.playVideo();
        }
    }
    function onPlayerStateChange(event) {
        var playStatus;
        if (event.data == YT.PlayerState.PLAYING && !done) {
            //setTimeout(stopVideo, 6000);
            done = true;
        } else if (event.data == YT.PlayerState.ENDED) {
            playStatus = playNext();
            if (playStatus === false && window.onVideoEnd) {
                window.onVideoEnd(window.videoId);
            }
        }
    }
    window.playVideoByIndex = function (nodeId, index) {
        currentIndex = index;
        var videoId = window.videoId = queuedVideos[currentIndex];
        YTPlayer.cueVideoById({videoId: videoId});
        YTPlayer.setPlaybackQuality("medium");
        YTPlayer.playVideo();
    }
    // function playVideo() {
    //     player.playVideo();
    // }

    // function pauseVideo() {
    //     player.pauseVideo();
    // }

    // function stopVideo() {
    //     player.stopVideo();
    // }
    window.nextVideo = function () {
        playNext();
    }
    window.prevVideo = function () {
        playPrev();
    }
    window.getQueuedList = function () {
        return queuedVideos;
    }
    window.playVideo = function (nodeId, videoId) {
        window.videoId = videoId;
        
        if (!window.playerReady) {
            queuedVideos = [];
            currentIndex = 0;
            queuedVideos.push(videoId);
            //var tag = $('<script>', {scr: "https://www.youtube.com/iframe_api"});
            //$("body").append(tag);
            var tag = document.createElement('script');

            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementById('player');
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            YTPlayer.stopVideo();
            queuedVideos.push(videoId);
            currentIndex = queuedVideos.length - 1;
            YTPlayer.cueVideoById({videoId: videoId});
            YTPlayer.playVideo();
        }
    }
    window.getCurrentIndex = function() {
        return currentIndex;
    }
    window.queueVideo = function (nodeId, videoId) {
        if (!window.playerReady) {
            queuedVideos = [];
            currentIndex = 0;
            queuedVideos.push(videoId);
            window.videoId = videoId;
            //var tag = $('<script>', {scr: "https://www.youtube.com/iframe_api"});
            //$("body").append(tag);
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementById('player');
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        } else {
            var state = YTPlayer && YTPlayer.getPlayerState ? YTPlayer.getPlayerState() : -1;
            if (state == -1) {//unstarted
                currentIndex++;
                queuedVideos.push(videoId);
                window.videoId = videoId;
                showPlayer();
            } else if (state == 0) {//ended
                currentIndex++;
                queuedVideos.push(videoId);
                window.videoId = videoId;
                YTPlayer.stopVideo();
                YTPlayer.cueVideoById({videoId: videoId});
                YTPlayer.playVideo();
            } else {
                queuedVideos.push(videoId);
                // YTPlayer.cueVideoById({videoId: videoId});
                // YTPlayer.playVideo();
            }
        }
    }
})();
