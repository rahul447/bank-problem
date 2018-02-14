"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {LanguageController} from "./language.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    languageListRoute = router.route("/languageList"),
    languageAddRoute = router.route("/languageAdd"),
    languageUpdateRoute = router.route("/languageUpdate/:id"),
    languageInstance = new LanguageController(loggerInstance, config);

languageListRoute.get(languageInstance.languageList.bind(languageInstance));
languageAddRoute.post(languageInstance.languageAdd.bind(languageInstance));
languageUpdateRoute.patch(languageInstance.languageUpdate.bind(languageInstance));

export default router;