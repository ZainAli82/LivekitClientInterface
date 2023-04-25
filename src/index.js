// Import the required CSS styles and LiveKit client library
import "./styles.css";
import { connect, createLocalTracks, RoomEvent } from "livekit-client";

// Add an event listener to the "connect" button to call the join function
document.getElementById("connect").addEventListener("click", (e) => {
  join();
});

// This function is responsible for joining the room and subscribing to tracks (video and audio)
async function join() {
  // Get the JWT value from the input field
  const t = document.getElementById("jwt").value;
  console.log(t);

  // Define the LiveKit server URL
  const url = "wss://linuxconnectiontest-15hwbf7p.livekit.cloud";

  // Connect to the room using the JWT token
  const room = await connect(url, t);
  var audioTrackAdded = false;

  // Add an event listener for subscribing to tracks
  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    // When the audio track is added, start recording
    if (audioTrackAdded) {
      // Attach the track and start recording
      attachTrack(track, function () {
        console.log("Audio track subscribed.");
        // Configure the analyzer options
        const opts = {
          cloneTrack: false,
          fftSize: 2048,
          smoothingTimeConstant: 0.8,
          minDecibels: -100,
          maxDecibels: -80,
        };

        // Create a new AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (!audioContext) {
          throw new Error("Audio Context not supported on this browser");
        }

        // Clone the media stream track if necessary
        const streamTrack = opts.cloneTrack ? track.mediaStreamTrack.clone() : track.mediaStreamTrack;
        const stream = new MediaStream([streamTrack]);

        // Set up the MediaRecorder and its event handlers
        let recorder = new MediaRecorder(stream);
        let data = [];
        recorder.ondataavailable = (event) => {
          data.push(event.data);
          console.log("Here: " + event.data.type);

          // Create an audio element and append it to the document body
          const audioElement = document.createElement("audio");
          document.body.appendChild(audioElement);

          // Set the source of the audio element to the recorded data
          audioElement.src = URL.createObjectURL(event.data);

          // Clear the data array
          data = [];
        };

        // Log when the recording starts
        recorder.onstart = () => {
          console.log("Recording started.");

          // Stop the recording after 10 seconds, then restart it
          setTimeout(function () {
            console.log("Stopped...");
            recorder.stop();
            if (recorder.state === "inactive") {
              recorder.start();
            }
          }, 10000);
        };

        // Start the recording
        recorder.start();
      });
    }
    // When the video track is added, log that it has been subscribed to
    else {
      attachTrack(track, function () {
        console.log("Video track subscribed.");
      });
    }

    // Set the audioTrackAdded flag to true for the next run
    audioTrackAdded = true;
  });
}

// This function is responsible for attaching the given track to the specified video element
function attachTrack(track, callback) {
  const v = document.getElementById("them");

  // Attach the track to the video element
  track.attach(v);

  // Call the provided callback function
  callback();
}
