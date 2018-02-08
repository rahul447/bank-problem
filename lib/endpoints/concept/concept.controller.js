"use strict";

import concepts from "./concept.model";
import {ResponseController} from "../../util/response.controller";
import mongoose from "mongoose";

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

    fetchConceptIdsByChapter(req, res) {
        let chapterSet = req.body.chapterSet;

        if (!chapterSet) {
            this.loggerInstance.debug("No chapter IDs passed");
            return res.json(new ResponseController(400, "Chapter IDs is mandatory"));
        }
        chapterSet = chapterSet.map((chapter) => {
            return mongoose.Types.ObjectId(chapter);
        });

        ((that) => {
            that.conceptModelInstance.aggregate([
                {
                    "$match": {
                        "chapter.id": {
                            "$in": chapterSet
                        }
                    }
                },
                {
                    "$group": {
                        "_id": "$chapter.id",
                        "concepts": {
                            "$push": {
                                "id": "$_id",
                                "name": "$name"
                            }
                        }
                    }
                }
            ]).exec(function (err, data) {
                if (err) {
                    console.log("err : ", err);
                    that.loggerInstance.error("fetchConceptIdsByChapter DB Error");
                    return res.json(new ResponseController(err.statusCode,
                        "fetchConceptIdsByChapter DB Error", err));
                }
                return res.json(new ResponseController(200, "fetchConceptIdsByChapter " +
                    "Success",data));
            });
        })(this);
    }
}