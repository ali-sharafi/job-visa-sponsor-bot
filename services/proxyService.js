const ProxyChain = require('proxy-chain');
const Proxy = require('../models/Proxy');
const { EventBus } = require("../utils/eventBus");
const PROXY_PORT = 6889;

const ProxyService = class {
    constructor() {
        this.proxies = [];
        this.lastProxy = 0;
        this.server = {};
        this.proxy = '';
        this.getAllProxies();

        EventBus.on('change-proxy:players', () => {
            this.server.close(true, () => {
                logger.log('Proxy server was closed.', 'proxy', false);
                this.createServer()
            });
        })
    }

    getAllProxies() {
        Proxy.findAll({
            where: {
                enabled: 1
            }
        }).then(res => {
            this.proxies = res;
            this.createServer();
        })
    }

    getNextProxy() {
        let proxy = this.proxies[this.lastProxy];
        if (this.proxies[this.lastProxy + 1]) this.lastProxy++
        else this.lastProxy = 0;
        return `http://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
    }

    createServer() {
        this.proxy = this.getNextProxy();
        this.server = new ProxyChain.Server({
            port: PROXY_PORT,
            prepareRequestFunction: ({ request }) => {
                return { upstreamProxyUrl: this.proxy };
            }
        });
        this.server.listen(() => logger.log(`PROXY SERVER STARTED ON PORT ${PROXY_PORT}`, 'proxy', false));
    }
}

module.exports = new ProxyService();