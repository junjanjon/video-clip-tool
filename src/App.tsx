import './App.css';
import {Alert, Button, ButtonGroup, Slider, TextField} from '@mui/material';
import {useState, useEffect, useRef, ReactElement} from 'react';
import MovieIcon from '@mui/icons-material/Movie';
import MovieFileSelector from './components/MovieFileSelector.tsx';
import VideoProgressBar from './components/VideoProgressBar.tsx';
import {convertTimeToText, convertTimeToShortText, convertMilliSecondsTimeToText} from './lib/FormatTime.tsx';

const outputTargetDirPath = import.meta.env.VITE_OUTPUT_DIR_PATH || 'outputs';
const startTimeSpace = 5;
const endTimeSpace = 20;
const minDistance = 0.5;

interface Mark {
  value: number;
  label: string;
}

/**
 * 指定された動画の時間に合わせてマークを計算する
 * @param duration
 */
function calculateMarks(duration: number): Mark[] {
  const durationMarksMapping = [
    { duration: 60, step: 10 },
    { duration: 60 * 5, step: 60 },
    { duration: 60 * 10, step: 60 * 2 },
    { duration: 60 * 30, step: 60 * 5 },
    { duration: 60 * 60, step: 60 * 10 },
    { duration: 60 * 60 * 3, step: 60 * 30 },
  ];
  const marks: Mark[] = [];
  const step = durationMarksMapping.find((mapping) => { return duration < mapping.duration; })?.step || (60 * 60);
  for (let i = 0; i < duration; i += step) {
    marks.push({value: i, label: convertTimeToText(i)});
  }
  return marks;
}

