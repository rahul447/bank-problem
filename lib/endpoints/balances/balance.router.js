"use strict";

import express from "express";
import {getBalanceControllerInstance} from "./balance.controller";

let router = express.Router(),
    editAudioRoute = router.route("/editAudio"),

    balanceInstance = getBalanceControllerInstance();

editAudioRoute.post(balanceInstance.editAudio.bind(balanceInstance));

export default router;