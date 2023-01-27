const fs = require('fs');
const Company = require('../models/Company');

module.exports = () => {
    fs.readFile(require('path').resolve(__dirname, '../companies.csv'), 'utf-8', async (err, data) => {
        if (err) {
            throw err;
        }
        const content = data.split(',');
        let i = 0;
        while (i < content.length) {
            let companyName = content[i];
            let registrationId = content[i + 1];
            if (companyName) {
                console.log('Going to save the company: ', companyName, 'Remained: ', content.length - i)
                await new Company({
                    name: companyName.trim(),
                    location: 'Netherlands',
                    registrationId: registrationId
                }).save();
            }

            if (!isNaN(registrationId)) {
                i += 2;
            } else i++;
        }
    });
}