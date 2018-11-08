"use strict";

import express from "express";
import {getTransactionControllerInstance} from "./transaction.controller";
import {getBalanceControllerInstance} from "./balance.controller";

let router = express.Router(),
    transferRoute = router.route("/transfer"),
    balanceInstance = getBalanceControllerInstance();

    transactionInstance = getTransactionControllerInstance(balanceInstance);

transferRoute.post(transactionInstance.transferMoney.bind(transactionInstance));

export default router;