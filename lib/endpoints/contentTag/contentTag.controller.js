"use strict";

import contentTag from "./contentTag.model";
import { ResponseController } from "../../util/response.controller";
import {AudioController} from "../audio/audio.controller";
import {FormulaController} from "../formula/formula.controller";
import {QuestionController} from "../question/question.controller";
import {StudyMaterialController} from "../studyMaterial/studyMaterial.controller";
import {TestController} from "../test/test.controller";
import {VideoController} from "../video/video.controller";
import mongoose from "mongoose";

export class ContentTagController {

    constructor(parameters) {
        let { loggerInstance, config } = parameters;
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = contentTag;
    }

    get(req, res){
        if (req.params.id) {
            this.getById(req.params.id, res);
        } else {
            let limit = req.query.limit ? Number(req.query.limit) : 30;
            let skip = req.query.page ? limit * Number(req.query.page) : 0;
            this.modelInstance.find().skip(skip).limit(limit)
                .then(tags => {
                    this.loggerInstance.info("Retrieved content tags list");
                    res.json(new ResponseController(200, "Content tags list retrieved successfully", tags));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing content tags");
                    res.json(new ResponseController(500, "Error listing content tags"));
                });
        }
    }

    getById(id, res){
        this.modelInstance.findById(id)
            .then(tag => {
                if (!tag) {
                    this.loggerInstance.debug("Content tag not found");
                    res.json(new ResponseController(404, "Not found content tag with given ID"));
                }
                this.loggerInstance.info("Retrieved content tag list");
                res.json(new ResponseController(200, "Content tag list retrieved successfully", tag));
            })
            .catch(() => {
                this.loggerInstance.debug("DB error getting content tag");
                res.json(new ResponseController(500, "Error getting content tag"));
            });
    }

    create(req, res) {
        let tag = new this.modelInstance(req.body);
        tag.save().then(tag => {
            this.loggerInstance.info("Content tag created successfully");
            return res.json(new ResponseController(200, "Content tag created successfully", tag));
        }).catch(err => {
            this.loggerInstance.error("Error creating Content Tag");
            return res.json(new ResponseController(500, "Error creating content tag", err));
        })
    }

    patch(req, res) {
        delete req.body._id;
        let id = req.params.id;
        let newContentTag = req.body;
        newContentTag.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newContentTag, {
                new: true
        }).then(response => {
            if (!response) {
                this.loggerInstance.debug("Content tag not found");
                res.json(new ResponseController(404, "Not found content tag with given ID"));
            }
            this.loggerInstance.info("Content tag updated successfully");
            res.json(new ResponseController(200, "Content tag Updated", response));
        }).catch(err => {
            this.loggerInstance.error("DB error updating content tag");
            res.json(new ResponseController(500, "Unable to update content tag", err));
        });
    }

    delete(req, res) {
        let id = req.params.id;
        this.modelInstance.findByIdAndRemove(id)
            .then(data => {
                if (!data) {
                    this.loggerInstance.debug("Content tag not found");
                    return res.json(new ResponseController(404, "Content tag not found"));
                }
                this.loggerInstance.info("Content tag deleted successfully");
                return res.json(new ResponseController(200, "Content tag deleted successfully", data));
            }).catch(err => {
                this.loggerInstance.error("Error deleting content tag");
                return res.json(new ResponseController(500, "Error deleting content tag", err));
            });
    }

    static getCollectionByTag(tag) {
        let ControllerObj;
        if(tag === "audio") {
            ControllerObj = new AudioController(this.loggerInstance, this.config)
        } else if (tag === "video") {
            ControllerObj = new VideoController(this.loggerInstance, this.config)
        } else if (tag === "formula") {
            ControllerObj = new FormulaController(this.loggerInstance, this.config)
        } else if (tag === "test") {
            ControllerObj = new TestController(this.loggerInstance, this.config)
        } else if (tag === "question") {
            ControllerObj = new QuestionController(this.loggerInstance, this.config)
        } else if (tag === "studyMaterial") {
            ControllerObj = new StudyMaterialController(this.loggerInstance, this.config)
        }

        return ControllerObj;
    }

    static mapValues(tagArr) {
        let nameMap = new Map();
        let promises = [];
        return new Promise((resolve) => {
            this.completeTagPromises(tagArr, promises, nameMap);

            Promise.all(promises).then(() => {
                tagArr.map(tag => {
                    let newObj = [];
                    if(tag.type && ['question', 'test', 'video', 'audio', 'studyMaterial', 'formula', 'file'].includes(tag.type)) {
                        if(["video", "audio"].includes(tag.type)) {
                            tag.values.map(val => {
                                newObj.push({id: val, value: nameMap.get(val.toString()).name, via: nameMap.get(val.toString()).via});
                            });
                        } else {
                            tag.values.map(val => {
                                newObj.push({id: val, value: nameMap.get(val.toString())});
                            });
                        }

                        tag.values = newObj;
                    }
                });
                resolve();
            });
        });
    }

    static completeTagPromises(tagArr, promises, nameMap) {
        tagArr.map((tag) => {
            if (tag && ['question', 'test', 'video', 'audio', 'studyMaterial', 'formula', 'file'].includes(tag.type)) {
                let tagControllerObject = ContentTagController.getCollectionByTag(tag.type);
                tag.values = tag.values.map((val) => mongoose.Types.ObjectId(val));
                if (tag.type === "audio") {
                    promises.push(new Promise((resolve) => {
                        tagControllerObject.getAudioNamesById(tag.values)
                            .then((data) => {
                                data.map(d => {
                                    nameMap.set(d._id.toString(), {name: d.name, via: d.via});
                                });
                                resolve();
                            });
                    }));
                } else if (tag.type === "video") {
                    promises.push(new Promise((resolve) => {
                        tagControllerObject.getVideolNamesById(tag.values)
                            .then((data) => {
                                data.map(d => {
                                    nameMap.set(d._id.toString(), {name: d.name, via: d.via});
                                });
                                resolve();
                            });
                    }));
                } else if (tag.type === "formula") {
                    promises.push(new Promise((resolve) => {
                        tagControllerObject.getFormulaNamesById(tag.values)
                            .then((data) => {
                                data.map(d => {
                                    nameMap.set(d._id.toString(), d.name);
                                });
                                resolve();
                            });
                    }));

                } else if (tag.type === "test") {
                    promises.push(new Promise((resolve) => {
                        tagControllerObject.getTestNamesById(tag.values)
                            .then((data) => {
                                data.map(d => {
                                    nameMap.set(d._id.toString(), d.name);
                                });
                                resolve();
                            });
                    }));
                } else if (tag.type === "question") {
                    promises.push(new Promise((resolve) => {
                        tagControllerObject.getQuestionNamesById(tag.values)
                            .then((data) => {
                                data.map(d => {
                                    nameMap.set(d._id.toString(), d.name);
                                });
                                resolve();
                            });
                    }));
                } else if (tag.type === "studyMaterial") {
                    promises.push(new Promise((resolve) => {
                        tagControllerObject.getMaterialNamesById(tag.values)
                            .then((data) => {
                                data.map(d => {
                                    nameMap.set(d._id.toString(), d.name);
                                });
                                resolve();
                            });
                    }));
                }
            }
        });
    }
}