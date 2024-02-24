import './App.css'

function App() {
  setInterval(() => watchVideo(), 1);
  return (
    <>
      <video id={"target"} src="./../public/test.mp4" controls />
      <button onClick={playVideo}>Play</button>
    </>
  )
}

function playVideo() {
  const video = document.getElementById("target") as HTMLVideoElement;
  video.currentTime = 60 * 4;
  video.play();
}

function watchVideo() {
  const video = document.getElementById("target") as HTMLVideoElement;
  if (video.currentTime > 60 * 4 + 10) {
    playVideo();
  }
}

export default App
