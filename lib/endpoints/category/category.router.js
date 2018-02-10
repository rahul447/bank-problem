"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {CategoryController} from "./category.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    categoryCreateRoute = router.route("/categoryCreate"),
    categoryEditRoute = router.route("/categoryEdit"),
    categoryDeleteRoute = router.route("/categoryDelete"),
    categoryInstance = new CategoryController(loggerInstance, config);

    categoryCreateRoute.post(categoryInstance.categoryCreate.bind(categoryInstance));
    categoryEditRoute.put(categoryInstance.categoryEdit.bind(categoryInstance));
    categoryDeleteRoute.delete(categoryInstance.categoryDelete.bind(categoryInstance));
export default router;