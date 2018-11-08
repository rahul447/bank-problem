'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
const {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));

var BalanceSchema = new Schema({
    balance: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Balance', BalanceSchema);