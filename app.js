const dotenv = require('dotenv');
dotenv.config();
const cron = require('node-cron');
const {
    SendJobs
} = require('./Telegram/DoStuff');
const {
    GetAll, RemoveLasts
} = require('./AIO');
const logger = require('./utils/logger');
const reader = require('./utils/reader');
const db = require('./utils/db');
const { launchBrowser } = require('./Crawlers/glassdoor');

launchBrowser().then(() => {
    logger('Browser launched');
    db.connect().then(() => {
        if (process.env.UPDATE_DB === 'true') {
            logger('Going to Update DB');
            getJobs();
        }
    })
})

cron.schedule(process.env.CRON_JOB_SCHEDULE, () => {
    logger('Cron job runs');
    getJobs()
    RemoveLasts();
});

function getJobs(){
    GetAll().then(async (result) => {
        if (result.length != 0) {
            await SendJobs(result)
        } else logger('Result is empty')
    }).catch((e) => {
        console.log(e);
    });
}