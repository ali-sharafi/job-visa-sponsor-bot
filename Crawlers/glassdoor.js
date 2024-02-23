const path = require('path');
const fs = require('fs').promises;
const storageFolder = `${__dirname}/../storage`;
const puppet = require('./Puppeteer');
const moment = require('moment');
const { getHashtags, sleep, locations } = require('../utils/tools');
const Last = require('../models/Last');
const source = 'glassdoor';
const glassdoorURL = 'https://www.glassdoor.com';
const LanguageDetect = require('languagedetect');
const logger = require('../utils/logger');
const { sendJob } = require('../Telegram/DoStuff');
const lngDetector = new LanguageDetect();
var page = null;
var browser = null;

module.exports.launchBrowser = async () => {
    browser = puppet.make();
    let ws = await browser.browserInit();
    if (!await browser.connect(ws)) {
        return console.log('failed')
    }
    page = browser.page;
    await page.setCacheEnabled(false);
}

module.exports.glassdoor = async () => {
    await setCookies();
    let jobs = [];
    try {
        jobs = await getJobs();
    } catch (error) {
        logger('Glassdoor error: ' + JSON.stringify({ message: error.message, stack: error.stack }))
    }
    logger('glassdoor done');
    return jobs;
}

async function getJobs() {
    await gotToGlassdoodr();
    await searchJobs(69);
    await parsePageJobs('Germany')
}

async function parsePageJobs(country) {
    let jobs = [];
    await page.screenshot({ path: path.resolve(storageFolder, 'inlineUserPassword.png') })
    const listItems = await page.$$('ul [class^="JobsList"][data-test="jobListing"]');
    let today = moment().format('YYYY-MM-DD');

    for (let i = 0; i < listItems.length; i++) {
        const listItem = listItems[i];
        const { location, url, company, title } = await listItem.evaluate(element => {
            return {
                location: element.querySelector('[id^="job-location"]').innerText,
                url: element.querySelector('a').getAttribute('href'),
                company: element.querySelector('span[class^="EmployerProfile_employerName"]').innerText,
                title: element.querySelector('[id^="job-title"]').innerText,
            }
        });
        console.log('company: ',company, 'i: ',i)
        const guid = company + title;
        const exist = await Last.findOne({
            where: source,
            guid: guid
        });
        if (guid && !exist) {
            await new Last({
                where: source,
                guid: guid,
            }).save();

            const { content, isEnglish, fullContent } = await getJobContent(listItem);
            if (isEnglish) {
                sendJob({
                    location: `${country}-${location}`,
                    url: `${url}`,
                    company,
                    title,
                    content: content,
                    when: today,
                    source,
                    hashtags: getHashtags(fullContent),
                    options: null,
                })
            }
        }
        await sleep(3000);
    }

    return jobs;
}

async function getJobContent(item) {
    await item.click();
    await page.waitForTimeout(3000);
    let content = await page.evaluate(() => document.querySelector('div[class^="JobDetails_jobDescription_"]').innerText.trim());

    return {
        content: content.slice(0, 150) + '...',
        fullContent: content,
        isEnglish: lngDetector.detect(content, 1).length > 0 ? lngDetector.detect(content, 1)[0][0] == 'english' : false
    }
}

async function gotToGlassdoodr() {
    await page.goto('https://www.glassdoor.com');
    await page.waitForSelector('[data-test="search-button"]');
    await setLocalStorage();
    if (await isNotLoggedIn()) {
        console.log('Needs to login');
        await login();
    } else console.log('Already logged In');

}

async function searchJobs(locationId) {
    const newUrl = `https://www.glassdoor.com/Job/cologne-germany-hr-jobs-SRCH_IL.0,15_IC4348509_KO16,18.htm?fromAge=1&sortBy=date_desc`;//only last day jobs sorted by date desc
    await page.goto(newUrl);
}

async function login() {
    //Sometimes need to click on Accept Cookies button
    await checkAcceptCookies();

    await page.click('.TextInputWrapper')//click on input to focus
    await page.waitForTimeout(1000);
    await page.type('#inlineUserEmail', process.env.GLASSDOOR_USERNAME, { delay: 100 });
    await page.click('.emailButton button')//click on continue with email button
    // await page.screenshot({ path: path.resolve(storageFolder, 'inlineUserPassword.png') });
    await page.waitForSelector('#inlineUserPassword')//wait for the password input
    await page.type('#inlineUserPassword', process.env.GLASSDOOR_PASS, { delay: 100 });
    await page.click('.emailButton button')//click on Sign In button
    await page.waitForSelector('#sc\\.keyword', { timeout: 60000 });
    console.log('Sigined In successfully');
    await page.screenshot({ path: path.resolve(storageFolder, 'inlineUserPassword.png') })
    await saveCookies();
}

async function checkAcceptCookies() {
    const buttonExists = await page.evaluate((text) => {
        const button = Array.from(document.getElementsByTagName('button')).find(b => b.innerText === text);
        return !!button;
    }, 'Accept Cookies');

    if (buttonExists) {
        console.log('cookies button watched');
        await page.evaluate((text) => {
            const button = Array.from(document.getElementsByTagName('button')).find(b => b.innerText === text);
            button.click();
        }, 'Accept Cookies');
    }
}

async function isNotLoggedIn() {
    const buttonExists = await page.evaluate((text) => {
        const button = Array.from(document.getElementsByTagName('button')).find(b => b.ariaLabel === text);
        return !!button;
    }, 'sign in button');

    return buttonExists;
}

async function setLocalStorage() {
    try {
        const localStorageString = await fs.readFile(path.resolve(storageFolder, 'localStorage.json'));
        const localStorageObj = JSON.parse(localStorageString);
        await page.evaluate(localStorageObj => {
            for (const key in localStorageObj) {
                localStorage.setItem(key, localStorageObj[key]);
            }
        }, localStorageObj);
        console.log(`LocalStorage file added successfully`);
    } catch {
        console.log(`Cannot access LocalStorage file`);
    }
}

async function setCookies() {
    try {
        const cookiesString = await fs.readFile(path.resolve(storageFolder, 'cookies.json'));
        const cookiesObj = JSON.parse(cookiesString);
        await page.setCookie(...cookiesObj);
        console.log(`Cookies file added successfully`);
    } catch (err) {
        console.log(`Cannot access cookies file`);
    }
}

async function saveCookies() {
    const cookies = await page.cookies();
    await fs.writeFile(path.resolve(storageFolder, 'cookies.json'), JSON.stringify(cookies, null, 2));
    const localStorageData = await page.evaluate(() => Object.assign({}, window.localStorage));
    await fs.writeFile(path.resolve(storageFolder, 'localStorage.json'), JSON.stringify(localStorageData, null, 2));
    console.log(`Cookies saved`);
}