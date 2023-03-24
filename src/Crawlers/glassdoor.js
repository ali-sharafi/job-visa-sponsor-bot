const path = require('path');
const fs = require('fs').promises;
const captchaSolver = require('./captchaSolver');
const logger = require('./logger');
var loggedIn = false;
var page = null;
const storageFolder = `${__dirname}/../storage`;
const storagePath = path.resolve(storageFolder, 'captcha.png');
const puppet = require('./Puppeteer')

module.exports = async () => {
    let browser = puppet.make();
    let ws = await browser.browserInit();

    if (!await browser.connect(ws)) {
        return console.log('failed')
    }

    page = browser.page;

    page.on('response', async response => {
        const url = response.url();
        if (url.indexOf('Account/CheckSeatAllotment') !== -1) {
            let resJson = await response.json();
            checkResponse(resJson);
        }
    });

    await setCookies();

    gotToGlassdoodr();
}

async function gotToGlassdoodr() {
    await page.goto('https://www.glassdoor.com');
    await page.waitForSelector('a[href="/index.htm"]');
    await setLocalStorage();
    if (await isNotLoggedIn()) {
        console.log('Needs to login');
        await login();
    } else console.log('Already logged In');
    await page.screenshot({ path: path.resolve(storageFolder, 'loggedIn.png') })
    searchJobs();
}

async function searchJobs() {
    let netherlandsJobs = 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword=developer&locT=N&locId=178?fromAge=1';

    await page.goto(netherlandsJobs);
    await page.waitForSelector('#filter_fromAge');//wait for Posted time div
    const currentUrl = await page.url();
    const newUrl = `${currentUrl}?fromAge=1`;
    await page.goto(newUrl);
    await page.waitForSelector('#filter_fromAge');//wait for Posted time div
    await page.screenshot({ path: path.resolve(storageFolder, 'jobList.png') })
}

async function login() {
    //Sometimes need to click on Accept Cookies button
    await checkAcceptCookies();

    await page.click('.input-wrapper')//click on input to focus
    await page.waitForTimeout(1000);
    await page.type('#inlineUserEmail', process.env.GLASSDOOR_USERNAME, { delay: 100 });
    await page.click('.authInlineContainer button[data-testid="email-form-button"]')//click on continue with email button
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