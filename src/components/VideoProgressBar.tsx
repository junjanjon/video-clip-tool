import Box from '@mui/material/Box';
import { convertTimeToText } from '../lib/FormatTime.tsx';

/**
 * クリッピング中の再生進捗表示
 */
function VideoProgressBar(props: { currentTime: number, minTime: number, maxTime: number, changeCallback: (time: number) => void}) {
  const percent = (props.currentTime - props.minTime) / (props.maxTime - props.minTime);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <input
          type={'range'}
          value={percent}
          onChange={(event) => {
            const value = event.target.value;
            const time = props.minTime + (props.maxTime - props.minTime) * parseFloat(value);
            props.changeCallback(time);
          }}
          min={0}
          max={1}
          step={0.001}
          style={{
            width: '100%',
          }} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <div>{convertTimeToText(props.currentTime)}</div>
      </Box>
    </Box>
  );
}

export default VideoProgressBar;
