#!/bin/bash -xe

SCRIPTDIR=$(cd $(dirname $BASH_SOURCE); pwd)
cd ${SCRIPTDIR}
TAG=${1}
NAME=${2}

if [ -z "${TAG}" ]; then
    echo "Usage: $0 <tag> <name>"
    exit 1
fi

if [ -z "${NAME}" ]; then
    echo "Usage: $0 <tag> <name>"
    exit 1
fi

rm -rf ${NAME}.mp4
yt-dlp -f mp4 -o ${NAME}.mp4 -- ${TAG}

# rm -rf ${NAME}.wav
# ffmpeg -i ${NAME}.mp4 -f wav -vn ${NAME}.wav
