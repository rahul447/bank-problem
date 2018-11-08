'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TransactionSchema = new Schema({
    amount: {
        type: Number,
        required: true
    },
    accountNumber: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Balance" 
    },
    transactionType: {
        type: String,
        required: true,
        enum: ["CREDIT", "DEBIT"]
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


module.exports = mongoose.model('Transaction', TransactionSchema);