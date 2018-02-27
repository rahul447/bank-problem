"use strict";

import {ResponseController} from "../../util/response.controller";

export class GradeController {

    constructor(loggerInstance, config, Grade) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.gradeModelInstance = Grade;
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

    getContentDashBoardFilter(req, res) {

        ((that) => {
            that.gradeModelInstance.aggregate([
                    {"$unwind": "$subjects"},
                    {"$unwind": "$subjects.chapters"},
                    {"$unwind": "$subjects.chapters.subsubject"},
                    {
                        "$group": {
                            "_id": {
                                "gradeId": "$_id",
                                "subjectId": "$subjects.id",
                                "subSubject": "$subjects.chapters.subsubject.id",
                            },
                            "gradeName": {"$first": "$name"},
                            "SubjectName": {"$first": "$subjects.name"},
                            "subSubjectName": {"$first": "$subjects.chapters.subsubject.name"},
                            "chapters": {
                                "$push": {
                                    "chapterId": "$subjects.chapters.id",
                                    "chapterName": "$subjects.chapters.name",
                                }
                            }
                        }
                    }
                ]
            ).exec(function (err, data) {
                if (err) {
                    that.loggerInstance.error("getContentDashBoardFilter DB Error");
                    return res.json(new ResponseController(err.statusCode,
                        "getContentListFilterStructureRoute DB Error", err));
                }
                return res.json(new ResponseController(200, "getContentDashBoardFilter " +
                    "Success",data));
            });
        })(this);
    }
    createGrade(req, res){
        let grade = new this.gradeModelInstance(req.body);
        ((that) => {
            grade.save()
            .then(function(grade) {
                that.loggerInstance.info("grade saved successfully");
                return res.json(new ResponseController(200, "grade saved successfully", grade._id));
            })
            .catch(function(err) {
                that.loggerInstance.error("DB Error saving grade");
                return res.json(new ResponseController(500, "Error saving grade",err));
            })
        })(this)
    }
}