"use strict";

import express from "express";
import {getPackageControllerInstance} from "./package.controller";

let router = express.Router(),
    createPackageRoute = router.route("/createPackage"),
    listPackageRoute = router.route("/listPackage"),
    deletePackageRoute = router.route("/deletePackage/:id"),
    getPackageListCountRoute = router.route("/getPackageListCount"),
    basicInfoSaveRoute = router.route("/basicInfoSave"),
    getCourseByPackageRoute = router.route("/getCourseByPackage/:id"),
    getPackageBasicInfoRoute = router.route("/getPackageBasicInfo/:id"),
    savePackageInfoDetailsRoute = router.route("/savePackageInfoDetails/:id"),
    linkselectedCoursesToPackageRoute = router.route("/linkselectedCoursesToPackage/:id"),
    courseCountPerPackageRoute = router.route("/courseCountPerPackage/:id"),
    removeCourseFromPackageRoute = router.route("/removeCourseFromPackage/:id"),
    addCourseItemToPackageRoute = router.route("/addCourseItemToPackage/:packageId/:courseId"),
    packageInstance = getPackageControllerInstance();

createPackageRoute.post(packageInstance.createPackage.bind(packageInstance));
listPackageRoute.get(packageInstance.listPackage.bind(packageInstance));
getPackageListCountRoute.get(packageInstance.getPackageListCount.bind(packageInstance));
deletePackageRoute.delete(packageInstance.deletePackage.bind(packageInstance));
basicInfoSaveRoute.post(packageInstance.basicInfoSave.bind(packageInstance));
getCourseByPackageRoute.get(packageInstance.getCourseByPackage.bind(packageInstance));
getPackageBasicInfoRoute.get(packageInstance.getPackageBasicInfo.bind(packageInstance));
savePackageInfoDetailsRoute.post(packageInstance.savePackageInfoDetails.bind(packageInstance));
linkselectedCoursesToPackageRoute.post(packageInstance.linkselectedCoursesToPackage.bind(packageInstance));
courseCountPerPackageRoute.get(packageInstance.courseCountPerPackage.bind(packageInstance));
removeCourseFromPackageRoute.delete(packageInstance.removeCourseFromPackage.bind(packageInstance));
addCourseItemToPackageRoute.post(packageInstance.addCourseItemToPackage.bind(packageInstance));
export default router;