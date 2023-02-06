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


module.exports.GetAll = async () => {
    try {
        let Result = []

        Result.push(
            ...(await relocateDotMeJobs()),
            ...(await vanhackJobs()),
            ...(await reeddotcodotukJobs()),
            ...(await relocateMeDotEuJobs()),
            ...(await simplyhiredJobs()),
            ...(await swissDevJobs()),
            ...(await landingJobs()),
            ...(await linkedIn()));

        return Result
    } catch (error) {
        logger(error);
    }
}

module.exports.RemoveLasts = async () => {
    await Last.deleteMany({
        createdAt: { $lt: moment().subtract(7, 'd').utc() }
    })
}