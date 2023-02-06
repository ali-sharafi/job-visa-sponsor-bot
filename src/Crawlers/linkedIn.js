const Last = require('../models/Last');
const Company = require('../models/Company');
const axios = require('axios');
const cheerio = require('cheerio');
const { getHashtags, sleep } = require('../utils/tools');
const util = require('node:util');
const source = 'LinkedIn';
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
const locations = ["Netherlands", "Germany", "Sweden", "Finland"];

const linkedIn = async () => {
    try {
        let jobs = [];
        for (let j = 0; j < locations.length; j++) {
            let linkedInLink = util.format(process.env.LINKEDIN_ENDPOINT, locations[j]);
            let html = await axios.get(linkedInLink);
            await sleep(5000);
            const $ = cheerio.load(html.data);
            const jobsList = $('.jobs-search__results-list').children();
            for (let i = 0; i < jobsList.length; i++) {
                const job = jobsList[i];
                const title = $(job).find('.base-search-card__title').text().trim();
                const company = $(job).find('.base-search-card__subtitle').text().trim();
                const when = $(job).find('time').text().trim();
                const location = $(job).find('.job-search-card__location').text().trim();
                const url = $(job).find('a').attr('href');
                // const guid = $(job).find('div.base-card').attr('data-entity-urn');
                const hashtags = getHashtags(title);
                const guid = company + location + title;
                const exist = await Last.findOne({
                    where: source,
                    guid: guid
                });
                if (guid && !exist) {
                    await new Last({
                        where: source,
                        guid: guid,
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