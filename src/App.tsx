import './App.css';
import {Button, ButtonGroup} from '@mui/material';
import {useState, useEffect, useRef} from 'react';
import {PlayArrow, Pause, Replay, Movie} from '@mui/icons-material';
import MovieFileSelector from './components/MovieFileSelector.tsx';
import VideoProgressBar from './components/VideoProgressBar.tsx';
import VideoStartPositionSlider from './components/VideoStartPositionSlider.tsx';
import VideoClipSlider from './components/VideoClipSlider.tsx';
import {convertMilliSecondsTimeToText} from './lib/FormatTime.tsx';
import VideoCutEditor from './components/VideoCutEditor.tsx';
import WaveSurfer from 'wavesurfer.js';

const minDistance = 0.5;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentProgressTime, setCurrentProgressTime] = useState<number>(0);
  const [trimTime, setTrimTime] = useState<number[]>([0, 60]);
  const [duration, setDuration] = useState<number>(-1);
  const [source, setSource] = useState<string>('./movies/test.mp4');
  const [sourcePath, setSourcePath] = useState<string>('./movies/test.mp4');
  const [waveSurfer, setWaveSurfer] = useState<WaveSurfer>();

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
          // 古いWaveSurferを削除
          if (waveSurfer) {
            waveSurfer.destroy();
          }
          const ws = WaveSurfer.create({
            container: '#waveSurfer',
            waveColor: 'violet',
            progressColor: 'purple',
            cursorColor: 'navy',
            height: 100,
            media: video,
            dragToSeek: true,
            autoCenter: false,
          });
          ws.on('click', () => {
            ws.pause();
          });
          setWaveSurfer(() => ws);
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

  function setTrimTimeWrapper([startTime, endTime] : [number, number]) {
    setTrimTime([startTime, endTime]);
    const zoomLevel = Math.max(10, Math.min(1000, 1000 / (endTime - startTime)));
    waveSurfer?.zoom(zoomLevel);
  }

  function createButtonData(startDiff: number, endDiff : number) {
    if (startDiff === 0) {
      return {
        label: `End ${endDiff}`,
        callback: () => {
          const startTime = Math.min(Math.max(trimTime[0] + startDiff, 0), trimTime[1] + endDiff - minDistance);
          const endTime = Math.min(trimTime[1] + endDiff, duration);
          setTrimTimeWrapper([startTime, endTime]);
          const videoStartTime = Math.max(endTime - 2, startTime);
          playVideoWrapper(videoStartTime);
        }
      };
    } else {
      return {
        label: `Start ${startDiff}`,
        callback: () => {
          const startTime = Math.min(Math.max(trimTime[0] + startDiff, 0), trimTime[1] + endDiff - minDistance);
          const endTime = Math.min(trimTime[1] + endDiff, duration);
          setTrimTimeWrapper([startTime, endTime]);
          playVideoWrapper(startTime);
        }
      };
    }
  }

  const waveSurferButtonData = [
    {
      label: <><Replay/></>,
      callback: () => {
        if (videoRef.current) {
          playVideoWrapper(trimTime[0]);
        }
      }
    },
    {
      label: <>
        {videoRef.current?.paused ? <PlayArrow/> : <Pause/>}
      </>,
      callback: () => {
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      }
    },
    {
      label: <><span>Set Start From Now</span></>,
      callback: () => {
        if (videoRef.current) {
          const startTime = videoRef.current.currentTime;
          const endTime = trimTime[1];
          setTrimTimeWrapper([startTime, endTime]);
        }
      }
    },
    {
      label: <><span>Set End From Now</span></>,
      callback: () => {
        if (videoRef.current) {
          const startTime = trimTime[0];
          const endTime = videoRef.current.currentTime;
          setTrimTimeWrapper([startTime, endTime]);
        }
      }
    },
    {
      label: <><span>Normalize</span></>,
      callback: () => {
        if (waveSurfer) {
          const options = waveSurfer.options;
          options.normalize = !options.normalize;
          waveSurfer.setOptions(options);
        }
      }
    }
  ];

  const buttonData = [
    createButtonData(-0.5, 0),
    createButtonData(-0.05, 0),
    {
      label: <><Movie/></>,
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
        const name = sourcePath.replace(/.+\//, '').replace(/\..+/, '');
        downloadLink.download = `thumbnail-${name}-${Date.now()}.png`;
        document.getElementById('root')?.appendChild(downloadLink);
        downloadLink.click();
      }
    },
    createButtonData(0.05, 0),
    createButtonData(0.5, 0),
    createButtonData(0, -0.5),
    createButtonData(0, -0.05),
    createButtonData(0, 0.05),
    createButtonData(0, 0.5),
    createButtonData(-10000, 0),
    createButtonData(0, 10000),
  ];

  const waveSurferButtons = <ButtonGroup>
    {
      waveSurferButtonData.map((data, index) => {
        return <Button
          key={index}
          onClick={data.callback}>
          {data.label}
        </Button>;
      })
    }
  </ButtonGroup>;

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
          changeCallback={(newStartTime, newEndTime, isStart) => {
            const startTime = Math.min(Math.max(newStartTime, 0), newEndTime - minDistance);
            const endTime = Math.min(newEndTime, duration);
            setTrimTimeWrapper([startTime, endTime]);
            if (isStart) {
              playVideoWrapper(startTime);
            } else {
              playVideoWrapper(endTime - 2);
            }
          }}
        />
        <VideoStartPositionSlider
          startTime={trimTime[0]}
          duration={duration}
          changeCallback={(newStartTime) => {
            const startTime = Math.min(Math.max(newStartTime, 0), duration - 10);
            const endTime = Math.min(startTime + 10, duration);
            setTrimTimeWrapper([startTime, endTime]);
            playVideoWrapper(startTime);
          }}
        />
        {buttons}
        <div>
          {convertMilliSecondsTimeToText(trimTime[0])} - {convertMilliSecondsTimeToText(trimTime[1])} ({convertMilliSecondsTimeToText(trimTime[1] - trimTime[0])})
        </div>
        <VideoCutEditor
          sourcePath={sourcePath}
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
        setSourcePath={setSourcePath}
        setDuration={setDuration}
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
      <div>
        {videoRef.current?.videoWidth} x {videoRef.current?.videoHeight}
      </div>
      <div id={'waveSurfer'}/>
      {waveSurferButtons}
      {slider}
      <hr/>
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
