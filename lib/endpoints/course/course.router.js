"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {CourseController} from "./course.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    getCourseRoute = router.route("/getCourse/:id?"),
    getCourseHeaderRoute = router.route("/getCourseHeader/:id"),
    createCourseRoute = router.route("/createCourse"),
    getCourseImagesRoute = router.route("/getCourseImages"),
    updateCourseRoute = router.route("/updateCourse/:id"),
    putCourseRoute = router.route("/updateCourse/:id"),
    getCourseListingRoute = router.route("/getCourseListing"),
    getCourseTestItemsRoute = router.route("/getCourseTestItems/:id"),
    courseInstance = new CourseController(loggerInstance, config);

getCourseRoute.get(courseInstance.getCourse.bind(courseInstance));
getCourseHeaderRoute.get(courseInstance.getCourseHeader.bind(courseInstance));
createCourseRoute.post(courseInstance.createCourse.bind(courseInstance));
updateCourseRoute.patch(courseInstance.patchCourse.bind(courseInstance));
putCourseRoute.put(courseInstance.putCourse.bind(courseInstance));
getCourseImagesRoute.get(courseInstance.getCourseImages.bind(courseInstance));
getCourseListingRoute.get(courseInstance.getCourseListing.bind(courseInstance));
getCourseTestItemsRoute.get(courseInstance.getCourseTestItems.bind(courseInstance));

export default router;