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
const path = require('path');
const nunjucks = require('nunjucks');
const Zip = require('adm-zip');
const rimraf = require('rimraf');

const ffmpeg = require('./ffmpeg');

const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

const VIDEOS_OUTPUT = path.join(__dirname, '../videos');
const STATIC = path.join(__dirname, '../static');
const TEMPLATE = path.join(__dirname, '../templates/index.njk');

async function generateDeck (config, output) {
  if (!await ffmpeg.isInstalled()) {
    throw new Error('ffmpeg doesn\'t appear to be installed');
  }

  const zip = new Zip();

  const videos = await parseVideos(config);
  console.log(`Done encoding ${videos.length} videos, generating output`);

  videos.forEach(video => {
    zip.addLocalFile(video.path);
  });

  zip.addFile('index.apxl', nunjucks.render(TEMPLATE, {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    videos
  }));
  zip.addLocalFile(path.join(STATIC, 'buildVersionHistory.plist'));
  zip.addLocalFile(path.join(STATIC, 'posterImage.png'));
  zip.addLocalFile(path.join(STATIC, 'QuickLook/Thumbnail.png'), 'QuickLook');

  zip.writeZip(output);
}

async function parseVideos (config) {
  rimraf.sync(VIDEOS_OUTPUT);
  fs.mkdirSync(VIDEOS_OUTPUT);

  const videos = [];
  let i = 1;
  for (const video of config.videos) {
    if (!fs.existsSync(video.src)) {
      throw new Error(`Video source not found: ${video.src}`);
    }
    video.start = parseTime(video.start);
    video.end = parseTime(video.end);
    if (video.start > video.end) {
      throw new Error('End time for video is before start time');
    }

    const videoFilename = `media${i++}.mov`;
    const videoPath = path.join(VIDEOS_OUTPUT, videoFilename);
    console.log(`Encoding ${video.src} to ${videoFilename}`);
    await ffmpeg.convertVideo(video.src, videoPath, {
      quality: video.quality,
      start: video.start,
      end: video.end
    });
    const videoInfo = await ffmpeg.getVideoInfo(videoPath);
    videos.push({
      filename: videoFilename,
      path: videoPath,
      size: videoInfo.size,
      duration: videoInfo.duration,
      notes: parseNotes(video.notes),
      dimensions: parseDimensions(videoInfo)
    });
  }
  return videos;
}

function parseNotes (notes) {
  if (typeof notes !== 'string') {
    throw new TypeError('Notes must be a string.');
  }
  return '<p>' + notes.split('\n').join('<br/></p><p>') + '</p>';
}

function parseTime (time) {
  if (!time) {
    return;
  }
  if (!Number.isNaN(Number(time))) {
    return Number(time);
  }
  const segments = time.split(':');
  if (segments.length !== 2) {
    throw new Error(`Invalid time: ${time}`);
  }
  const result = Number(segments[0]) * 60 + Number(segments[1]);
  if (Number.isNaN(result)) {
    throw new Error(`Invalid time: ${time}`);
  }
  return result;
}

function parseDimensions ({ width, height }) {
  if (width / height > 16 / 9) {
    height = SLIDE_WIDTH * height / width;
    width = SLIDE_WIDTH;
  } else {
    width = SLIDE_HEIGHT * width / height;
    height = SLIDE_HEIGHT;
  }
  return {
    width,
    height,
    x: (SLIDE_WIDTH - width) / 2,
    y: (SLIDE_HEIGHT - height) / 2
  };
}

module.exports = { generateDeck };
