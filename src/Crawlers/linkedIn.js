const Last = require('../models/Last');
const Company = require('../models/Company');
const axios = require('axios');
const cheerio = require('cheerio');
const { getHashtags, sleep } = require('../utils/tools');
const source = 'linkedin';
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();

const linkedIn = async () => {
    try {
        let html = await axios.get(process.env.LINKEDIN_ENDPOINT);
        const $ = cheerio.load(html.data);
        const jobsList = $('.jobs-search__results-list').children();
        let jobs = [];
        for (let i = 0; i < jobsList.length; i++) {
            const job = jobsList[i];
            const title = $(job).find('.base-search-card__title').text().trim();
            const company = $(job).find('.base-search-card__subtitle').text().trim();
            const when = $(job).find('time').text().trim();
            const location = $(job).find('.job-search-card__location').text().trim();
            const url = $(job).find('a').attr('href');
            const guid = $(job).find('div.base-card').attr('data-entity-urn');
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
                const canVisaSponsered = await Company.findOne({
                    "name": { $regex: company }
                })

                if (canVisaSponsered) {
                    const { content, isEnglish } = await getJobContent(url);
                    if (isEnglish) {
                        jobs.push({
                            title,
                            company,
                            location,
                            content,
                            url,
                            hashtags,
                            options: null,
                            source,
                            when
                        });
                    }
                    await sleep(10000);
                }
            }
        }

        return jobs;
    } catch (err) {
        console.log(err);
        return [];
    }
}

async function getJobContent(url) {
    let html = await axios.get(url);
    const $ = cheerio.load(html.data);
    let content = $('.show-more-less-html__markup').text().trim();
    let shortContent = content.slice(0, 150);

    return {
        content: shortContent + '...',
        isEnglish: lngDetector.detect(shortContent, 1).length > 0 ? lngDetector.detect(shortContent, 1)[0][0] == 'english' : false
    }
}

module.exports = {
    linkedIn
}