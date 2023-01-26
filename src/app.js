const cron = require('node-cron');
const {
    SendJobs
} = require('./Bots/Telegram/DoStuff');
const {
    GetAll
} = require('./AIO');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
dotenv.config();


if (process.env.UPDATE_DB === 'true') {
    logger('Going to Update DB');
    GetAll().then(() => {
        logger('Update DB was done');
    });
}

cron.schedule(process.env.CRON_JOB_SCHEDULE, () => {
    logger('Cron job runs');
    GetAll().then(async (result) => {
        if (result.length != 0) {
            await SendJobs(result)
        } else logger('Result is empty')
    }).catch((e) => {
        console.log(e);
    });
});