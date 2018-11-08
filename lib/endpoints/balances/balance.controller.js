"use strict";

import balances from "./balance.model";
import mongoose from "mongoose";

let BalanceControllerInstance, {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));

class BalanceController {

    constructor() {
        this.config = config;
        this.balancesModelInstance = balances;
    }

    async getBalanceForAccount(userId) {
        if(!userId) {
            return Promise.reject({message: `Userid Not found`})
        }

        try{
            let userBalance = await this.balancesModelInstance.find({_id: userId}, {balance: 1})
            .exec()
    
            return Promise.resolve(userBalance)
        } catch(err) {
            return Promise.reject({message: `DB Query Issue`})
        }
    }

    async changeBalance(id, amount, type) {
        const value = type === 'INC' ? Math.abs(amount) : -Math.abs(amount)
        try{
            await this.balancesModelInstance.update({_id: id}, { $inc: { balance: value } }).exec()
            return Promise.resolve({message : `Update money Success`})
        } catch(err) {
            return Promise.reject({message: `Update money op failed => ${JSON.stringify(err)}`})
        }       
    }

}

export function getBalanceControllerInstance() {
    BalanceControllerInstance = BalanceControllerInstance || new BalanceController();
    return BalanceControllerInstance;
}