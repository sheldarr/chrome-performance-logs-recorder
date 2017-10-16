import winston from 'winston';

winston.configure({
    transports: [
        new winston.transports.Console({ 
            colorize: true,
            level: 'info'
        })
    ]
});

winston.info('IDDQD');