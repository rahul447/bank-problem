"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import { courseItemController } from "./courseItem.controller";

let router = express.Router(),
    { NODE_ENV } = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    courseItemInstance = new courseItemController(loggerInstance, config);


router.route("/:id?").get(courseItemInstance.get.bind(courseItemInstance));
router.route("/:id").patch(courseItemInstance.patch.bind(courseItemInstance));
router.route("/").post(courseItemInstance.createNewCourseItem.bind(courseItemInstance));
router.route("/:courseItemId/test").post(courseItemInstance.createTest.bind(courseItemInstance));
router.route("/:courseItemId/test/:testHolderId").patch(courseItemInstance.updateTest.bind(courseItemInstance));
router.route("/:courseItemId/test/:testHolderId").delete(courseItemInstance.deleteTest.bind(courseItemInstance));
router.route("/").put(courseItemInstance.put.bind(courseItemInstance));

export default router;