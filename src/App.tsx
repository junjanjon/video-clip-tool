import './App.css'
import {Alert, Button, ButtonGroup, Slider, TextField} from "@mui/material";
import {useState, useEffect, useRef, ReactElement} from "react";
import MovieIcon from '@mui/icons-material/Movie';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const minDistance = 2;
  const step = 1 / 60;
  const [trimTime, setTrimTime] = useState<number[]>([0, 60]);
  const [duration, setDuration] = useState<number>(-1);
  const [source, setSource] = useState<string>("./public/movies/test.mp4");
  const [copiedAlert, setCopiedAlert] = useState<ReactElement>(<> </>);
  const sourceRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
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
        if (!Number.isNaN(videoRef.current.duration)) {
          replayVideo(videoRef.current, trimTime[0], trimTime[1]);
        }
      }
    }, 1);
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

  const buttonData = [
    {label: "Start -1.00", value: -1.00},
    {label: "Start -0.05", value: -0.05},
    {label: "Reset", value: 0},
  ];

  const buttons = <ButtonGroup>
    {
      buttonData.map((data, index) => {
        return <Button
          key={index}
          onClick={
            () => {
              setTrimTime([trimTime[0] + data.value, trimTime[1] + data.value])
              if (videoRef.current) {
                playVideo(videoRef.current, trimTime[0] + data.value);
              }
            }
          }
          >
          {data.label}
        </Button>
      })
    }
  </ButtonGroup>

  const slider = (0 < duration) ?
    (
      <>
        <Slider
          value={trimTime[0]}
          onChange={handleChangeRange}
          step={step}
          min={0}
          max={duration}
          valueLabelDisplay="auto"
          disableSwap
        />
        <Slider
          getAriaLabel={() => 'Minimum distance'}
          value={trimTime}
          onChange={handleChange1}
          step={step}
          min={trimTime[0] - 5}
          max={trimTime[1] + 20}
          valueLabelDisplay="auto"
          disableSwap
        />
        {buttons}
        <div style={{color: "black"}}>
          {convertTimeToText(trimTime[0])} - {convertTimeToText(trimTime[1])} ({convertTimeToText(trimTime[1] - trimTime[0])})
        </div>
        {copiedAlert}
        <TextField
          inputRef={titleRef}
          fullWidth={true}
        >
        </TextField>
        <textarea
          value={convertTimeToCutCommand(sourceRef.current?.value || 'input', trimTime[0], trimTime[1], titleRef.current?.value || 'output')}
          onClick={() => {
            const command = convertTimeToCutCommand(sourceRef.current?.value || 'input', trimTime[0], trimTime[1], titleRef.current?.value || 'output');
            navigator.clipboard.writeText(command);
            setCopiedAlert(<Alert severity="success">{`Copied to clipboard. Last Copied: ${command}`}</Alert>);
          }}>
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
      defaultValue={"./public/movies/test.mp4"}
      >
    </TextField>
    <Button
    onClick={() => {
      if (sourceRef.current) {
        setSource(sourceRef.current.value);
      }
    }}>test</Button>
  </>;

  return (
    <>
      {selectMovieFile}
      <video id={"target"}
             src={source}
             ref={videoRef} controls />
      {slider}
    </>
  )
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

function convertTimeToText(time: number) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time - hours * 3600) / 60);
  const seconds = Math.floor(time - hours * 3600 - minutes * 60);
  const milliseconds = Math.floor((time - hours * 3600 - minutes * 60 - seconds) * 1000);
  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

function convertTimeToCutCommand(path: string, startTime: number, endTime: number, title: string) {
  const start = convertTimeToText(startTime);
  const end = convertTimeToText(endTime);
  // path からファイル名を取得
  const movieName = path.split('/').pop()?.split('.').shift() || 'movie-name';
  const outputDirPath = `outputs/${movieName}`;
  const outputPath = `outputs/${movieName}/${title}.mp4`;
  return `mkdir -p ${outputDirPath}\nffmpeg -y -i ${path} -ss ${start} -to ${end} ${outputPath}`;
}

export default App
