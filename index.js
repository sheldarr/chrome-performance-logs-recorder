import chalk from 'chalk';
import fs from 'fs';
import selenium from 'selenium-standalone';
import winston from 'winston';
import wd from 'wd';

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

selenium.install(Object.assign({}, seleniumConfig, {
    logger: winston.debug,
    progressCb: (totalLength, progressLength, chunkLength) => {
        winston.verbose(totalLength, progressLength, chunkLength)
    }
}), (error) => {
    if (error) {
        winston.error(error);

        process.exit();
    }

    selenium.start(seleniumConfig, (error, child) => {
        if (error) {
            winston.error(error);

            process.exit();
        }

        child.stderr.on('data', function (data) {
            winston.debug(`Selenium:data >  ${data.toString()}`);
        });

        const browser = wd.remote()

        browser.on('status', (info) => {
            winston.debug(`Browser:status >  ${info}`);
          });
        browser.on('command', (eventType, command, response) => {
            winston.debug(`Browser:command > ${eventType} ${command} ${response || ''}`);
          });
        browser.on('http', (method, path, data) => {
            winston.debug(`Browser:http > ${method} ${path} ${data || ''}`);
        });

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
            browser.get(args.url, () => {
                setTimeout(() => {
                    browser.log('performance', (error, data) => {
                        if(error) {
                            winston.error(error);
                        }
                        
                        const logs = data.map((entry) => {
                            return JSON.parse(entry.message).message.params;
                        });
    
                        fs.writeFile(args['output-filename'], JSON.stringify(logs, null, '\t'), (error) => {
                            if(error) {
                                winston.error(error);
                            }
    
                            browser.quit((error) => {
                                if(error) {
                                    winston.error(error);
                                }
    
                                child.kill();
                            });
                        });
                    });
                }, args.duration);
            });
        });
    });
});
