"use strict";

import videos from "./video.model";
import {ResponseController} from "../../util/response.controller";
import mongoose from "mongoose";

export class VideoController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.videosModelInstance = videos;
    }

    saveVideoDetails(req, res) {
        console.log("req.body : ", req.body);
    }
}