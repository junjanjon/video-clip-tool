import {Alert, Button, Checkbox, FormControlLabel, Grid, TextField} from '@mui/material';
import {ReactElement, useEffect, useReducer, useState} from 'react';
import {convertTimeToCutCommand, Preview, Rect} from '../lib/CutCommand.tsx';

function categoryListReducer(state: string, action: {
    type: 'set' | 'edit',
    category: string
}): string {
  switch (action.type) {
  case 'edit':
  {
    return action.category;
  }
  case 'set':
  {
    // カテゴリの中にボタンのカテゴリが含まれていない場合は、追加する
    // カテゴリの中にボタンのカテゴリが含まれている場合は、削除する
    const categoryList = state.split(',').filter((value) => value !== '');
    if (categoryList.includes(action.category)) {
      return categoryList.filter((value) => value !== action.category).join(',');
    } else {
      categoryList.push(action.category);
      categoryList.sort();
      return categoryList.join(',');
    }
  }
  }
}

/**
 * 動画の切り出しコマンドを表示するエディタ
 * @param props
 */
function VideoCutEditor(props: {sourcePath: string, startTime: number, endTime: number}) {
  const {sourcePath, startTime, endTime} = props;
  const [copiedAlert, setCopiedAlert] = useState<ReactElement>(<> </>);
  const [videoId, setVideoId] = useState<string>('');
  const [title, setTitle] = useState<string>('title');
  const [name, setName] = useState<string>('name');
  const [ruby, setRuby] = useState<string>('ruby');
  const [category, updateCategoryList] = useReducer(categoryListReducer, 'emotions');
  const [clipUrl, setClipUrl] = useState<string>('');
  const [isAutoClipUrl, setIsAutoClipUrl] = useState<boolean>(true);
  const [memo, setMemo] = useState<string>('');
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [preview, setPreview] = useState<Preview>({
    size: {width: 1080, height: 1920},
    crops: []
  });
  const command = convertTimeToCutCommand(sourcePath, startTime, endTime,
    title, name, ruby, category, clipUrl,
    memo, preview);

  if (isAutoClipUrl) {
    const timeStamp = Math.floor(startTime).toString();
    const videoWithTimestamp = `https://www.youtube.com/watch?v=${videoId}&t=${timeStamp}`;
    if (clipUrl !== videoWithTimestamp) {
      setClipUrl(videoWithTimestamp);
    }
  }

  const reservedCategoryList = ['collab', 'comment', 'damage', 'emotions',
    'english', 'game', 'intonation', 'kawaii', 'lucky', 'maikka',
    'meigen', 'meme', 'miteruyo', 'outa', 'se', 'sensitive', 'sokuochi',
    'supacha', 'tira', 'waraigoe'];
  const reservedCategoryButtons = reservedCategoryList.map((tag) => {
    const isSelected = category.split(',').includes(tag);
    return <Button
      variant={isSelected ? 'contained' : 'outlined'}
      key={tag}
      onClick={() => {
        updateCategoryList({type: 'set', category: tag});
      }}
      style={{
        textTransform: 'none',
        margin: '5px'
      }}
    >{tag}</Button>;
  });

  return (
    <div>
      <div>
        <label htmlFor={'isPreview'}>isPreview</label>
        <input
          id={'isPreview'}
          type="checkbox"
          checked={isPreview}
          onChange={(event) => {
            setIsPreview(event.target.checked);
          }}
        />
        {isPreview ?
          <CropEditor
            preview={preview}
            setPreview={setPreview}
          /> : <></>}
      </div>
      <TextField
        label="YouTube Video ID"
        fullWidth={true}
        value={videoId}
        onChange={(event) => {setVideoId(event.target.value);}}
        style={{marginTop: '10px'}}/>
      <TextField
        label="File Name"
        fullWidth={true}
        value={title}
        onChange={(event) => {setTitle(event.target.value);}}
        style={{marginTop: '10px'}}
      />
      <TextField
        label="Name"
        fullWidth={true}
        value={name}
        onChange={(event) => {setName(event.target.value);}}
        style={{marginTop: '10px'}}
      />
      <TextField
        label="Ruby"
        fullWidth={true}
        value={ruby}
        onChange={(event) => {setRuby(event.target.value);}}
        style={{marginTop: '10px'}}
      />
      <TextField
        label="Category"
        fullWidth={true}
        value={category}
        onChange={(event) => {updateCategoryList({type: 'edit', category: event.target.value});}}
        style={{marginTop: '10px'}}
      />
      {reservedCategoryButtons}
      <TextField
        label="Clip URL"
        fullWidth={true}
        value={clipUrl}
        onChange={(event) => {setClipUrl(event.target.value);}}
        style={{marginTop: '10px'}}
      />
      <FormControlLabel
        label="Auto Clip URL"
        control={
          <Checkbox
            checked={isAutoClipUrl}
            onChange={(event) => {
              setIsAutoClipUrl(event.target.checked);
            }}/>
        }/>
      <TextField
        label="Memo"
        fullWidth={true}
        defaultValue={memo}
        onChange={(event) => {setMemo(event.target.value);}}
        style={{marginTop: '10px'}}
        multiline={true}
        minRows={5}
      />
      {copiedAlert}
      <textarea
        value={command}
        style={{width: '100%', height: '300px', marginTop: '10px'}}
        onClick={() => {
          navigator.clipboard.writeText(command).then(() => {
            setCopiedAlert(<Alert severity="success">{`Copied to clipboard. Now: ${new Date()}`}</Alert>);
          });
        }}
        readOnly={true}
      />
    </div>
  );
}

