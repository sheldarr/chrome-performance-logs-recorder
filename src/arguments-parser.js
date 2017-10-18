import chalk from 'chalk';
import minimist from 'minimist';
import winston from 'winston';

const DEFAULT_DURATION = 5000;

class ArgumentsParser {
    static parse(argv) {
        const args = minimist(argv, {
            default: {
                debug: false,
                duration: DEFAULT_DURATION,
                'filter-event-names': '',
                'local-storage': 'key:value',
                'output-filename': 'trace.json',
                silent: false,
                'trace-categories': 'devtools.timeline,disabled-by-default-devtools.timeline.frame,rail',
                'trim': '0',
                'url': '',
                'verbose': false
            }
        });

        if (args.url === '') {
            winston.error(chalk.red('Url must be provided e.g. --url="http://example.org"'));
            process.exit();
        }

        if (args.trim < 0 || args.trim > 100) {
            winston.error(chalk.red('trim value must be between 0 and 100'));
            process.exit();
        }

        return args;
    }
}

export default ArgumentsParser;