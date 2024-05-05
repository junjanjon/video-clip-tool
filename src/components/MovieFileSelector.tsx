import React from 'react';
import MovieIcon from '@mui/icons-material/Movie';
import Box from '@mui/material/Box';
import {TextField} from '@mui/material';

export interface MovieFileSelectorProps {
  source: string;
  setSource: (source: string) => void;
  setDuration: (duration: number) => void;
}

function MovieFileSelector(props: MovieFileSelectorProps) {
  const {source, setSource, setDuration} = props;
  const sourceRef = React.createRef<HTMLInputElement>();

  const changeFile = (fileList: FileList | null) => {
    if (fileList && 0 < fileList.length) {
      setSource(URL.createObjectURL(fileList[0]));
      if (sourceRef.current) {
        sourceRef.current.value = fileList[0].name;
      }
      setDuration(-1);
    }
  };

  return (
    <>
      <TextField
        inputRef={sourceRef}
        fullWidth={true}
        InputProps={{
          startAdornment: (<MovieIcon/>),
        }}
        defaultValue={source}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            setSource(sourceRef.current?.value || '');
            setDuration(-1);
          }
        }}
      >
      </TextField>
      <Box
        component="section"
        sx={{ p: 2, border: '1px dashed grey' }}
        onDrop={(event) => {
          event.preventDefault();
          changeFile(event.dataTransfer.files);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }}
      >
        <h2>Movie File Drag & Drop</h2>
        <input
          type={'file'}
          onChange={(event) => {
            changeFile(event.target.files);
          }}
        />
      </Box>
    </>
  );
}

export default MovieFileSelector;
