import {Alert, TextField} from '@mui/material';
import {ReactElement, useState} from 'react';
import {convertTimeToCutCommand} from '../lib/CutCommand.tsx';

function VideoCutEditor(props: {sourcePath: string, startTime: number, endTime: number}) {
  const {sourcePath, startTime, endTime} = props;
  const [copiedAlert, setCopiedAlert] = useState<ReactElement>(<> </>);
  const [title, setTitle] = useState<string>('title');
  const [ruby, setRuby] = useState<string>('ruby');
  const [clipUrl, setClipUrl] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const command = convertTimeToCutCommand(sourcePath, startTime, endTime, title, memo);

  return (
    <div>
      {copiedAlert}
      <TextField
        label="Title"
        fullWidth={true}
        defaultValue={title}
        onChange={(event) => {setTitle(event.target.value);}}
        style={{marginTop: '10px'}}
      />
      <TextField
        label="Ruby"
        fullWidth={true}
        defaultValue={ruby}
        onChange={(event) => {setRuby(event.target.value);}}
        style={{marginTop: '10px'}}
      />
      <TextField
        label="Clip URL"
        fullWidth={true}
        defaultValue={clipUrl}
        onChange={(event) => {setClipUrl(event.target.value);}}
        style={{marginTop: '10px'}}
      />
      <TextField
        label="Memo"
        fullWidth={true}
        defaultValue={memo}
        onChange={(event) => {setMemo(event.target.value);}}
        style={{marginTop: '10px'}}
        multiline={true}
        minRows={5}
      />
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

export default VideoCutEditor;
