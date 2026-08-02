/* eslint-disable no-undef */
import { spawn } from 'node:child_process';

const runCommand = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${stderr.trim()}`));
        return;
      }

      resolve(stdout);
    });
  });

export async function probeVideo(sourcePath) {
  const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';

  const output = await runCommand(ffprobePath, [
    '-v',
    'error',
    '-show_entries',
    'format=duration:stream=index,codec_type,width,height',
    '-of',
    'json',
    sourcePath,
  ]);

  const metadata = JSON.parse(output);

  const videoStream = metadata.streams?.find(
    (stream) => stream.codec_type === 'video'
  );

  if (!videoStream) {
    throw new Error('No video stream was found in the source file.');
  }

  const duration = Number(metadata.format?.duration);
  const width = Number(videoStream.width);
  const height = Number(videoStream.height);

  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    !Number.isInteger(width) ||
    !Number.isInteger(height)
  ) {
    throw new Error('The source video metadata is invalid.');
  }

  return {
    duration,
    width,
    height,
    hasAudio: metadata.streams?.some((stream) => stream.codec_type === 'audio'),
  };
}
