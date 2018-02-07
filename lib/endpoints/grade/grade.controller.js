"use strict";

import grades from "./grade.model";
import {ResponseController} from "../../util/response.controller";

export class GradeController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.gradeModelInstance = grades;
    }

    gradeList(req, res) {
        this.gradeModelInstance.find()
            .then(grades => {
                this.loggerInstance.info("Grades list retrieved");
                res.json(new ResponseController(200, "Grades list retrieved successfully", grades));
            })
            .catch(err => {
                this.loggerInstance.error("DB error listing grades");
                res.json(new ResponseController(500, "Error listing grades"));
            });
    }
}