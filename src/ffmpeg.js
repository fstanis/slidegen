// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const fs = require('fs');
const { exec } = require('child_process');

const DEFAULT_QUALITY = 10;
const CODEC_PARAMS_ENCODE = '-c:v libx264 -profile:v high -pix_fmt yuv420p';
const CODEC_PARAMS_COPY = '-c:v copy';
const OTHER_PARAMS = '-an -movflags faststart -y -nostats';

async function convertVideo (src, dest, { quality = DEFAULT_QUALITY, start = 0, end, encode = true }) {
  if (typeof dest !== 'string') {
    throw new TypeError('Destination must be a string');
  }
  if (typeof quality !== 'number' || quality < 1 || quality > 31) {
    throw new TypeError('Quality must be a number between 1 and 31');
  }
  if (start && typeof start !== 'number') {
    throw new TypeError('Start time must be a number');
  }
  if (end && typeof end !== 'number') {
    throw new TypeError('End time must be a number');
  }
  verifySrc(src);

  const qualityParams = `-crf ${quality}`;
  let seekParams = '';
  if (start) {
    seekParams += ` -ss ${start}`;
  }
  if (end) {
    seekParams += ` -t ${end - start}`;
  }
  const codecParams = encode ? CODEC_PARAMS_ENCODE : CODEC_PARAMS_COPY;
  await run(`ffmpeg ${seekParams} -i ${JSON.stringify(src)} ${codecParams} ${OTHER_PARAMS} ${qualityParams} ${JSON.stringify(dest)}`);
}

const POSTER_PARAMS = '-vf "select=eq(n\\,0)"';

async function generatePoster (src, dest, { quality = DEFAULT_QUALITY }) {
  if (typeof dest !== 'string') {
    throw new TypeError('Destination must be a string');
  }
  if (typeof quality !== 'number' || quality < 1 || quality > 31) {
    throw new TypeError('Quality must be a number between 1 and 31');
  }
  verifySrc(src);

  await run(`ffmpeg -i ${JSON.stringify(src)} ${POSTER_PARAMS} -q:v ${quality} ${JSON.stringify(dest)}`);
}

const GET_VIDEO_INFO_COMMAND = 'ffprobe -v error -select_streams v:0 -show_entries stream=duration,height,width -of default=noprint_wrappers=1:nokey=1';

async function getVideoInfo (src) {
  verifySrc(src);

  const out = (await run(`${GET_VIDEO_INFO_COMMAND} ${JSON.stringify(src)}`)).split('\n');
  const { size } = fs.statSync(src);
  return {
    width: Number(out[0]),
    height: Number(out[1]),
    duration: Math.round(Number(out[2]) * 1000),
    size
  };
}

async function isInstalled () {
  try {
    await run('which ffmpeg');
    await run('which ffprobe');
  } catch (err) {
    return false;
  }
  return true;
}

async function run (command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`Command ${JSON.stringify(command)} exited with error code ${err.code}, stderr: ${stderr.trim()}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function verifySrc (src) {
  if (typeof src !== 'string') {
    throw new TypeError('Source must be a string');
  }
  if (!fs.existsSync(src)) {
    throw new Error(`File not found: ${src}`);
  }
}

module.exports = {
  convertVideo,
  generatePoster,
  getVideoInfo,
  isInstalled
};
