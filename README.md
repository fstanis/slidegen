# slidegen

Generates a slide deck from the given video(s).

## Installation

```shell
npm i -g slidegen
```

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
slidegen -c config.yaml -o output.key
```
