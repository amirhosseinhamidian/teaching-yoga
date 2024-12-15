#!/bin/bash
# بررسی وجود ffmpeg
if ! command -v ffmpeg &> /dev/null
then
    echo "Installing FFMPEG..."
    apt-get update
    apt-get install -y ffmpeg
    echo "FFMPEG has been installed successfully."
else
    echo "FFMPEG is already installed."
fi
