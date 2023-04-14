const mongoose = require("mongoose")

const Proxy = new mongoose.Schema({
    ip: {
        type: String
    },
    port: {
        type: String
    },
    username: {
        type: String
    },
    password: {
        type: String
    },
    enabled: {
        type: Number,
        defaultValue: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Proxy", Proxy);