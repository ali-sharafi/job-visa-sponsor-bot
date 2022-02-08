const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('connected to DB'))
    .catch((err) => console.log(err));

const {
    stackoverflowJobs
} = require('./Crawlers/stackoverflow');
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


module.exports.GetAll = async () => {
    try {
        let Result = []
        // Result.push()
        Result.push(...(await stackoverflowJobs()), ...(await relocateDotMeJobs()) , ...(await vanhackJobs()) , ...(await reeddotcodotukJobs()) , ...(await landingJobs()));
        // console.log(await stackoverflowJobs());
        return Result
    } catch (error) {
        console.log(error);
    }
}