function calculateTrimMarks(startTime: number, endTime: number): Mark[] {
  const duration = endTime - startTime;
  const durationMarksMapping = [
    { duration: 30, step: 5 },
    { duration: 60, step: 10 },
    { duration: 60 * 5, step: 30 },
  ];
  const marks: Mark[] = [];
  const step = durationMarksMapping.find((mapping) => { return duration < mapping.duration; })?.step || (60);
  for (let time = startTime; time < (endTime + endTimeSpace); time += step) {
    const markTime = time - startTime;
    marks.push({value: time, label: convertTimeToShortText(markTime)});
  }
  return marks;
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentProgressTime, setCurrentProgressTime] = useState<number>(0);
  const step = 1 / 60;
  const [trimTime, setTrimTime] = useState<number[]>([0, 60]);
  const [duration, setDuration] = useState<number>(-1);
  const [source, setSource] = useState<string>('./movies/test.mp4');
  const [copiedAlert, setCopiedAlert] = useState<ReactElement>(<> </>);
  const sourceRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLInputElement>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [trimMarks, setTrimMarks] = useState<Mark[]>([]);

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
          setMarks(() => calculateMarks(video.duration));
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

  /**
   * トリミング時間開始位置スライダーの値が変更されたときのコールバック
   * @param _
   * @param newValue
   * @param __
   */
  const handleChangeRange = (
    _: Event,
    newValue: number | number[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    __: number,
  ) => {
    if (Array.isArray(newValue)) {
      return;
    }

    const startTime = Math.min(Math.max(newValue, 0), duration - 10);
    const endTime = Math.min(startTime + 10, duration);
    setTrimTime([startTime, endTime]);
    setTrimMarks(() => calculateTrimMarks(startTime, endTime));
    playVideoWrapper(startTime);
  };

  /**
   * トリミング時間範囲スライダーの値が変更されたときのコールバック
   * @param _
   * @param newValue
   * @param activeThumb
   */
  const handleChange1 = (
    _: Event,
    newValue: number | number[],
    activeThumb: number,
  ) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    if (activeThumb === 0) {
      if (videoRef.current) {
        const startTime = Math.max(Math.min(newValue[0], trimTime[1] - minDistance), 0);
        setTrimTime([startTime, trimTime[1]]);
        setTrimMarks(() => calculateTrimMarks(startTime, trimTime[1]));
        playVideo(videoRef.current, trimTime[0]);
      }
    } else {
      if (videoRef.current) {
        const endTime = Math.min(Math.max(newValue[1], trimTime[0] + minDistance), videoRef.current.duration);
        setTrimTime([trimTime[0], endTime]);
        setTrimMarks(() => calculateTrimMarks(trimTime[0], endTime));
        playVideo(videoRef.current, endTime - minDistance);
      }
    }
  };

  function playVideoWrapper(time: number) {
    if (videoRef.current) {
      playVideo(videoRef.current, time);
    }
  }

  const buttonData = [
    {
      label: 'Start -0.5',
      callback: () => {
        setTrimTime([trimTime[0] - 0.5, trimTime[1]]);
        playVideoWrapper(trimTime[0] - 0.5);
      }
    },
    {
      label: 'Start -0.05',
      callback: () => {
        setTrimTime([trimTime[0] - 0.05, trimTime[1]]);
        playVideoWrapper(trimTime[0] - 0.05);
      }
    },
    {
      label: <><MovieIcon/></>,
      callback: () => {
        playVideoWrapper(trimTime[0]);
      }
    },
    {
      label: 'Start +0.05',
      callback: () => {
        setTrimTime([trimTime[0] + 0.05, trimTime[1]]);
        playVideoWrapper(trimTime[0] + 0.05);
      }
    },
    {
      label: 'Start +0.5',
      callback: () => {
        setTrimTime([trimTime[0] + 0.5, trimTime[1]]);
        playVideoWrapper(trimTime[0] + 0.5);
      }
    },
    {
      label: 'End -0.5',
      callback: () => {
        setTrimTime([trimTime[0], trimTime[1] - 0.5]);
        playVideoWrapper(Math.max(trimTime[0], trimTime[1] - 0.5 - minDistance));
      }
    },
    {
      label: 'End -0.05',
      callback: () => {
        setTrimTime([trimTime[0], trimTime[1] - 0.05]);
        playVideoWrapper(Math.max(trimTime[0], trimTime[1] - 0.05 - minDistance));
      }
    },
    {
      label: 'End +0.05',
      callback: () => {
        setTrimTime([trimTime[0], trimTime[1] + 0.05]);
        playVideoWrapper(Math.max(trimTime[0], trimTime[1] + 0.05 - minDistance));
      }
    },
    {
      label: 'End +0.5',
      callback: () => {
        setTrimTime([trimTime[0], trimTime[1] + 0.5]);
        playVideoWrapper(Math.max(trimTime[0], trimTime[1] + 0.5 - minDistance));
      }
    }
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
          changeCallback={playVideoWrapper}
        />
        <Slider
          // クリッピングする部分を指定するスライダー
          getAriaLabel={() => 'Minimum distance'}
          value={trimTime}
          onChange={handleChange1}
          step={step}
          min={Math.max(trimTime[0] - startTimeSpace, 0)}
          max={Math.min(trimTime[1] + endTimeSpace, duration)}
          marks={trimMarks}
          valueLabelDisplay="on"
          valueLabelFormat={convertTimeToText}
          style={{marginTop: '30px'}}
          disableSwap
        />
        <Slider
          // 全動画時間の中での位置を指定するスライダー
          value={trimTime[0]}
          onChange={handleChangeRange}
          step={step}
          min={0}
          max={duration}
          marks={marks}
          disableSwap
        />
        {buttons}
        <div>
          {convertMilliSecondsTimeToText(trimTime[0])} - {convertMilliSecondsTimeToText(trimTime[1])} ({convertMilliSecondsTimeToText(trimTime[1] - trimTime[0])})
        </div>
        {copiedAlert}
        <TextField
          inputRef={titleRef}
          fullWidth={true}
        />
        <TextField
          inputRef={memoRef}
          multiline={true}
          minRows={5}
          fullWidth={true}
        />
        <textarea
          value={convertTimeToCutCommand(sourceRef.current?.value || 'input', trimTime[0], trimTime[1], titleRef.current?.value || 'output', memoRef.current?.value || '')}
          style={{width: '100%', height: '100px'}}
          onClick={() => {
            const command = convertTimeToCutCommand(sourceRef.current?.value || 'input', trimTime[0], trimTime[1], titleRef.current?.value || 'output', memoRef.current?.value || '');
            navigator.clipboard.writeText(command);
            setCopiedAlert(<Alert severity="success">{`Copied to clipboard. Last Copied: ${command}`}</Alert>);
          }}
          readOnly={true}>
        </textarea>
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
      <video id={'target'}
        src={source}
        ref={videoRef} controls/>
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


function convertTimeToCutCommand(path: string, startTime: number, endTime: number, title: string, memo: string) {
  const start = convertMilliSecondsTimeToText(startTime);
  // const end = convertMilliSecondsTimeToText(endTime);
  const duration = convertMilliSecondsTimeToText(endTime - startTime);
  // path からファイル名を取得
  const movieName = path.split('/').pop()?.split('.').shift() || 'movie-name';
  const outputDirPath = `${outputTargetDirPath}/${movieName}`;
  const outputPath = `${outputDirPath}/${title}.mp4`;
  const memoText = memo.split('\n').map((line) => `# ${line}`).join('\n');
  const cropFilter = '-vf crop=640:640:640:80';
  const outputCropPath = `${outputDirPath}/${title}-crop.mp4`;
  // const gifFilter = '-filter_complex "[0:v] fps=10,scale=320:-1,split [a][b];[a] palettegen [p];[b][p] paletteuse=dither=none"';
  // const outputGifPath = `outputs/${movieName}/${title}.gif`;
  // const outputMp3Path = `outputs/${movieName}/${title}.mp3`;
  const outputWavPath = `${outputDirPath}/${title}.wav`;

  return [
    `# ${title}`,
    `mkdir -p ${outputDirPath}`,
    // `ffmpeg -y -ss ${start} -i ${path} -to ${end} ${outputPath}`,
    `ffmpeg -y -ss ${start} -i ${path} -t ${duration} ${outputPath}`,
    // `ffmpeg -y -i ${path} -ss ${start} -to ${end} ${outputPath}`,
    // NOTE: 1280x720 -> 640x640
    `ffmpeg -y -i ${outputPath} ${cropFilter} ${outputCropPath}`,
    // NOTE: 640x640 -> 320x320 gif
    // `ffmpeg -y -i ${outputCropPath} ${gifFilter} ${outputGifPath}`,
    // `ffmpeg -y -i ${outputPath} ${outputMp3Path}`,
    `ffmpeg -y -i ${outputPath} ${outputWavPath}`,
    memoText,
    '\n'
  ].join('\n');
}

export default App;
