import {convertMilliSecondsTimeToText} from './FormatTime.tsx';

const outputTargetDirPath = import.meta.env.VITE_OUTPUT_DIR_PATH || 'outputs';
const sourceDirPath = import.meta.env.VITE_SOURCE_DIR_PATH || '.';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Crop {
  source: Rect;
  draw: Rect;
}

export interface Preview {
  size: {
    width: number
    height: number
  };
  crops: Crop[];
}

function convertTimeToCutCommand(path: string, startTime: number, endTime: number,
  title: string, name: string, ruby: string, category: string, clipUrl: string,
  memo: string, preview: Preview) {
  const start = convertMilliSecondsTimeToText(startTime);
  // const end = convertMilliSecondsTimeToText(endTime);
  const durationSeconds = (endTime - startTime);
  const duration = convertMilliSecondsTimeToText(durationSeconds);
  // path からファイル名を取得
  const movieFileName = path.split('/').pop() || 'movie-name.mp4';
  const movieName = movieFileName?.split('.').shift() || 'movie-name';
  const sourcePath = `${sourceDirPath}/${movieFileName}`;
  const outputDirPath = `${outputTargetDirPath}/${movieName}`;
  const outputPath = `${outputDirPath}/${title}.mp4`;
  const memoText = [
    `# name: ${name}`,
    `# ruby: ${ruby}`,
    `# category: ${category}`,
    `# clipUrl: ${clipUrl}`,
    memo.split('\n').map((line) => `# ${line}`).join('\n')
  ].join('\n');
  const outputWavPath = `${outputDirPath}/${title}.wav`;

  const outputBlankPath = `${outputDirPath}/base.mp4`;
  const createBlankCommand = `ffmpeg -y -f lavfi -i 'color=c=black:s=${preview.size.width}x${preview.size.height}:r=30000/1001:d=${durationSeconds}' -f lavfi -i 'aevalsrc=0|0:c=stereo:s=44100:d=${durationSeconds}' ${outputBlankPath}`;

  const sourceCropCommands = preview.crops.map((crop, index) => {
    const cropFilter = `-vf crop=${crop.source.width}:${crop.source.height}:${crop.source.x}:${crop.source.y}`;
    const outputCropPath = `${outputDirPath}/${title}-crop-${index}.mp4`;
    return [
      `ffmpeg -y -i ${outputPath} ${cropFilter} ${outputCropPath}`
    ].join('\n');
  });

  const mergeCommands = preview.crops.map((crop, index) => {
    const cropPath = `${outputDirPath}/${title}-crop-${index}.mp4`;
    const scalePath = `${outputDirPath}/${title}-scale-${index}.mp4`;
    const mergeFilter = `-i ${scalePath} -filter_complex "overlay=x=${crop.draw.x}:y=${crop.draw.y}"`;
    const basePath = index === 0 ? outputBlankPath : `${outputDirPath}/${title}-merge-${index - 1}.mp4`;
    const outputMergePath = `${outputDirPath}/${title}-merge-${index}.mp4`;
    const outputCompletePath = `${outputDirPath}/${title}-complete.mp4`;
    return [
      `ffmpeg -y -i ${cropPath} -vf scale=${crop.draw.width}x${crop.draw.height} ${scalePath}`,
      `ffmpeg -y -i ${basePath} ${mergeFilter} ${outputMergePath}`,
      (index === preview.crops.length - 1) ? `cp ${outputMergePath} ${outputCompletePath}` : '',
    ].join('\n');
  });

  const dataPath = `./${movieName}.yml`;
  const createDataCommand = [
    `touch ${dataPath}`,
    `cat <<EOF >> ${dataPath}`,
    `- name: "${name}"`,
    `  ruby: "${ruby}"`,
    `  source: "${movieName}"`,
    `  fileName: "${movieName}/${title}.mp3"`,
    `  category: [${category.split(',').map((c) => `"${c}"`)}]`,
    `  clipUrl: "${clipUrl}"`,
    'EOF',
  ].join('\n');

  return [
    `# ${title}`,
    `mkdir -p ${outputDirPath}`,
    // `ffmpeg -y -ss ${start} -i ${path} -to ${end} ${outputPath}`,
    `ffmpeg -y -ss ${start} -i ${sourcePath} -t ${duration} ${outputPath}`,
    `ffmpeg -y -i ${outputPath} -vn ${outputWavPath}`,
    createBlankCommand,
    sourceCropCommands.join('\n'),
    mergeCommands.join('\n'),
    memoText,
    createDataCommand,
    '\n'
  ].join('\n');
}

export {convertTimeToCutCommand};
