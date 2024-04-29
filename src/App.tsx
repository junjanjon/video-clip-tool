import './App.css';
import {Alert, Button, ButtonGroup, Slider, TextField} from '@mui/material';
import {useState, useEffect, useRef, ReactElement} from 'react';
import MovieIcon from '@mui/icons-material/Movie';

const outputTargetDirPath = import.meta.env.VITE_OUTPUT_DIR_PATH || 'outputs';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentProgressTime, setCurrentProgressTime] = useState<number>(0);
  const minDistance = 0.5;
  const step = 1 / 60;
  const [trimTime, setTrimTime] = useState<number[]>([0, 60]);
  const [duration, setDuration] = useState<number>(-1);
  const [source, setSource] = useState<string>('./public/movies/test.mp4');
  const [copiedAlert, setCopiedAlert] = useState<ReactElement>(<> </>);
  const sourceRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        const video = videoRef.current;
        if (!Number.isNaN(video.duration)) {
          replayVideo(video, trimTime[0], trimTime[1]);
          setCurrentProgressTime(() => video.currentTime);
        }
      }
    }, 1 / 60);
    return () => clearInterval(interval);
  }, [trimTime]);

  const handleChangeRange = (
    _: Event,
    newValue: number | number[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    __: number,
  ) => {
    if (Array.isArray(newValue)) {
      return;
    }

    setTrimTime([Math.min(Math.max(newValue, 0), duration - 10), Math.min(newValue + 10, duration)]);
    if (videoRef.current) {
      playVideo(videoRef.current, trimTime[0]);
    }
  };

  const handleChange1 = (
    _: Event,
    newValue: number | number[],
    activeThumb: number,
  ) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    if (activeThumb === 0) {
      setTrimTime([Math.max(Math.min(newValue[0], trimTime[1] - minDistance), 0), trimTime[1]]);
      if (videoRef.current) {
        playVideo(videoRef.current, trimTime[0]);
      }
    } else {
      const lastTime = Math.max(newValue[1], trimTime[0] + minDistance);
      setTrimTime([trimTime[0], lastTime]);
      if (videoRef.current) {
        playVideo(videoRef.current, lastTime - minDistance);
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
        <Slider
          // 今の再生位置を表示するスライダー
          value={currentProgressTime}
          min={trimTime[0]}
          max={trimTime[1]}
          valueLabelDisplay="on"
          valueLabelFormat={convertTimeToText}
          disabled
          style={{marginTop: '30px'}}
        />
        <Slider
          // 全動画時間の中での位置を指定するスライダー
          value={trimTime[0]}
          onChange={handleChangeRange}
          step={step}
          min={0}
          max={duration}
          valueLabelDisplay="on"
          valueLabelFormat={convertTimeToText}
          disableSwap
          style={{marginTop: '30px'}}
        />
        <Slider
          // クリッピングする部分を指定するスライダー
          getAriaLabel={() => 'Minimum distance'}
          value={trimTime}
          onChange={handleChange1}
          step={step}
          min={trimTime[0] - 5}
          max={trimTime[1] + 20}
          valueLabelDisplay="on"
          valueLabelFormat={convertTimeToText}
          style={{marginTop: '30px'}}
          disableSwap
        />
        {buttons}
        <div>
          {convertTimeToText(trimTime[0])} - {convertTimeToText(trimTime[1])} ({convertTimeToText(trimTime[1] - trimTime[0])})
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

  const selectMovieFile = <>
    <TextField
      inputRef={sourceRef}
      fullWidth={true}
      InputProps={{
        startAdornment: (<MovieIcon/>),
      }}
      defaultValue={source}
    >
    </TextField>
    <Button
      onClick={() => {
        if (sourceRef.current) {
          setSource(sourceRef.current.value);
          setDuration(-1);
        }
      }}>test</Button>
  </>;

  return (
    <>
      {selectMovieFile}
      <video id={'target'}
        src={source}
        ref={videoRef} controls />
      {slider}
    </>
  );
}

function playVideo(video: HTMLVideoElement, startTime : number) {
  video.currentTime = startTime;
  video.play();
}

function replayVideo(video: HTMLVideoElement, startTime : number, endTime : number) {
  if (endTime < video.currentTime) {
    video.currentTime = startTime;
    video.play();
  }
}

// 0詰めテキストにする
function formatText(num: number, length: number) {
  return num.toString().padStart(length, '0');
}

function convertTimeToText(time: number) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time - hours * 3600) / 60);
  const seconds = Math.floor(time - hours * 3600 - minutes * 60);
  const milliseconds = Math.floor((time - hours * 3600 - minutes * 60 - seconds) * 1000);
  return `${hours}:${formatText(minutes,2)}:${formatText(seconds,2)}.${formatText(milliseconds,3)}`;
}

function convertTimeToCutCommand(path: string, startTime: number, endTime: number, title: string, memo: string) {
  const start = convertTimeToText(startTime);
  // const end = convertTimeToText(endTime);
  const duration = convertTimeToText(endTime - startTime);
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
