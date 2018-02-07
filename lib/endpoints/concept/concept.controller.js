"use strict";

import concepts from "./concept.model";
import {ResponseController} from "../../util/response.controller";

export class ConceptController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.conceptModelInstance = concepts;
    }

    conceptListByChapter(req, res) {
        let chapterId = req.query.chapterId;
        if (!chapterId) {
            this.loggerInstance.debug("No chapter ID passed");
            return res.json(new ResponseController(400, "Chapter ID is mandatory"));
        }
        this.conceptModelInstance.find({'chapter.id': chapterId})
            .then(concepts => {
                this.loggerInstance.info("Concepts list retrieved");
                res.json(new ResponseController(200, "Concepts list retrieved successfully", data));
            })
            .catch(err => {
                this.loggerInstance.error("DB error listing concepts");
                res.json(new ResponseController(500, "Error listing concepts"));
            });
    }
}