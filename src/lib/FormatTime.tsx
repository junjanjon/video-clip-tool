/**
 * 時間をテキストに変換する関数群
 */

// 0詰めテキストにする
function formatText(num: number, length: number) {
  return num.toString().padStart(length, '0');
}

/**
 * 時間をテキストに変換する
 * H:MM:SS 形式（H が 0 のとき MM:SS 形式）
 * @param time
 */
function convertTimeToShortText(time: number) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time - hours * 3600) / 60);
  const seconds = Math.floor(time - hours * 3600 - minutes * 60);
  if (0 < hours) {
    return `${hours}:${formatText(minutes, 2)}:${formatText(seconds, 2)}`;
  } else {
    return `${minutes}:${formatText(seconds, 2)}`;
  }
}

/**
 * 時間をテキストに変換する
 * H:MM:SS 形式
 * @param time
 */
function convertTimeToText(time: number) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time - hours * 3600) / 60);
  const seconds = Math.floor(time - hours * 3600 - minutes * 60);
  return `${hours}:${formatText(minutes,2)}:${formatText(seconds,2)}`;
}

/**
 * ミリ秒時間をテキストに変換する
 * H:MM:SS.SSS 形式
 * @param time
 */
function convertMilliSecondsTimeToText(time: number) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time - hours * 3600) / 60);
  const seconds = Math.floor(time - hours * 3600 - minutes * 60);
  const milliseconds = Math.floor((time - hours * 3600 - minutes * 60 - seconds) * 1000);
  return `${hours}:${formatText(minutes,2)}:${formatText(seconds,2)}.${formatText(milliseconds,3)}`;
}

export { convertTimeToText, convertTimeToShortText, convertMilliSecondsTimeToText };
