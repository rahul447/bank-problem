"use strict";

import express from "express";
import { getOrgCenterControllerInstance } from "./orgCenter.controller";

let router = express.Router(),
    orgCenterInstance = getOrgCenterControllerInstance();

router.route("/:id?").get(orgCenterInstance.get.bind(orgCenterInstance));
router.route("/").post(orgCenterInstance.create.bind(orgCenterInstance));
router.route("/:id").patch(orgCenterInstance.update.bind(orgCenterInstance));

export default router;