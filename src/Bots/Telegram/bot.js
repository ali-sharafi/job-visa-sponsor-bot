require('dotenv').config()
const { Agent } = require('./Proxy')
const { Telegraf } = require('telegraf')
const Token = process.env.BOT_TOKEN
const config = {
    telegram: {
        agent: Agent,
    },
    channelMode: true
}
const bot = process.env.PROXY_SERVER ? new Telegraf(Token,config) : new Telegraf(Token)

module.exports = { bot }