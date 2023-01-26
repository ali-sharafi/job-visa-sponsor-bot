const Last = require('../models/Last');
const axios = require('axios');
const cheerio = require('cheerio');
const { getHashtags } = require('../utils/tools');
const source = 'linkedin';


const linkedIn = async () => {
    try {
        let html = await axios.get(process.env.LINKEDIN_ENDPOINT);
        const $ = cheerio.load(html.data);
        const jobs = await Promise.all($('.jobs-search__results-list').children().map(async (i, el) => {
            const title = $(el).find('.base-search-card__title').text().trim();
            const company = $(el).find('.base-search-card__subtitle').text().trim();
            const when = $(el).find('time').text().trim();
            const location = $(el).find('.job-search-card__location').text().trim();
            const content = 'TODO';
            const options = 'TODO';
            const url = $(el).find('a').attr('href');
            const guid = $(el).find('div.base-card').attr('data-entity-urn');
            const hashtags = getHashtags(title);
            const exist = await Last.findOne({
                where: source,
                guid: guid
            });
            if (!exist) {
                await new Last({
                    where: source,
                    guid: url,
                }).save();
                return {
                    title,
                    company,
                    location,
                    content,
                    url,
                    hashtags,
                    options,
                    source,
                };
            } else {
                return null;
            }
        }));

        return (await jobs).filter(item => item);
    } catch (err) {
        console.log(err);
        return [];
    }
}

module.exports = {
    linkedIn
}