import Slider from '@mui/material/Slider';
import { convertTimeToText } from '../lib/FormatTime.tsx';

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

/**
 * 全動画時間の中での位置を指定するスライダー
 */
function VideoStartPositionSlider(props: { startTime: number, duration: number, changeCallback: (newStartTime: number) => void}) {
  const {startTime, duration, changeCallback} = props;
  const step = 1/60;

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
    const newStartTime = newValue as number;
    changeCallback(newStartTime);
  };

  return (
    <Slider
      // 全動画時間の中での位置を指定するスライダー
      value={startTime}
      onChange={handleChangeRange}
      step={step}
      min={0}
      max={duration}
      marks={calculateMarks(duration)}
    />
  );
}

export default VideoStartPositionSlider;
