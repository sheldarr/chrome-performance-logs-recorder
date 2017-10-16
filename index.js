import fs from 'fs';
import selenium from 'selenium-standalone';
import winston from 'winston';
import wd from 'wd';

winston.configure({
    transports: [
        new winston.transports.Console({
            colorize: true,
            level: 'info'
        })
    ]
});

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
    logger: winston.verbose,
    progressCb: (totalLength, progressLength, chunkLength) => {
        winston.info(totalLength, progressLength, chunkLength)
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

        winston.info(child.port);

        child.stderr.on('data', function (data) {
            winston.verbose(`Selenium:data >  ${data.toString()}`);
        });

        const browser = wd.remote()

        browser.on('status', (info) => {
            winston.verbose(`Browser:status >  ${info}`);
          });
        browser.on('command', (eventType, command, response) => {
            winston.verbose(`Browser:command > ${eventType} ${command} ${response || ''}`);
          });
        browser.on('http', (method, path, data) => {
            winston.verbose(`Browser:http > ${method} ${path} ${data || ''}`);
        });

        browser.init({
            browserName: 'chrome',
            chromeOptions: {
                perfLoggingPrefs: {
                    traceCategories: [
                        'devtools.timeline',
                        'disabled-by-default-devtools.timeline.frame',
                        'rail',
                    ].join(',')
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
            browser.get('http://localhost', () => {
                browser.log('performance', (error, data) => {
                    if(error) {
                        winston.error(error);
                    }
                    
                    const logs = data.map((entry) => {
                        return JSON.parse(entry.message).message.params;
                    });

                    fs.writeFile('trace.json', JSON.stringify(logs, null, '\t'), (error) => {
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
            });
        });
    });
});
