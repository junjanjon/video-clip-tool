import {convertMilliSecondsTimeToText} from './FormatTime.tsx';

const outputTargetDirPath = import.meta.env.VITE_OUTPUT_DIR_PATH || 'outputs';

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

export {convertTimeToCutCommand};
