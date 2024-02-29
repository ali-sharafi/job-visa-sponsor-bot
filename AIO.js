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
    glassdoor(),
    await linkedIn('HR');
    await linkedIn('Assistant');
    await linkedIn('Work Student');
}

module.exports.RemoveLasts = async () => {
    await Last.deleteMany({
        createdAt: { $lt: moment().subtract(7, 'd').utc() }
    })
}