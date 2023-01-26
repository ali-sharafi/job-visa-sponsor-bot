const mongoose = require('mongoose');
const logger = require('./logger');

module.exports.connect = async () => {
    try {
        console.log('db url: ',process.env.MONGO_URL);
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        logger('connected to DB')
    } catch (error) {
        logger(error);
        throw Error('Some error ocurred while connection to DB');
    }
}