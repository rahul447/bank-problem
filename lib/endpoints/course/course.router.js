"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {CourseController} from "./course.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    getCourseRoute = router.route("/getCourse/:id?"),
    createCourseRoute = router.route("/createCourse"),
    updateCourseRoute = router.route("/updateCourse/:id"),
    putCourseRoute = router.route("/updateCourse/:id"),
    courseInstance = new CourseController(loggerInstance, config);

getCourseRoute.get(courseInstance.getCourse.bind(courseInstance));
createCourseRoute.post(courseInstance.createCourse.bind(courseInstance));
updateCourseRoute.patch(courseInstance.patchCourse.bind(courseInstance));
putCourseRoute.put(courseInstance.putCourse.bind(courseInstance));

export default router;