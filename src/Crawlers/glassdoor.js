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
const lngDetector = new LanguageDetect();
var page = null;
var browser = null;

module.exports = async () => {
    browser = puppet.make();
    let ws = await browser.browserInit();
    if (!await browser.connect(ws)) {
        return console.log('failed')
    }

    page = browser.page;
    await setCookies();
    let jobs = await getJobs();
    await browser.close();
    browser = null;

    return jobs;
}

async function getJobs() {
    await gotToGlassdoodr();
    let jobs = [];
    for (let i = 0; i < locations.length; i++) {
        await searchJobs(locations[i].id);
        jobs.push(...(await parsePageJobs(locations[i].name)))
        await sleep(10000);
    }

    return jobs;
}

async function parsePageJobs(country) {
    let jobs = [];
    const listItems = await page.$$('#JobResults li.react-job-listing');
    let today = moment().format('YYYY-MM-DD');

    for (const listItem of listItems) {
        const { location, url, company, title } = await listItem.evaluate(element => {
            return {
                location: element.getAttribute('data-job-loc'),
                url: element.querySelector('a').getAttribute('href'),
                company: element.querySelectorAll('a')[1].querySelector('span').innerText,
                title: element.querySelectorAll('a')[2].querySelector('span').innerText,
            }
        });
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

            const { content, isEnglish } = await getJobContent(listItem);
            if (isEnglish) {
                jobs.push({
                    location: `${country}-${location}`,
                    url: `${glassdoorURL}${url}`,
                    company,
                    title,
                    content: content,
                    when: today,
                    source,
                    hashtags: getHashtags(title),
                    options: null,
                })
            }
        }
        await sleep(5000);
    }

    return jobs;
}

async function getJobContent(item) {
    await item.click();
    await page.waitForSelector('button[data-test="save-button"]');
    let content = await page.evaluate(() => document.querySelector('.jobDescriptionContent').innerText.trim());

    return {
        content: content.slice(0, 150) + '...',
        isEnglish: lngDetector.detect(content, 1).length > 0 ? lngDetector.detect(content, 1)[0][0] == 'english' : false
    }
}

async function gotToGlassdoodr() {
    await page.goto('https://www.glassdoor.com');
    await page.waitForSelector('a[href="/index.htm"]');
    await setLocalStorage();
    if (await isNotLoggedIn()) {
        console.log('Needs to login');
        await login();
    } else console.log('Already logged In');

}

async function searchJobs(locationId) {
    let jobsLink = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=developer&locT=N&locId=${locationId}`;

    await page.goto(jobsLink);
    await page.waitForSelector('#filter_fromAge');//wait for Posted time div
    const currentUrl = await page.url();
    const newUrl = `${currentUrl}?fromAge=1&sortBy=date_desc`;//only last day jobs sorted by date desc
    await page.goto(newUrl);
    await page.waitForSelector('#filter_fromAge');//wait for Posted time div
}

async function login() {
    //Sometimes need to click on Accept Cookies button
    await checkAcceptCookies();

    await page.click('.input-wrapper')//click on input to focus
    await page.waitForTimeout(1000);
    await page.type('#inlineUserEmail', process.env.GLASSDOOR_USERNAME, { delay: 100 });
    await page.click('.authInlineContainer button[data-testid="email-form-button"]')//click on continue with email button
    // await page.screenshot({ path: path.resolve(storageFolder, 'inlineUserPassword.png') });
    await page.waitForSelector('#inlineUserPassword')//wait for the password input
    await page.type('#inlineUserPassword', process.env.GLASSDOOR_PASS, { delay: 100 });
    await page.click('.authInlineContainer button[name="submit"]')//click on Sign In button
    await page.waitForSelector('#sc\\.keyword', { timeout: 60000 });
    console.log('Sigined In successfully');
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
        const button = Array.from(document.getElementsByTagName('button')).find(b => b.innerText === text);
        return !!button;
    }, 'Sign In');

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