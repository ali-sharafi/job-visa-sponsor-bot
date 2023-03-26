
const getHashtags = (title) => {
    return title.toLowerCase()
        .replace('full stack', 'fullstack')
        .replace('big data', 'big-data')
        .replace('software', '')
        .replace('engineer', '')
        .replace('developer', '')
        .replace('.net', 'dotnet')
        .replace(/[^\w\s]/gi, '')
        .replace(' and ', ' ')
        .replace(' or ', ' ')
        .replace(' with ', ' ')
        .replace('success', ' ')
        .replace('-', '')
        .replace('/', '')
        .split(' ')
        .filter(item => item.length > 2).map(item => item.replace(/[^\w\s]/gi, ''));
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const convertStringToDateTime = (relativeTime) => {
    const timeUnits = {
        hours: 60 * 60 * 1000,
        hour: 60 * 60 * 1000,
        minutes: 60 * 1000,
        seconds: 1000,
    };
    const now = new Date();
    const timestamp = now.getTime();
    const match = /(\d+)\s+(\w+)\s+ago/.exec(relativeTime);
    const value = parseInt(match[1]);
    const unit = match[2];

    const msAgo = value * timeUnits[unit];
    const adjustedTimestamp = timestamp - msAgo;
    const datetime = new Date(adjustedTimestamp);
    return datetime.toISOString().replace(/T|Z/g, ' ').trim();

}
const locations = [
    {
        name: 'Netherlands',
        id: 178
    },
    {
        name: 'Finland',
        id: 79
    },
    {
        name: 'Germany',
        id: 96
    },
    {
        name: 'Sweden',
        id: 223
    }
]

module.exports = {
    getHashtags,
    sleep,
    convertStringToDateTime,
    locations
}