import Slider from '@mui/material/Slider';
import {convertTimeToShortText, convertTimeToText} from '../lib/FormatTime.tsx';

const startTimeSpace = 5;
const endTimeSpace = 20;

interface Mark {
  value: number;
  label: string;
}

function calculateTrimMarks(startTime: number, endTime: number): Mark[] {
  const duration = endTime - startTime;
  const durationMarksMapping = [
    { duration: 30, step: 5 },
    { duration: 60, step: 10 },
    { duration: 60 * 5, step: 30 },
    { duration: 60 * 10, step: 60 },
    { duration: 60 * 30, step: 60 * 5 },
    { duration: 60 * 60, step: 60 * 10 },
    { duration: 60 * 60 * 3, step: 60 * 30 },
  ];
  const marks: Mark[] = [];
  const step = durationMarksMapping.find((mapping) => { return duration < mapping.duration; })?.step || (60 * 60);
  for (let time = startTime; time < (endTime + endTimeSpace); time += step) {
    const markTime = time - startTime;
    marks.push({value: time, label: convertTimeToShortText(markTime)});
  }
  return marks;
}

/**
 * 動画のトリミング範囲を指定するスライダー
 */
function VideoClipSlider(props: { startTime: number, endTime: number, duration: number, changeCallback: (newStartTime: number, newEndTime: number, isStart: boolean) => void}) {
  const {startTime, endTime, duration, changeCallback} = props;
  const step = 1/60;

  const handleChange = (
    _: Event,
    newValue: number | number[],
    activeThumb: number,
  ) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    const first = newValue[0] as number;
    const second = newValue[1] as number;
    const isStart = activeThumb === 0;
    if (first < second) {
      changeCallback(first, second, isStart);
    } else {
      changeCallback(second, first, isStart);
    }
  };

  return (
    <Slider
      value={[startTime, endTime]}
      onChange={handleChange}
      step={step}
      marks={calculateTrimMarks(startTime, endTime)}
      min={Math.max(startTime - startTimeSpace, 0)}
      max={Math.min(endTime + endTimeSpace, duration)}
      valueLabelDisplay="on"
      valueLabelFormat={convertTimeToText}
      style={{marginTop: '30px'}}
    />
  );
}

export default VideoClipSlider;
