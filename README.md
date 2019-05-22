# slidegen

Generates a slide deck from the given video(s).

## Installation

1. Make sure FFmpeg is installed. See [Download FFmpeg](https://ffmpeg.org/download.html)
for more information.

2. Install using `npm i -g slidegen`. Alternatively, you can use `npx` to run
without installing globally.

## Usage

First, create a config file with the list of videos.

```yaml
videos:
  - src: "video.mp4"
    start: 2
    end: 4
    notes: "Some notes"
  - src: "video.mp4"
    start: "1:20"
    end: "1:23"
    notes: "Hello,\nworld!"
```

Then run `slidegen`.

```shell
npx slidegen -c config.yaml -o output.key
```
