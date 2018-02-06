"use strict";

import chapters from "./chapter.model";
import {ResponseController} from "../../util/response.controller";

export class ChapterController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.chapterModelInstance = chapters;
    }

    chapterListBySubject(req, res) {
        let subjectId = req.query.subjectId;
        if (!subjectId) {
            this.loggerInstance.debug("No subject ID passed");
            return res.json(new ResponseController(400, "Subject ID is Mandatory"));
        }
        this.chapterModelInstance.find({'subject.id': subjectId})
            .then(chapters => {
                this.loggerInstance.info("Chapter list retrieved");
                return res.json(new ResponseController(200, "Chapter list retrieved successfully", chapters));
            })
            .catch(err => {
                this.loggerInstance.error("DB error listing chapters");
                res.json(new ResponseController(500, "Error listing chapters"));
            });
    }
}