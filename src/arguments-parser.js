import minimist from 'minimist';

const DEFAULT_DURATION = 5000;

class ArgumentsParser {
    static parse(argv) {
        const args = minimist(argv, {
            default: {
                debug: false,
                duration: DEFAULT_DURATION,
                'output-filename': 'trace.json',
                silent: false,
                'trace-categories': 'devtools.timeline,disabled-by-default-devtools.timeline.frame,rail',
                'url': '',
                'verbose': false
            }
        });
        
        return args;
    }
}

export default ArgumentsParser;