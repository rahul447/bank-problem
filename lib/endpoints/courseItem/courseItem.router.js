"use strict";

import express from "express";
import { getcourseItemControllerInstance } from "./courseItem.controller";

let router = express.Router(),
    courseItemInstance = getcourseItemControllerInstance();

router.route("/:id?").get(courseItemInstance.get.bind(courseItemInstance));
router.route("/:id").patch(courseItemInstance.patch.bind(courseItemInstance));
router.route("/").post(courseItemInstance.createNewCourseItem.bind(courseItemInstance));
router.route("/:courseItemId/test").post(courseItemInstance.createTest.bind(courseItemInstance));
router.route("/:courseItemId/test/:testHolderId").patch(courseItemInstance.updateTest.bind(courseItemInstance));
router.route("/:courseItemId/test/:testHolderId").delete(courseItemInstance.deleteTest.bind(courseItemInstance));
router.route("/").put(courseItemInstance.put.bind(courseItemInstance));

export default router;