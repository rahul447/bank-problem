"use strict";

import express from "express";
import {getClassControllerInstance} from "./class.controller";

let router = express.Router(),
    classListRoute = router.route("/classList"),
    classInstance = getClassControllerInstance();

classListRoute.get(classInstance.classList.bind(classInstance));

export default router;