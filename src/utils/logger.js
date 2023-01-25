const moment = require('moment');
const fs = require('fs');

module.exports = (text) => {
    const logText = `${moment().format('YYYY-MM-DD HH:mm:ss')}     ` + text + '\r\n';
    const file = `./logs/${moment().format('YYYY-MM-DD')}.log`;
    console.log(logText)
    fs.appendFile(file, logText, 'utf8', (error) => {
        if (error) {
            console.log(error);
        }
    });
}