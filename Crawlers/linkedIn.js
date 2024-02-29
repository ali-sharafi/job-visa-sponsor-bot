const Last = require('../models/Last');
const Company = require('../models/Company');
const axios = require('axios');
const cheerio = require('cheerio');
const { getHashtags, sleep, convertStringToDateTime, getTunnelProxy } = require('../utils/tools');
const util = require('node:util');
const source = 'LinkedIn';
const LanguageDetect = require('languagedetect');
const logger = require('../utils/logger');
const { sendJob } = require('../Telegram/DoStuff');
const lngDetector = new LanguageDetect();
var tunnelingAgent = null;

const linkedIn = async (keyword) => {
    tunnelingAgent = await getTunnelProxy();
    try {
        let jobs = [];
        let linkedInLink = util.format(process.env.LINKEDIN_ENDPOINT, keyword);
        let html = await axios.get(linkedInLink, {
            proxy: false,
            httpsAgent: tunnelingAgent
        });
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
            const guid = company + title;
            logger(`LinkedIn: ${guid}`)
            const exist = await Last.findOne({
                where: source,
                guid: guid
            });
            if (guid && !exist) {
                await new Last({
                    where: source,
                    guid: guid,
                }).save();
                // const canVisaSponsered = await Company.findOne({
                //     "name": { $regex: company }
                // })

                const { content, isEnglish, fullContent } = await getJobContent(url);
                let hashtags = getHashtags(fullContent);
                hashtags.push(keyword)
                if (isEnglish) {
                    sendJob({
                        title,
                        company,
                        location,
                        content,
                        url,
                        hashtags,
                        options: null,
                        source,
                        when: convertStringToDateTime(when)
                    });
                }
                await sleep(10000);

            }
        }
        logger("LinkedIn is done!")
        return jobs;
    } catch (err) {
        console.log("LinkedIn Error: ", err.message);
        return [];
    }
}

async function getJobContent(url) {
    tunnelingAgent = await getTunnelProxy();
    let html = await axios.get(url, {
        proxy: false,
        httpsAgent: tunnelingAgent
    });
    const $ = cheerio.load(html.data);
    let content = $('.show-more-less-html__markup').text().trim();
    let shortContent = content.slice(0, 150);

    return {
        content: shortContent + '...',
        fullContent: content,
        isEnglish: lngDetector.detect(shortContent, 1).length > 0 ? lngDetector.detect(shortContent, 1)[0][0] == 'english' : false
    }
}

module.exports = {
    linkedIn
}