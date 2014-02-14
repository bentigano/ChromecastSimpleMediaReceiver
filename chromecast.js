/**
* https://cast.google.com/publish/#/overview
*/

$(document).ready(function(){
    
    // if chromecast API is NOT loaded...
    if (!chrome.cast || !chrome.cast.isAvailable) {
      setTimeout(initializeCastApi, 1000);
    }

});

/**
 * initialization
 */
function initializeCastApi() {
  appendMessage("Attempting to initialize Chromecast...");
  try {
      // default app ID to the default media receiver app
      // optional: you may change it to your own app ID/receiver
      var applicationID = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
      var sessionRequest = new chrome.cast.SessionRequest(applicationID);
      var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
        sessionListener,
        receiverListener);
    
      chrome.cast.initialize(apiConfig, onInitSuccess, onInitError);
  }
  catch(err) {
      appendMessage("Chromecast failed to load. Ensure you have the ChromeCast extension installed and enabled.");
  }
};

/**
 * invoked when the availability of a Cast receiver that supports
 * the application in sessionRequest is known or changes
 * @param {chrome.cast.ReceiverAvailability} e
 */
function receiverListener(e) {
  if(e === chrome.cast.ReceiverAvailability.AVAILABLE) {
    appendMessage("Chromecast receiver found");
  } else {
    appendMessage("Chromecast receiver unavailable");
  }
}

/**
 * invoked when a session is created or connected by the SDK
 * @param {chrome.cast.Session} e
 */
function sessionListener(e) {
  appendMessage('Session established with ID:' + e.sessionId);
  $("#launchApp").attr("disabled", "disabled");
  $("#stopApp").removeAttr("disabled");
  if (e.media.length != 0) {
    appendMessage('Found ' + e.media.length + ' existing media session(s)');
    onMediaDiscovered(false, e.media[0]);
  }
  e.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));
  e.addUpdateListener(sessionUpdateListener.bind(this));
  console.log(e.namespaces[1]);
}

/**
 * initialization success callback
 */
function onInitSuccess() {
  appendMessage("Chromecast API v" + chrome.cast.VERSION + " initialized");
}

/**
 * initialization error callback
 * @param {chrome.cast.Error} e
 */
function onInitError(e) {
  appendMessage("Unable to initialize Chromecast API (" + "TEST" + ")");
}

/**
 * invoked when the status of the Session has changed. Changes to the following properties 
 * will trigger the listener: statusText, namespaces, customData, and the volume of the receiver.
 * @param {}
 */
function sessionUpdateListener(isAlive) {
  var message = isAlive ? 'Session Updated' : 'Session Removed';
  message += ': ' + session.sessionId;
  appendMessage(message);
  if (!isAlive) {
    session = null;
  }
};

/**
 * invoked when a media session is created by another sender
 * @param {bool} newMedia
 * @param {chrome.cast.media.Media} mediaSession
 */
function onMediaDiscovered(newMedia, mediaSession) {
  if (newMedia) {
      appendMessage("New media session created with ID:" + mediaSession.mediaSessionId);
  } else {
      appendMessage("Existin media session loaded with ID:" + mediaSession.mediaSessionId);
  }
  currentMediaSession = mediaSession;
  mediaSession.addUpdateListener(onMediaStatusUpdate);
  mediaCurrentTime = currentMediaSession.currentTime;
  playpauseresume.innerHTML = '<span class="glyphicon glyphicon-play"></span> Play';
  document.getElementById("casticon").src = 'images/cast_icon_active.png'; 
}

/**
 * launch app and request session
 */
function launchApp() {
  appendMessage("Launching Chromecast application...");
  $("#launchApp").attr("disabled", "disabled");
  $("#stopApp").attr("disabled", "disabled");
  chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
}

/**
 * callback on success for requestSession call  
 * @param {chrome.cast.Session} e A non-null new session.
 */
function onRequestSessionSuccess(e) {
  appendMessage("Application launched on receiver: " + e.receiver.friendlyName);
  session = e;
  document.getElementById("casticon").src = 'images/cast_icon_active.png'; 
  $("#launchApp").attr("disabled", "disabled");
  $("#stopApp").removeAttr("disabled");
}

/**
 * callback on launch error
 * @param {chrome.cast.Error} e
 */
function onLaunchError(e) {
  appendMessage("Error launching application: " + e.description);
  $("#stopApp").attr("disabled", "disabled")
  $("#launchApp").removeAttr("disabled")
}

/**
 * stop app/session
 */
function stopApp() {
  $("#launchApp").attr("disabled", "disabled");
  $("#stopApp").attr("disabled", "disabled");
  if (session) {
      session.stop(onStopAppSuccess, onStopAppError);
  } else {
      appendMessage('Unable to stop application - no session exists');
  }
  
}

/**
 * callback on success for stopping app
 */
function onStopAppSuccess() {
  appendMessage('Chromecast application stopped');
  document.getElementById("casticon").src = 'images/cast_icon_idle.png';
  $("#launchApp").attr("disabled", "disabled")
  $("#stopApp").removeAttr("disabled")
}

/**
 * callback on error for stopping app
 * @param {chrome.cast.Error} e
 */
function onStopAppError(e) {
  appendMessage("Unable to stop Chromecast application: " + e);
  $("#stopApp").attr("disabled", "disabled")
  $("#launchApp").removeAttr("disabled")
}

/**
 * append message to debug message window
 * @param {string} message A message string
 */
function appendMessage(message) {
  var debugElement = $('#debugmessage');
  debugElement.val(debugElement.val() + '\n' + message);
  console.log(message);
};