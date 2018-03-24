"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import { courseSyllabusController } from "./courseSyllabus.controller";

let router = express.Router(),
    { NODE_ENV } = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    courseSyllInstance = new courseSyllabusController(loggerInstance, config);


router.route("/getSubjects/:courseId").get(courseSyllInstance.getSubjects.bind(courseSyllInstance));
router.route("/getChapters/:courseId/:subjectId").get(courseSyllInstance.getChapters.bind(courseSyllInstance));
router.route("/getConcepts/:courseId/:subjectId/:chapterId").get(courseSyllInstance.getConcepts.bind(courseSyllInstance));
router.route("/getConceptDetails/:conceptId/:courseName").get(courseSyllInstance.getConceptDetail.bind(courseSyllInstance));
router.route("/getAllPartially/:courseId?").get(courseSyllInstance.getAllPartially.bind(courseSyllInstance));
router.route("/getAll/:courseId").get(courseSyllInstance.getAll.bind(courseSyllInstance));
router.route("/:courseId").delete(courseSyllInstance.deleteCourseSyllabusItem.bind(courseSyllInstance));
router.route("/:courseId").patch(courseSyllInstance.patchCourseSyllabusItem.bind(courseSyllInstance));
router.route("/").post(courseSyllInstance.createCourseSyllabusItem.bind(courseSyllInstance));
router.route("/subjectDetails").post(courseSyllInstance.getSubjectDetails.bind(courseSyllInstance));

export default router;