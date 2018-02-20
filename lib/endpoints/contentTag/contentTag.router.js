"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {TagController} from "./tag.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    tagInstance = new TagController(loggerInstance, config);

export default router;