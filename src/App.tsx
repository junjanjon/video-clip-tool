import './App.css'
import {Button, ButtonGroup, Slider, TextField} from "@mui/material";
import {useState, useEffect, useRef} from "react";
import MovieIcon from '@mui/icons-material/Movie';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const minDistance = 3;
  const step = 1 / 60;
  const [trimTime, setTrimTime] = useState<number[]>([0, 60]);
  const [duration, setDuration] = useState<number>(-1);
  const [source, setSource] = useState<string>("./../public/test.mp4");
  const sourceRef = useRef<HTMLInputElement>(null);
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

  const handleChange1 = (
    _: Event,
    newValue: number | number[],
    activeThumb: number,
  ) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    console.log("handleChange1: " + newValue + " - " + activeThumb);
    if (activeThumb === 0) {
      setTrimTime([Math.min(newValue[0], trimTime[1] - minDistance), trimTime[1]]);
      if (videoRef.current) {
        playVideo(videoRef.current, trimTime[0]);
      }
    } else {
      const lastTime = Math.max(newValue[1], trimTime[0] + minDistance);
      setTrimTime([trimTime[0], lastTime]);
      if (videoRef.current) {
        playVideo(videoRef.current, lastTime - 3);
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
          getAriaLabel={() => 'Minimum distance'}
          value={trimTime}
          onChange={handleChange1}
          step={step}
          min={0}
          max={duration}
          valueLabelDisplay="auto"
          disableSwap
        />
        {buttons}
        <div>
          {convertTimeToText(trimTime[0])} - {convertTimeToText(trimTime[1])}
        </div>
        <div>
          {convertTimeToCutCommand(trimTime[0], trimTime[1])}
        </div>
      </>
    ) : <></>;

  const selectMovieFile = <>
    <TextField
      inputRef={sourceRef}
      fullWidth={true}
      InputProps={{
        startAdornment: (<MovieIcon/>),
      }}
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

function convertTimeToCutCommand(startTime: number, endTime: number) {
  const start = convertTimeToText(startTime);
  const end = convertTimeToText(endTime);
  return "ffmpeg -ss " + start + " -i input.mp4 -to " + end + " -c:v copy -c:a copy output.mp4";
}

export default App