/**
 * 動画のクロップ範囲を表示する
 * @param rects
 */
function canvasOnVideoUpdate(rects: Rect[]){
  const videoRef = document.getElementById('target') as HTMLVideoElement;
  if (!videoRef) {
    return;
  }
  const videoCanvas = document.getElementById('videoCanvas') as HTMLCanvasElement;
  if (!videoCanvas) {
    return;
  }
  const context2D = videoCanvas.getContext('2d');
  if (!context2D) {
    return;
  }
  const videoSize = {
    width: videoRef.videoWidth,
    height: videoRef.videoHeight
  };
  videoCanvas.width = videoRef.clientWidth;
  videoCanvas.height = videoRef.clientHeight;
  context2D.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
  context2D.strokeStyle = 'black';
  context2D.lineWidth = 3;
  for (const rect of rects) {
    const x = rect.x / videoSize.width * videoCanvas.width;
    const y = rect.y / videoSize.height * videoCanvas.height;
    const width = rect.width / videoSize.width * videoCanvas.width;
    const height = rect.height / videoSize.height * videoCanvas.height;
    context2D.strokeRect(x, y, width, height);
  }
}

/**
 * 動画のクロップ範囲を更新する
 */
function cropVideoUpdate(preview : Preview){
  const videoRef = document.getElementById('target') as HTMLVideoElement;
  if (!videoRef) {
    return;
  }
  const cropCanvas = document.getElementById('cropCanvas') as HTMLCanvasElement;
  if (!cropCanvas) {
    return;
  }
  const context2D = cropCanvas.getContext('2d');
  if (!context2D) {
    return;
  }
  const scale = Math.min(preview.size.width, preview.size.height) / 300;
  cropCanvas.width = preview.size.width / scale;
  cropCanvas.height = preview.size.height / scale;
  context2D.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
  for (const crop of preview.crops) {
    context2D.drawImage(videoRef,
      crop.source.x, crop.source.y, crop.source.width, crop.source.height,
      crop.draw.x / scale, crop.draw.y / scale, crop.draw.width / scale, crop.draw.height / scale
    );
  }
}

