export const logger = {
    info: (message: string, meta?: any) => {
        const timestamp = new Date().toISOString();
        const logData = { level: 'INFO', timestamp, message, ...(meta && { meta }) };
        console.log(JSON.stringify(logData));
    },
    error: (message: string, error?: any) => {
        const timestamp = new Date().toISOString();
        const logData = { level: 'ERROR', timestamp, message, ...(error && { error: error.message || error, stack: error.stack }) };
        console.error(JSON.stringify(logData));
    },
    warn: (message: string, meta?: any) => {
        const timestamp = new Date().toISOString();
        const logData = { level: 'WARN', timestamp, message, ...(meta && { meta }) };
        console.warn(JSON.stringify(logData));
    },
    debug: (message: string, meta?: any) => {
        if (process.env.NODE_ENV !== 'production') {
            const timestamp = new Date().toISOString();
            const logData = { level: 'DEBUG', timestamp, message, ...(meta && { meta }) };
            console.debug(JSON.stringify(logData));
        }
    }
};
