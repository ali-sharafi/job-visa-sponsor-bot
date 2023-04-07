const moment = require('moment');

const getHashtags = (jobDescription) => {
    const languagesAndTechnologies = {
        python: "Python",
        android: "Android",
        java: "Java",
        csharp: "C#",
        dotnet: '.NET',
        go: "Go",
        ruby: "Ruby",
        php: "PHP",
        unity: 'Unity',
        swift: "Swift",
        kotlin: "Kotlin",
        scala: "Scala",
        sql: "SQL",
        node: "Node.js",
        nodeJs:"NodeJS",
        react: "React",
        angular: "Angular",
        vue: "Vue.js",
        express: "Express.js",
        django: "Django",
        flask: "Flask",
        tensorflow: "TensorFlow",
        pytorch: "PyTorch",
        keras: "Keras",
        pandas: "Pandas",
        numpy: "NumPy",
        scikit: "Scikit-learn",
        spark: "Apache Spark",
        bi: "BI"
    };

    // Array of labels to be excluded
    const excludeLabels = ["engineer", "developer", "programmer"];

    // Extract the programming languages and technologies mentioned in the job description
    const mentionedLanguagesAndTechnologies = Object.entries(languagesAndTechnologies)
        .filter(([_, languageOrTechnology]) => new RegExp(`\\b(${languageOrTechnology})\\b`, "i").test(jobDescription))
        .map(([_, label]) => label)
        .filter(label => !excludeLabels.includes(label.toLowerCase()));

    return mentionedLanguagesAndTechnologies
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const convertStringToDateTime = (relativeTime) => {
    try {
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
    } catch (error) {
        console.log('Error ocurred in converting time: ', error.message);
        return moment().format('YYYY-MM-DD H:i:s');
    }


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