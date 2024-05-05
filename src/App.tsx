import './App.css';
import {Button, ButtonGroup} from '@mui/material';
import {useState, useEffect, useRef} from 'react';
import MovieIcon from '@mui/icons-material/Movie';
import MovieFileSelector from './components/MovieFileSelector.tsx';
import VideoProgressBar from './components/VideoProgressBar.tsx';
import VideoStartPositionSlider from './components/VideoStartPositionSlider.tsx';
import VideoClipSlider from './components/VideoClipSlider.tsx';
import {convertMilliSecondsTimeToText} from './lib/FormatTime.tsx';
import VideoCutEditor from './components/VideoCutEditor.tsx';

const minDistance = 0.5;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Crop {
  source: Rect;
  draw: Rect;
}

class Preview {
  size: {
    width: number
    height: number
  };
  crops: Crop[];
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;

  constructor(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.size = {
      width: 640,
      height: 640
    };
    this.crops = [];
    this.video = video;
    this.canvas = canvas;
  }

  onUpdate(){
    this.canvas.width = this.size.width;
    this.canvas.height = this.size.height;
    const context = this.canvas.getContext('2d');
    if (context) {
      context.clearRect(0,0, this.size.width, this.size.height);
      for (const crop of this.crops) {
        context.drawImage(this.video,
          crop.source.x, crop.source.y, crop.source.width, crop.source.height,
          crop.draw.x,crop.draw.y, crop.draw.width, crop.draw.height
        );
      }
    }
  }
}



