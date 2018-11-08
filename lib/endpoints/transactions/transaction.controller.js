"use strict";

import transactions from "./transaction.model";
import mongoose from "mongoose";
import ApiError from "../../util/apiError";


let TransactionControllerInstance, {NODE_ENV} = process.env,
nodeEnv = NODE_ENV || "staging",
config = Object.freeze(require("../../../config/" + nodeEnv));

class TransactionController {

    constructor(balanceInstance) {
        this.config = config;
        this.transactionModelInstance = transactions;
        this.activeUserSet = new Set()
        this.balanceControllerInstance = balanceInstance
    }

    validateRequest(from, to, amount) {
        return (!from || !to || !amount) ? new ApiError(`Request Not valid`, 500) : {}
    }

    async transferMoney(req, res) {
        let { from, to, amount } = req.body;

        let validResponse = this.validateRequest(from, to, amount) 
        
        if(validResponse instanceof ApiError) {
            return res.json(validResponse)
        }
        
        if(this.activeUserSet.has(from)) {
            return res.json(new ApiError(`transaction for ${from} already in process..`, 402))
        } else
            this.activeUserSet.add(from)

        let fromCurrBalance = await this.balanceControllerInstance.getBalanceForAccount(from);
        
        if(fromCurrBalance >= amount) {
            let {data} = await this.doOp(from, to, amount)
            let toCurrBalance = await this.balanceControllerInstance.getBalanceForAccount(to)

            let responseObj = { id: data, from: { id: from, balance: fromCurrBalance - amount }, 
            to: { id: to, balance: toCurrBalance}, transfered: amount }

            return res.json({ status: 200, message: `transaction from ${from} to ${to} done..`, 
            data: responseObj })
        } else 
            return res.json(new ApiError(`curr balance less`, 402))
    }

    async doOp(from, to, amount) {
        try{
            await Promise.all([
                await this.balanceControllerInstance.changeBalance(from, amount, 'DEC'),
                await this.balanceControllerInstance.changeBalance(to, amount, 'INC'),
            ])

            let transactionArr = await this.createTransaction(from, to, amount)
            
            this.activeUserSet.delete(from)
            
            return Promise.resolve({message: `Change Op Done`, data: transactionArr})
        } catch(err) {
            return Promise.reject(err)
        }
    }

    async createTransaction(from, to, amount) {
        const tran1, tran2;
        await Promise.all([
            tran1 = await this.transactionModelInstance.insertMany({amount, accountNumber: from, 
            transactionType: 'DEBIT'}).exec(),
            tran2 = await this.transactionModelInstance.insertMany({amount, accountNumber: to, 
                transactionType: 'CREDIT'}).exec()
        ])
        return Promise.resolve([tran1._id, tran2._id])
    }
}

export function getTransactionControllerInstance(balanceInstance) {
    TransactionControllerInstance = TransactionControllerInstance || 
    new TransactionController(balanceInstance);
    return TransactionControllerInstance;
}