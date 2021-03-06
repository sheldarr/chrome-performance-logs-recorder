import chalk from 'chalk';
import fs from 'fs';
import selenium from 'selenium-standalone';
import wd from 'wd';
import winston from 'winston';

import ArgumentsParser from './src/arguments-parser';

const args = ArgumentsParser.parse(process.argv.slice(2));

winston.configure({
    transports: [
        new winston.transports.Console({
            colorize: true,
            level: 'info'
        })
    ]
});

if (args.verbose) {
    winston.configure({
        transports: [
            new winston.transports.Console({
                colorize: true,
                level: 'verbose'
            })
        ]
    });
}

if (args.debug) {
    winston.configure({
        transports: [
            new winston.transports.Console({
                colorize: true,
                level: 'debug'
            })
        ]
    });
}

if (args.silent) {
    winston.configure({
        transports: []
    });
}

winston.verbose(`${chalk.green('Parsed args')} ${JSON.stringify(args, null, '\t')}`);

const seleniumConfig = {
    version: '3.5.3',
    baseURL: 'https://selenium-release.storage.googleapis.com',
    drivers: {
        chrome: {
            version: '2.32',
            arch: process.arch,
            baseURL: 'https://chromedriver.storage.googleapis.com'
        }
    }
}

winston.info(chalk.green('Installing selenium'));
selenium.install(Object.assign({}, seleniumConfig, {
    logger: winston.debug,
    progressCb: (totalLength, progressLength, chunkLength) => {
        winston.verbose(totalLength, progressLength, chunkLength)
    }
}), (error) => {
    if (error) {
        winston.error(chalk.red(error));

        process.exit();
    }

    winston.info(chalk.green('Starting selenium'));
    selenium.start(seleniumConfig, (error, child) => {
        if (error) {
            winston.error(chalk.red(error));

            process.exit();
        }

        child.stderr.on('data', function (data) {
            winston.debug(`${chalk.blue('Selenium:data >')} ${data.toString()}`);
        });

        const browser = wd.remote()

        browser.on('status', (info) => {
            winston.debug(`${chalk.blue('Browser:status >')} ${info}`);
        });
        browser.on('command', (eventType, command, response) => {
            winston.debug(`${chalk.blue('Browser:command >')} ${eventType} ${command} ${response || ''}`);
        });
        browser.on('http', (method, path, data) => {
            winston.debug(`${chalk.blue('Browser:http >')} ${method} ${path} ${data || ''}`);
        });

        winston.info(chalk.green('Initializing browser'));
        browser.init({
            browserName: 'chrome',
            chromeOptions: {
                perfLoggingPrefs: {
                    traceCategories: args['trace-categories']
                },
                args: [
                    '--disable-background-networking',
                    '--disable-component-extensions-with-background-pages',
                    '--enable-precise-memory-info',
                    '--enable-thread-composting',
                    '--metrics-recording-only'
                ]
            },
            loggingPrefs: {
                performance: 'ALL'
            }
        }, () => {
            const localStorage = args['local-storage'].split(':');
            const key = localStorage[0];
            const value = localStorage[1];
            
            winston.info(chalk.green(`Starting browsing ${args.url}`));
            browser.get(args.url, () => {
                winston.info(chalk.green(`Setting to local storage ${key}:${value}`));
                browser.setLocalStorageKey(key, value, () => {
                    winston.info(chalk.green(`Refreshing page`))
                    browser.refresh(() => {
                        winston.info(chalk.green(`Waiting ${args.duration}ms`));
                        setTimeout(() => {
                            winston.info(chalk.green('Dumping performance logs'));
                            browser.log('performance', (error, data) => {
                                if (error) {
                                    winston.error(chalk.red(error));
                                }
        
                                const eventNamesWhitelist = args['filter-event-names']
                                    .split(',')
                                    .filter((eventName) => {
                                        return eventName !== '';
                                    });
                                const events = data
                                    .map((entry) => {
                                        return JSON.parse(entry.message).message.params;
                                    })
                                    .filter((event) => {
                                        if (eventNamesWhitelist.length === 0) {
                                            return true;
                                        }
        
                                        return eventNamesWhitelist.includes(event.name)
                                    });
                                const trimPercentage = args.trim / 100;

                                const eventsToTrim = Math.floor(events.length * trimPercentage / 2);
                                winston.info(`${chalk.green('Trimming')} ${chalk.cyan(trimPercentage)}${chalk.cyan('%')}${chalk.green('(')}${chalk.cyan(eventsToTrim)}${chalk.green(') of events (half of the value at the beginning and half at the end)')}`);
                                events.splice(0, eventsToTrim);
                                events.splice(events.length - eventsToTrim, eventsToTrim);

                                winston.info(chalk.green(`Writing performance logs to ${args['output-filename']}`));
                                fs.writeFile(args['output-filename'], JSON.stringify(events, null, '\t'), (error) => {
                                    if (error) {
                                        winston.error(chalk.red(error));
                                    }
        
                                    winston.info(chalk.green('Quitting browser'));
                                    browser.quit((error) => {
                                        if (error) {
                                            winston.error(chalk.red(error));
                                        }
        
                                        winston.info(chalk.green('Killing selenium'));
                                        child.kill();
                                    });
                                });
                            });
                        }, args.duration);
                    });
                });
            });
        });
    });
});
