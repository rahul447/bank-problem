"use strict";

import express from "express";
import {getLanguageControllerInstance} from "./language.controller";

let router = express.Router(),
    languageListRoute = router.route("/languageList"),
    languageAddRoute = router.route("/languageAdd"),
    languageUpdateRoute = router.route("/languageUpdate/:id"),
    languageDeleteRoute = router.route("/languageDelete/:languageId"),
    languageInstance = getLanguageControllerInstance();

languageListRoute.get(languageInstance.languageList.bind(languageInstance));
languageAddRoute.post(languageInstance.languageAdd.bind(languageInstance));
languageUpdateRoute.patch(languageInstance.languageUpdate.bind(languageInstance));
languageDeleteRoute.delete(languageInstance.languageDelete.bind(languageInstance));

export default router;