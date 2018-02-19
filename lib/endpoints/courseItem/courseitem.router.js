"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import { courseItemController } from "./courseitem.controller";

let router = express.Router(),
    { NODE_ENV } = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    courseItemInstance = new courseItemController(loggerInstance, config);


router.route("/:id?").get(courseItemInstance.get.bind(courseItemInstance));
router.route("/:id").patch(courseItemInstance.patch.bind(courseItemInstance));
router.route("/").post(courseItemInstance.create.bind(courseItemInstance));

export default router;