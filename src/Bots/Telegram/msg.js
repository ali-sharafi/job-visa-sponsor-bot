module.exports.creator = (Message, Index) => {
    const {
        title,
        company,
        location,
        content,
        url,
        hashtags,
        source,
        options,
        when
    } = Message
    const message = `
<b>${title}</b>
Company:  <i>${company}</i>
Location : ${location}
Source: ${source}${options ?
`Options: ${options}` : ''}${when ?
`Published: ${when}` : ''}
${content}
${hashtags.map(tag => {
        tag = tag.replace(/\s+/g, '_')
            .replace(/\./g, '')
            .replace(/\//g, '_')
            .replace(/\(/g, '')
            .replace(/\)/g, '')
            .replace(/\:/g, '')
            .replace(/\,/g, '')
            .replace(/\;/g, '')
            .replace(/\-/g, '_')
            .replace(/\#/g, 'sharp')
            .replace(/\&/g, 'and')
            .replace(/\+/g, 'plus')
        return `#${tag}`
    }).join(' ')}
 `
    return {
        text: message.toString(),
        url
    }
}