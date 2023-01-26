const logger = require('../../utils/logger');
const {
    bot
} = require('./bot')
require('dotenv').config({
    path: '../../env'
})
const {
    creator
} = require('./msg');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(message) {
    message.text += `<a href="https://t.me/visasponsor">@VisaSponsor</a>`
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
    }else logger(message)
}

module.exports.SendJobs = async (data) => {
    for (let index = 0; index < data.length; index++) {
        const message = creator(data[index], index);
        await sendMessage(message);
        await sleep(process.env.TIME_TO_SEND)
    }
}