function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentProgressTime, setCurrentProgressTime] = useState<number>(0);
  const [trimTime, setTrimTime] = useState<number[]>([0, 60]);
  const [duration, setDuration] = useState<number>(-1);
  const [source, setSource] = useState<string>('./movies/test.mp4');
  const sourceRef = useRef<HTMLInputElement>(null);

  /**
   * 動画変更時のコールバック
   */
  useEffect(() => {
    if (0 < duration) {
      return;
    }
    const interval = setInterval(() => {
      if (videoRef.current) {
        if (!Number.isNaN(videoRef.current.duration)) {
          const video = videoRef.current;
          setDuration(() => video.duration);
          setTrimTime(() => [0, video.duration]);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [duration]);

  /**
   * トリミング範囲変更時のコールバック
   */
  useEffect(() => {
    // 動画の再生位置を監視する
    const interval = setInterval(() => {
      if (videoRef.current) {
        const video = videoRef.current;
        if (!Number.isNaN(video.duration)) {
          replayVideo(video, trimTime[0], trimTime[1]);
          setCurrentProgressTime(() => video.currentTime);
        }
      }
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [trimTime]);

  function playVideoWrapper(time: number) {
    if (videoRef.current) {
      playVideo(videoRef.current, time);
    }
  }

  function createButtonData(startDiff: number, endDiff : number) {
    if (startDiff === 0) {
      return {
        label: `End ${endDiff}`,
        callback: () => {
          const startTime = Math.min(Math.max(trimTime[0] + startDiff, 0), trimTime[1] + endDiff - minDistance);
          const endTime = Math.min(trimTime[1] + endDiff, duration);
          setTrimTime([startTime, endTime]);
          playVideoWrapper(endTime - 2);
        }
      };
    } else {
      return {
        label: `Start ${startDiff}`,
        callback: () => {
          const startTime = Math.min(Math.max(trimTime[0] + startDiff, 0), trimTime[1] + endDiff - minDistance);
          const endTime = Math.min(trimTime[1] + endDiff, duration);
          setTrimTime([startTime, endTime]);
          playVideoWrapper(startTime);
        }
      };
    }
  }

  const buttonData = [
    createButtonData(-0.5, 0),
    createButtonData(-0.05, 0),
    {
      label: <><MovieIcon/></>,
      callback: () => {
        if (!videoRef.current) {
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context2D = canvas.getContext('2d');
        if (!context2D) {
          return;
        }
        context2D.drawImage(videoRef.current as HTMLVideoElement, 0, 0, canvas.width, canvas.height);
        const downloadLink = document.createElement('a');
        downloadLink.appendChild(canvas);
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = 'thumbnail.png';
        document.getElementById('root')?.appendChild(downloadLink);
      }
    },
    {
      label: <><MovieIcon/></>,
      callback: () => {
        if (!videoRef.current) {
          return;
        }

        const clipCanvas = document.getElementById('clipCanvas') as HTMLCanvasElement;
        if (clipCanvas) {
          const preview = new Preview(videoRef.current, clipCanvas);
          preview.crops.push({
            source: {x: 0, y: 0, width: 640, height: 640},
            draw: {x: 0, y: 0, width: 640, height: 640}
          });
          preview.crops.push({
            source: {x: 640, y: 500, width: 640, height: 500},
            draw: {x: 320, y: 320, width: 320, height: 320}
          });
          setInterval(() => {
            preview.onUpdate();
          }, 1000 / 60);
        }
        const videoCanvas = document.getElementById('videoCanvas') as HTMLCanvasElement;
        if (videoCanvas) {
          videoCanvas.width = videoRef.current.videoWidth;
          videoCanvas.height = videoRef.current.videoHeight;
          const context2D = videoCanvas.getContext('2d');
          if (context2D) {
            context2D.strokeStyle = 'black';
            context2D.strokeRect(200, 800, 100, 100);
            context2D.strokeRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
          }
        }
      }
    },
    createButtonData(0.05, 0),
    createButtonData(0.5, 0),
    createButtonData(0, -0.5),
    createButtonData(0, -0.05),
    createButtonData(0, 0.05),
    createButtonData(0, 0.5),
  ];

  const buttons = <ButtonGroup>
    {
      buttonData.map((data, index) => {
        return <Button
          key={index}
          onClick={data.callback}>
          {data.label}
        </Button>;
      })
    }
  </ButtonGroup>;

  const slider = (0 < duration) ?
    (
      <>
        <div>
          {videoRef.current?.videoWidth} x {videoRef.current?.videoHeight}
        </div>
        <VideoProgressBar
          currentTime={currentProgressTime}
          minTime={trimTime[0]}
          maxTime={trimTime[1]}
          changeCallback={(time) => {
            if (videoRef.current) {
              videoRef.current.currentTime = time;
            }
          }}
        />
        <VideoClipSlider
          startTime={trimTime[0]}
          endTime={trimTime[1]}
          duration={duration}
          changeCallback={(newStartTime, newEndTime) => {
            const startTime = Math.min(Math.max(newStartTime, 0), newEndTime - minDistance);
            const endTime = Math.min(newEndTime, duration);
            setTrimTime([startTime, endTime]);
            playVideoWrapper(startTime);
          }}
        />
        <VideoStartPositionSlider
          startTime={trimTime[0]}
          duration={duration}
          changeCallback={(newStartTime) => {
            const startTime = Math.min(Math.max(newStartTime, 0), duration - 10);
            const endTime = Math.min(startTime + 10, duration);
            setTrimTime([startTime, endTime]);
            playVideoWrapper(startTime);
          }}
        />
        {buttons}
        <div>
          {convertMilliSecondsTimeToText(trimTime[0])} - {convertMilliSecondsTimeToText(trimTime[1])} ({convertMilliSecondsTimeToText(trimTime[1] - trimTime[0])})
        </div>
        <VideoCutEditor
          sourcePath={sourceRef.current?.value || 'source.mp4'}
          startTime={trimTime[0]}
          endTime={trimTime[1]}
        />
      </>
    ) : <></>;

  return (
    <>
      <MovieFileSelector
        source={source}
        setSource={setSource}
        setDuration={setDuration}
        sourceRef={sourceRef}
      />
      <hr/>
      <div
        style={{
          position: 'relative',
        }}
      >
        <video id={'target'}
          src={source}
          ref={videoRef} controls
        />
        <canvas id={'videoCanvas'}/>
      </div>
      <canvas
        id={'clipCanvas'}
      />
      {slider}
    </>
  );
}

/**
 * 動画を再生する
 * @param video
 * @param startTime
 */
function playVideo(video: HTMLVideoElement, startTime : number) {
  video.currentTime = startTime;
  video.play();
}

/**
 * 動画の再生位置が終了位置を超えた場合、開始位置に戻して再生する
 * @param video
 * @param startTime
 * @param endTime
 */
function replayVideo(video: HTMLVideoElement, startTime : number, endTime : number) {
  if (endTime <= video.currentTime) {
    video.currentTime = startTime;
    video.play();
  }
}



export default App;
