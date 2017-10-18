# chrome-performance-logs-recorder

Record performance logs from chrome browser to json file.

## Description

`chrome-performance-logs-recorder` starts selenium using [selenium-standalone](https://github.com/vvo/selenium-standalone) and then  uses [wd](https://github.com/admc/wd) client to browse specified url.

After specified duration it dumps performance logs and writes them to json file.

## Parameters


* `--debug` (default `false`) - enabled debug output
* `--duration` (default `5000`) - duration of logs gathering in ms
* `--filter-event-names` (default `''`) - comma separated event names to filter for
* `--local-storage` (default `'key:value'`) - can be used to pass one key:value pair to local storage
* `--output-filename` (default `'trace.json'`) - filename where recorded trace will be written
* `--silent` (default `false`) - disables output to console
* `--trace-categories` (default `'devtools.timeline,disabled-by-default-devtools.timeline.frame,rail'`) - comma separated trace categories
* `--trim` (default=`0`) - removes specified % of events (half of the value at the beginning and half at the end)
* `--url` (default `''`) - url of page for which logs will be recorded
* `--verbose` (default `false`) - enables verbose output

## Example

```
yarn install

node build/main.js
    --url='http://example.com'
```

## Trace categories

To get list of all available trace categories browse `chrome://tracing/` in chrome.

## Output format

[Trace Event Format](https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/edit)

## License

MIT
