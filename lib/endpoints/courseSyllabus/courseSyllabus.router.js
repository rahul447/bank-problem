"use strict";

import express from "express";
import { getcourseSyllabusControllerInstance } from "./courseSyllabus.controller";

let router = express.Router(),
    courseSyllInstance = getcourseSyllabusControllerInstance();


router.route("/getSubjects/:courseId").get(courseSyllInstance.getSubjects.bind(courseSyllInstance));
router.route("/getChapters/:courseId/:subjectId").get(courseSyllInstance.getChapters.bind(courseSyllInstance));
router.route("/getConcepts/:courseId/:subjectId/:chapterId").get(courseSyllInstance.getConcepts.bind(courseSyllInstance));
router.route("/getConceptDetails/:conceptId/:courseName").get(courseSyllInstance.getConceptDetail.bind(courseSyllInstance));
router.route("/getAllPartially/:courseId?").get(courseSyllInstance.getAllPartially.bind(courseSyllInstance));
router.route("/getAll/:courseId").get(courseSyllInstance.getAll.bind(courseSyllInstance));
router.route("/getFullCourseSyllabus/:courseId").get(courseSyllInstance.getCourseAndSyllabus.bind(courseSyllInstance));
router.route("/:courseId").delete(courseSyllInstance.deleteCourseSyllabusItem.bind(courseSyllInstance));
router.route("/:courseId").patch(courseSyllInstance.patchCourseSyllabusItem.bind(courseSyllInstance));
router.route("/").post(courseSyllInstance.createCourseSyllabusItem.bind(courseSyllInstance));
router.route("/getCourseSubjects").post(courseSyllInstance.getCourseSubjects.bind(courseSyllInstance));
router.route("/subjectDetails").post(courseSyllInstance.getSubjectDetails.bind(courseSyllInstance));

export default router;