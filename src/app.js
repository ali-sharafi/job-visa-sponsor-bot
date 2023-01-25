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

let count = 0;
cron.schedule('*/5 * * * *', () => {
    logger(`cron job count: ${count++}`)
    GetAll().then(async (result) => {
        if (result.length != 0) {
            await SendJobs(result)
        } else throw Error('result is empty')
    }).catch((e) => {
        console.log(e);
    });
});