function CropEditor(props: {preview: Preview, setPreview: (preview: Preview) => void}){
  const {preview, setPreview} = props;

  useEffect(() => {
    const intervalId = setInterval(() => {
      canvasOnVideoUpdate(preview.crops.map((crop) => crop.source));
      cropVideoUpdate(preview);
    }, 1000 / 60);
    return () => clearInterval(intervalId);
  }, [preview]);

  return (
    <div>
      <TextField
        label="width"
        defaultValue={preview.size.width.toString()}
        onChange={(event) => {
          setPreview({size: {width: parseInt(event.target.value), height: preview.size.height}, crops: preview.crops});
        }}
      />
      <TextField
        label="height"
        defaultValue={preview.size.height.toString()}
        onChange={(event) => {
          setPreview({size: {width: preview.size.width, height: parseInt(event.target.value)}, crops: preview.crops});
        }}
      />
      {preview.crops.map((crop, index) => {
        return (
          <div key={index} style={{
            marginTop: '10px'
          }}>
            <Grid container columns={4} spacing={2}>
              <Grid item xs={2}>
                <TextField
                  label={`source x[${index}]`}
                  defaultValue={crop.source.x.toString()}
                  onChange={(event) => {
                    const newCrop = preview.crops.slice();
                    newCrop[index].source.x = parseInt(event.target.value);
                    setPreview({size: preview.size, crops: newCrop});
                  }}
                />
                <TextField
                  label={`source y[${index}]`}
                  defaultValue={crop.source.y.toString()}
                  onChange={(event) => {
                    const newCrop = preview.crops.slice();
                    newCrop[index].source.y = parseInt(event.target.value);
                    setPreview({size: preview.size, crops: newCrop});
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label={`source width[${index}]`}
                  defaultValue={crop.source.width.toString()}
                  onChange={(event) => {
                    const newCrop = preview.crops.slice();
                    newCrop[index].source.width = parseInt(event.target.value);
                    setPreview({size: preview.size, crops: newCrop});
                  }}
                />
                <TextField
                  label={`source height[${index}]`}
                  defaultValue={crop.source.height.toString()}
                  onChange={(event) => {
                    const newCrop = preview.crops.slice();
                    newCrop[index].source.height = parseInt(event.target.value);
                    setPreview({size: preview.size, crops: newCrop});
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label={`draw x[${index}]`}
                  defaultValue={crop.draw.x.toString()}
                  onChange={(event) => {
                    const newCrop = preview.crops.slice();
                    newCrop[index].draw.x = parseInt(event.target.value);
                    setPreview({size: preview.size, crops: newCrop});
                  }}
                />
                <TextField
                  label={`draw y[${index}]`}
                  defaultValue={crop.draw.y.toString()}
                  onChange={(event) => {
                    const newCrop = preview.crops.slice();
                    newCrop[index].draw.y = parseInt(event.target.value);
                    setPreview({size: preview.size, crops: newCrop});
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label={`draw width[${index}]`}
                  defaultValue={crop.draw.width.toString()}
                  onChange={(event) => {
                    const newCrop = preview.crops.slice();
                    newCrop[index].draw.width = parseInt(event.target.value);
                    setPreview({size: preview.size, crops: newCrop});
                  }}
                />
                <TextField
                  label={`draw height[${index}]`}
                  defaultValue={crop.draw.height.toString()}
                  onChange={(event) => {
                    const newCrop = preview.crops.slice();
                    newCrop[index].draw.height = parseInt(event.target.value);
                    setPreview({size: preview.size, crops: newCrop});
                  }}
                />
              </Grid>
            </Grid>
          </div>
        );
      })}
      <Button
        variant={'contained'}
        onClick={() => {
          const newCrop = preview.crops.slice();
          newCrop.push({
            source: {x: 0, y: 0, width: 100, height: 100},
            draw: {x: 0, y: 0, width: 100, height: 100}
          });
          setPreview({size: preview.size, crops: newCrop});
        }}
        style={{margin: '10px'}}
      >Add Crop</Button>
      <Button
        variant={'contained'}
        onClick={() => {
          const newCrop = preview.crops.slice();
          newCrop.pop();
          setPreview({size: preview.size, crops: newCrop});
        }}
        style={{margin: '10px'}}
      >Remove Crop</Button>
      <hr/>
      <canvas
        id={'cropCanvas'}
        style={{
          border: 'solid 1px #000',
          backgroundColor: '#000'
        }}
      />
    </div>
  );
}

export default VideoCutEditor;
