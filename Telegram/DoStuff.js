const logger = require('../utils/logger');
const { sleep } = require('../utils/tools');
const {
    bot
} = require('./bot')
const {
    creator
} = require('./msg');

async function sendMessage(message) {
    if (process.env.APP_ENV == 'prod') {
        await bot.telegram.sendMessage(process.env.CHANNEL_ID, message.text, {
            parse_mode: 'HTML',
            disable_notification: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'View job & Apply',
                            url: message.url
                        },
                    ]
                ]
            },
        })
    }else logger(JSON.stringify(message))
}

module.exports.SendJobs = async (data) => {
    for (let index = 0; index < data.length; index++) {
        sendJob(data[index]);
        await sleep(process.env.TIME_TO_SEND)
    }
}

const sendJob = async (job) => {
    const message = creator(job);
    await sendMessage(message);
}

module.exports.sendJob = sendJob;