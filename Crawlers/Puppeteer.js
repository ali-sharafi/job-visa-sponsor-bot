const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

module.exports.make = function (p) {
    return new Pup(p)
}

class Pup {
    constructor(p) {
        this.page = null;
        this.browser = null;
        this.config = [
            // `--window-size=1920,1080`,
            `--window-size=1280,960`,
            '--no-sandbox',
            '--disable-features=site-per-process',
            '--disable-cache',
            '--disk-cache-size=0'
        ];
        this.speed = 1
    }
    enableLog() {
        this.log.setEnable(1)
    }


    async hideDetect() {
        // Pass the User-Agent Test.
        // const userAgent =
        //     'Mozilla/5.0 (X11; Linux x86_64)' +
        //     'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
        const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36';
        await this.page.setUserAgent(userAgent);

        // Pass the Webdriver Test.
        await this.page.evaluateOnNewDocument(() => {
            const newProto = navigator.__proto__;
            delete newProto.webdriver;
            navigator.__proto__ = newProto;
        });

        // Pass the Chrome Test.
        await this.page.evaluateOnNewDocument(() => {
            // We can mock this in as much depth as we need for the test.
            window.chrome = {
                runtime: {}
            };
        });

        // Pass the Permissions Test.
        await this.page.evaluateOnNewDocument(() => {
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.__proto__.query = parameters =>
                parameters.name === 'notifications'
                    ? Promise.resolve({ state: Notification.permission })
                    : originalQuery(parameters);

            // Inspired by: https://github.com/ikarienator/phantomjs_hide_and_seek/blob/master/5.spoofFunctionBind.js
            const oldCall = Function.prototype.call;
            function call() {
                return oldCall.apply(this, arguments);
            }
            Function.prototype.call = call;

            const nativeToStringFunctionString = Error.toString().replace(/Error/g, "toString");
            const oldToString = Function.prototype.toString;

            function functionToString() {
                if (this === window.navigator.permissions.query) {
                    return "function query() { [native code] }";
                }
                if (this === functionToString) {
                    return nativeToStringFunctionString;
                }
                return oldCall.call(oldToString, this);
            }
            Function.prototype.toString = functionToString;
        });



        // Pass the Permissions Test.
        // await this.page.evaluateOnNewDocument(() => {
        //     const originalQuery = window.navigator.permissions.query;
        //     return window.navigator.permissions.query = (parameters) => (
        //         parameters.name === 'notifications' ?
        //             Promise.resolve({ state: Notification.permission }) :
        //             originalQuery(parameters)
        //     );
        // });



        // Pass the Plugins Length Test.
        await this.page.evaluateOnNewDocument(() => {
            // Overwrite the `plugins` property to use a custom getter.
            Object.defineProperty(navigator, 'plugins', {
                // This just needs to have `length > 0` for the current test,
                // but we could mock the plugins too if necessary.
                get: () => [1, 2, 3, 4, 5]
            });
        });

        // Pass the Languages Test.
        await this.page.evaluateOnNewDocument(() => {
            // Overwrite the `languages` property to use a custom getter.
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });
        });

        // Pass the iframe Test
        // await this.page.evaluateOnNewDocument(() => {
        //     Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
        //         get: function() {
        //             return window;
        //         }
        //     });
        // });

        // Pass toString test, though it breaks console.debug() from working
        await this.page.evaluateOnNewDocument(() => {
            window.console.debug = () => {
                return null;
            };
        });

        await this.page.evaluateOnNewDocument(() => {
            ['height', 'width'].forEach(property => {
                // store the existing descriptor
                const imageDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, property);

                // redefine the property with a patched descriptor
                Object.defineProperty(HTMLImageElement.prototype, property, {
                    ...imageDescriptor,
                    get: function () {
                        // return an arbitrary non-zero dimension if the image failed to load
                        if (this.complete && this.naturalHeight == 0) {
                            return 20;
                        }
                        // otherwise, return the actual dimension
                        return imageDescriptor.get.apply(this);
                    },
                });
            });

            const getParameter = WebGLRenderingContext.getParameter;
            WebGLRenderingContext.prototype.getParameter = function (parameter) {
                // UNMASKED_VENDOR_WEBGL
                if (parameter === 37445) {
                    // return 'Intel Open Source Technology Center';
                    return 'NVIDIA Corporation';
                }
                // UNMASKED_RENDERER_WEBGL
                if (parameter === 37446) {
                    return 'GeForce GTX 1060 6GB/PCIe/SSE2';
                    // return 'Mesa DRI Intel(R) Ivybridge Mobile ';
                }

                return getParameter(parameter);
            };

            // store the existing descriptor
            const elementDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

            // redefine the property with a patched descriptor
            Object.defineProperty(HTMLDivElement.prototype, 'offsetHeight', {
                ...elementDescriptor,
                get: function () {
                    if (this.id === 'modernizr') {
                        return 1;
                    }
                    return elementDescriptor.get.apply(this);
                },
            });
        });



    }
    async browserInit(proxy, browser_dir = '') {
        if (browser_dir) {
            this.config.push('--user-data-dir=' + __basedir + 'storage/google/' + browser_dir)
        }
        if (proxy && proxy.ip) {
            let val = proxy.type + '://' + proxy.ip + ':' + proxy.port
            console.log('proxy: ', val);
            this.config.push('--proxy-server=' + val)
        }
        this.browser = await puppeteer.launch({
            args: this.config
        }).catch((e) => {
            console.log(e)
            return ''
        });
        this.page = (await this.browser.pages())[0];

        await this.hideDetect()

        if (proxy && proxy.ip && proxy.password) {
            await this.page.authenticate({
                username: proxy.username,
                password: proxy.password
            });
        }


        this.page.setDefaultNavigationTimeout(30000);
        let ws = this.browser.wsEndpoint()
        await this.browser.disconnect()
        return ws
    }

    async connect(ws, proxy, on_new_page = false) {
        try {
            this.browser = await puppeteer.connect({ browserWSEndpoint: ws });
        } catch (e) {
            return false
        }
        if (on_new_page) {
            this.page = (await this.browser.newPage());
            let pages = await this.browser.pages()
            for (let i = 0; i < pages.length - 1; i++) {
                await pages[i].close()
            }
        } else {
            this.page = (await this.browser.pages())[0];
        }
        await this.hideDetect()

        await this.page.setViewport({
            // width: 1920,
            // height: 1080,
            width: 1280,
            height: 960,
            deviceScaleFactor: 1,
        });
        if (proxy && proxy.ip && proxy.password) {
            await this.page.authenticate({
                username: proxy.username,
                password: proxy.password
            });
        }
        this.page.setDefaultNavigationTimeout(60000);
        return this
    }
    async disconnect() {
        if (!this.browser) {
            return
        }
        let pages = await this.browser.pages()
        for (let i = 0; i < pages.length - 1; i++) {
            await pages[i].close()
        }
        await this.browser.disconnect()
    }
    async close() {
        try {
            await this.browser.close()
        } catch (e) {

        }

    }


    async _waitFor(val, timeout = 5000, visible = true) {
        this.log.info('_waitFor ' + val + ', timeout: ' + timeout)
        return await this.page.waitForSelector(val, { timeout, visible: false }).then(res => {
            this.log.info('_waitFor success')
            return true
        }).catch(e => {
            this.log.error('_waitFor error')
            return false
        });
    }
    async waitForFrame(frameName, attempts = 5) {
        let frame = ''
        do {
            attempts--
            await delay(1000)
            let frames = await this.page.frames();
            frame = frames.find(i => {
                return i.name() === frameName
            })
        } while (!frame && attempts > 0)
        return frame
    }
    async _waitForText(text, timeout = 500) {
        this.log.info('_waitForText ' + text + ', timeout: ' + timeout)
        let res = false
        while (!res && timeout >= 0) {
            timeout -= 500
            await delay(500)
            res = await this.hasText(text)
        }
        if (res) {
            this.log.info('_waitForText success')
        } else {
            this.log.error('_waitForText error')
        }
        return res
    }
    async _waitForElement(selector, timeout = 500) {
        this.log.info('_waitForElement ' + selector + ', timeout: ' + timeout)
        let res = false
        while (!res && timeout >= 0) {
            timeout -= 500
            await delay(500)
            res = await this.hasElement(selector)
        }
        if (res) {
            this.log.info('_waitForElement success')
        } else {
            this.log.error('_waitForElement error')
        }
        return res
    }
    async _click(selector, attempts = 1, max_wait_in_ms = 5000, with_navigation = false) {
        // if (!await this.waitForLoad()) {
        //     this.log.error('click error loading')
        //     return false
        // }
        this.log.info('_click ' + selector)
        if (! await this._waitFor(selector, max_wait_in_ms)) {
            this.log.error('click error 1')
            return false
        }
        await delay(parseInt(200 / this.speed))

        if (!with_navigation) {
            return await this.page.click(selector/*, {delay:100}*/).then(() => {
                this.log.info('click success')
                return true
            }).catch(e => {
                this.log.error('click error 2')
                return false
            });
        }

        return await Promise.all([
            this.page.click(selector).then(() => {
                this.log.info('click success, with_navigation')
                return true
            }).catch(e => {
                this.log.error('click error 2, with_navigation')
                return false
            }),
            this.page.waitForNavigation({ timeout: 20000 })
        ])
    }
    async _clickOnTextButton(text, attempts = 1) {
        this.log.info('_clickOnTextButton ' + text)
        let res = false
        let fails = 0;
        while (!res && fails < attempts) {
            await delay(parseInt(500 / this.speed))
            fails++
            res = await this._tryClickOnTextButton(text)
        }
        if (res) {
            this.log.info('_clickOnTextButton success')
        } else {
            this.log.error('_clickOnTextButton error')
        }
        return res
    }
    async _tryClickOnTextButton(text) {
        this.log.info('_tryClickOnTextButton ' + text)
        const [el] = await this.page.$x("//button[contains(., '" + text + "')]");
        if (!el) {
            this.log.error('_tryClickOnTextButton no element')
            return false
        }
        return await el.click().then(() => {
            this.log.info('_tryClickOnTextButton success')
            return true
        }).catch(e => {
            this.log.error('_tryClickOnTextButton error')
            return false
        });
    }

    async _type(selector, val, delay_before = 0, attempts = 1) {
        this.log.info('_type ' + selector + '  val: ' + val)
        // await delay(1000);
        if (! await this._waitFor(selector)) {
            this.log.error('_type error 1')
            return false
        }
        await delay(parseInt(500 / this.speed))
        return await this.page.type(selector, val).then(() => {
            this.log.info('_type success')
            return true
        }).catch(e => {
            this.log.error('_type error 1')
            return false
        });
    }
    async _paste(selector, val, delay_before = 0, attempts = 1) {
        this.log.info('_paste ' + selector + '  val: ' + val)
        if (! await this._waitFor(selector)) {
            this.log.error('_paste error 1')
            return false
        }
        await delay(parseInt(500 / this.speed))
        let res = await this._tryPaste(selector, val)
        if (res) {
            this.log.info('_paste success')
        } else {
            this.log.error('_paste error 2')
        }
        await this.page.keyboard.press('ArrowRight')
        return res
    }
    async _tryPaste(selector, val) {
        return await this.page.evaluate((selector, val) => {
            document.querySelector(selector).value = val;
        }, selector, val).then(() => {
            return true
        }).catch(e => {
            return false
        });
    }
    async hasText(text) {
        return await this.page.waitForFunction(
            'document.querySelector("body").innerText.includes("' + text + '")', { timeout: 500 }).then(() => {
                this.log.info('hasText yes. ' + text)
                return true
            }).catch(e => {
                this.log.info('hasText no. ' + text)
                return false
            });
    }

    async getElement(selector) {
        const element = await this.page.$(selector);
        if (!element) {
            this.log.error('getElement not found ' + selector)
            return undefined
        }
        return element
    }
    async hasElement(selector) {
        const element = await this.getElement(selector)
        let res = element
        if (res) {
            this.log.info('hasElement yes ' + selector)
        } else {
            this.log.info('hasElement no ' + selector)
        }
        return res
    }
    async getElementText(selector, page = null) {
        if (!page) {
            page = this.page
        }
        const element = await page.$(selector);
        if (!element) {
            return undefined
        }
        return await page.evaluate(element => element.textContent, element);
    }
    async getInputValue(selector) {
        return await this.page.evaluate((selector) => {
            return document.querySelector(selector).value
        }, selector).then((val) => {
            return val
        }).catch(e => {
            return undefined
        });
    }


}

function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms)
    });
}
