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


module.exports.GetAll = async () => {
    try {
        let [
            gd,
            rMe,
            vck,
            rd,
            rMeEu,
            sply,
            swiss,
            landing,
            lnkdIn
        ] = await Promise.all([
            glassdoor(),
            relocateDotMeJobs(),
            vanhackJobs(),
            reeddotcodotukJobs(),
            relocateMeDotEuJobs(),
            simplyhiredJobs(),
            swissDevJobs(),
            landingJobs(),
            linkedIn()
        ]);

        let Result = [...gd, ...rMe, ...vck, ...rd, ...rMeEu, ...sply, ...swiss, ...landing, ...lnkdIn];


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