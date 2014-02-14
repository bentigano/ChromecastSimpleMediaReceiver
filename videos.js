/**
 * global variables
 */
var currentMediaSession = null;
var currentVolume = 0.5;
var progressFlag = 1;
var mediaCurrentTime = 0;
var session = null;
var mediaURLs = [
           'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
           'http://commondatastorage.googleapis.com/gtv-videos-bucket/ED_1280.mp4',
           'http://commondatastorage.googleapis.com/gtv-videos-bucket/tears_of_steel_1080p.mov',
           'http://commondatastorage.googleapis.com/gtv-videos-bucket/reel_2012_1280x720.mp4',
           'http://commondatastorage.googleapis.com/gtv-videos-bucket/Google%20IO%202011%2045%20Min%20Walk%20Out.mp3'];
var mediaTitles = [
           'Big Buck Bunny',
           'Elephant Dream',
           'Tears of Steel',
           'Reel 2012',
           'Google I/O 2011 Audio'];

var mediaThumbs = [
           'images/bunny.jpg',
           'images/ed.jpg',
           'images/Tears.jpg',
           'images/reel.jpg',
           'images/google-io-2011.jpg'];
var currentMediaURL = mediaURLs[0];

function onError() {
  appendMessage("error");
}

/**
 * select a media URL 
 * @param {string} m An index for media URL
 */
function selectMedia(m) {
  appendMessage("media selected" + m);
  currentMediaURL = mediaURLs[m]; 
  var playpauseresume = document.getElementById("playpauseresume");
  document.getElementById('thumb').src = mediaThumbs[m];
}

/**
 * load media
 * @param {string} i An index for media
 */
function loadMedia(i) {
  if (!session) {
    appendMessage("no session");
    return;
  }
  appendMessage("loading..." + currentMediaURL);
  var mediaInfo = new chrome.cast.media.MediaInfo(currentMediaURL);
  mediaInfo.contentType = 'video/mp4';
  var request = new chrome.cast.media.LoadRequest(mediaInfo);
  request.autoplay = false;
  request.currentTime = 0;
  
  var payload = {
    "title:" : mediaTitles[i],
    "thumb" : mediaThumbs[i]
  };

  var json = {
    "payload" : payload
  };

  request.customData = json;

  session.loadMedia(request,
    onMediaDiscovered.bind(this, true),
    onMediaError);

}

/**
 * callback on media loading error
 * @param {Object} e A non-null media object
 */
function onMediaError(e) {
  appendMessage("media error: " + e.description);
  document.getElementById("casticon").src = 'images/cast_icon_warning.png'; 
}

/**
 * callback for media status event
 * @param {Object} e A non-null media object
 */
function onMediaStatusUpdate(isAlive) {
  if( progressFlag ) {
    document.getElementById("progress").value = parseInt(100 * currentMediaSession.currentTime / currentMediaSession.media.duration);
  }
  document.getElementById("playerstate").innerHTML = currentMediaSession.playerState;
}

/**
 * play media
 */
function playMedia() {
  if( !currentMediaSession ) 
    return;

  var playpauseresume = document.getElementById("playpauseresume");
  if( playpauseresume.innerHTML == '<span class="glyphicon glyphicon-play"></span> Play' ) {
    currentMediaSession.play(null,
      mediaCommandSuccessCallback.bind(this,"playing started for " + currentMediaSession.sessionId),
      onError);
      playpauseresume.innerHTML = '<span class="glyphicon glyphicon-pause"></span> Pause';
      //currentMediaSession.addListener(onMediaStatusUpdate);
      appendMessage("play started");
  }
  else {
    if( playpauseresume.innerHTML == '<span class="glyphicon glyphicon-pause"></span> Pause' ) {
      currentMediaSession.pause(null,
        mediaCommandSuccessCallback.bind(this,"paused " + currentMediaSession.sessionId),
        onError);
      playpauseresume.innerHTML = '<span class="glyphicon glyphicon-play"></span> Resume';
      appendMessage("paused");
    }
    else {
      if( playpauseresume.innerHTML == '<span class="glyphicon glyphicon-play"></span> Resume' ) {
        currentMediaSession.play(null,
          mediaCommandSuccessCallback.bind(this,"resumed " + currentMediaSession.sessionId),
          onError);
        playpauseresume.innerHTML = '<span class="glyphicon glyphicon-pause"></span> Pause';
        appendMessage("resumed");
      }
    }
  }
}

/**
 * stop media
 */
function stopMedia() {
  if( !currentMediaSession ) 
    return;

  currentMediaSession.stop(null,
    mediaCommandSuccessCallback.bind(this,"stopped " + currentMediaSession.sessionId),
    onError);
  var playpauseresume = document.getElementById("playpauseresume");
  playpauseresume.innerHTML = '<span class="glyphicon glyphicon-play"></span> Play';
  appendMessage("media stopped");
}

/**
 * set media volume
 * @param {Number} level A number for volume level
 * @param {Boolean} mute A true/false for mute/unmute 
 */
function setMediaVolume(level, mute) {
  if( !currentMediaSession ) 
    return;

  var volume = new chrome.cast.Volume();
  volume.level = level;
  currentVolume = volume.level;
  volume.muted = mute;
  var request = new chrome.cast.media.VolumeRequest();
  request.volume = volume;
  currentMediaSession.setVolume(request,
    mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
    onError);
}

/**
 * mute media
 * @param {DOM Object} cb A checkbox element
 */
function muteMedia(cb) {
  if( cb.checked == true ) {
    document.getElementById('muteText').innerHTML = 'Unmute media';
    setMediaVolume(currentVolume, true);
    appendMessage("media muted");
  }
  else {
    document.getElementById('muteText').innerHTML = 'Mute media';
    setMediaVolume(currentVolume, false);
    appendMessage("media unmuted");
  } 
}

/**
 * seek media position
 * @param {Number} pos A number to indicate percent
 */
function seekMedia(pos) {
  appendMessage('Seeking ' + currentMediaSession.sessionId + ':' +
    currentMediaSession.mediaSessionId + ' to ' + pos + "%");
  progressFlag = 0;
  var request = new chrome.cast.media.SeekRequest();
  request.currentTime = pos * currentMediaSession.media.duration / 100;
  currentMediaSession.seek(request,
    onSeekSuccess.bind(this, 'media seek done'),
    onError);
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 * @param {Object} e A non-null media object
 */
function onSeekSuccess(info) {
  appendMessage(info);
  setTimeout(function(){progressFlag = 1},1500);
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 * @param {Object} e A non-null media object
 */
function mediaCommandSuccessCallback(info) {
  appendMessage(info);
}