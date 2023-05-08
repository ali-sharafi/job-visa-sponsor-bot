const logger = require('./utils/logger');
const {
    relocateDotMeJobs
} = require('./Crawlers/relocatedotme');
const {
    vanhackJobs
} = require('./Crawlers/vanhack');
const {
    reeddotcodotukJobs
} = require('./Crawlers/reeddotcodotuk');
const {
    landingJobs
} = require('./Crawlers/landingdotjobs');
const {
    relocateMeDotEuJobs
} = require('./Crawlers/relocatemedoteu');
const {
    simplyhiredJobs
} = require('./Crawlers/simplyhired');
const {
    swissDevJobs
} = require('./Crawlers/swissdevjobsdotch');
const { linkedIn } = require('./Crawlers/linkedIn');
const Last = require('./models/Last');
const moment = require('moment');
const { glassdoor } = require('./Crawlers/glassdoor');
const { flatten } = require('lodash');


module.exports.GetAll = async () => {
    const promises = [
        glassdoor(),
        relocateDotMeJobs(),
        vanhackJobs(),
        reeddotcodotukJobs(),
        relocateMeDotEuJobs(),
        simplyhiredJobs(),
        swissDevJobs(),
        landingJobs(),
        linkedIn('Developer'),
        linkedIn('Designer'),
        linkedIn('Network'),
        linkedIn('BI'),
        linkedIn('DevOps'),
        linkedIn('SRE'),
        linkedIn('Android'),
    ];
    try {
        let result = await Promise.all(promises);

        return flatten(result)
    } catch (error) {
        logger(error);
    }
}

module.exports.RemoveLasts = async () => {
    await Last.deleteMany({
        createdAt: { $lt: moment().subtract(7, 'd').utc() }
    })
}