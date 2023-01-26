
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

module.exports = {
    getHashtags
}