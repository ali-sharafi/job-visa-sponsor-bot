const Proxy = require("../models/Proxy");
const fs = require('fs');

(async () => {
    await Proxy.deleteMany({});
    fs.readFile('./proxies.txt', 'utf-8', async (err, data) => {
        if (err) console.log('error: ', err);
        else {
            let itemToInsert = [];
            let proxies = data.match(/[^\r\n]+/g);
            for (let i = 0; i < proxies.length; i++) {
                const item = proxies[i];
                let proxy = item.split(':');
                let proxyData = {
                    ip: proxy[0],
                    port: proxy[1],
                    username: proxy[2],
                    password: proxy[3],
                }
                itemToInsert.push(proxyData);
            }
            await Proxy.insertMany(itemToInsert);
            console.log('Proxies inserted successfully');
        }
    })
})()