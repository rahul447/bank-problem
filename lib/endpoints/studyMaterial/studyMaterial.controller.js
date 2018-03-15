"use strict";

import studyMaterial from "./studyMaterial.model";
import {ResponseController} from "../../util/response.controller";

export class StudyMaterialController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = studyMaterial;
    }

    getStudyMaterial(req, res) {
        if (req.params.id){
            this.getStudyMaterialById(req.params.id, res);
        } else {
            this.modelInstance.find()
                .then(materials => {
                    this.loggerInstance.info("Retrieved Study Material list");
                    res.json(new ResponseController(200, "Study Material list retrieved successfully", materials));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing Study Material");
                    res.json(new ResponseController(500, "Error listing Study Material"));
                });
        }
    }
    getStudyMaterialById(id, res) {
        this.modelInstance.findById(id)
            .then(material => {
                if (!material) {
                    this.loggerInstance.debug("Study Material not found");
                    res.json(new ResponseController(404, "Not found Study Material with given ID"));
                }
                this.loggerInstance.info("Retrieved Study Material list");
                res.json(new ResponseController(200, "Study Material list retrieved successfully", material));
            })
            .catch(() => {
                this.loggerInstance.debug("DB error listing Study Material");
                res.json(new ResponseController(500, "Error listing Study Material"));
            });
    }
    createStudyMaterial(req, res){
        let newMaterial= new this.modelInstance(req.body);
        newMaterial.save().then(material => {
            this.loggerInstance.info("Study Material created successfully");
            return res.json(new ResponseController(200, "Study Material created successfully", material));
        }).catch(err => {
            this.loggerInstance.error("Error creating Study Material");
            return res.json(new ResponseController(500, "Error creating Study Material", err));
        })
    }
    updateStudyMaterial(req, res){
        delete req.body._id;
        let id = req.params.id;
        if (!id){
            this.loggerInstance.debug("No ID specified");
            return res.json(new ResponseController(400, "No ID specified"));
        }
        let newMaterial = req.body;
        newMaterial.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newMaterial, {
            new: true
        }).then(response => {
            if (!response) {
                this.loggerInstance.debug("Study Material not found");
                res.json(new ResponseController(404, "Not found Study Material with given ID"));
            }
            this.loggerInstance.info("Study Material updated successfully");
            res.json(new ResponseController(200, "Study Material Updated", response));
        }).catch(err => {
            this.loggerInstance.error("DB error updating Study Material");
            res.json(new ResponseController(500, "Unable to update Study Material", err));
        });
    }

    getMaterialNamesById(materialIdsArr) {
        return new Promise((resolve, reject) => {
            ((that) => {
                this.modelInstance.aggregate([
                    {
                        "$match": {
                            "_id": { $in: materialIdsArr }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: { $arrayElemAt: [ "$content", 0 ] },
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: "$name.title",
                        }
                    }
                ])
                .then(function (docs) {
                    resolve(docs);
                }).catch(err => {
                    reject(err);
                });
            })(this);
        });
    }

    publishMaterial(req, res, materialId) {
        console.log("materialId : ", materialId);
        return new Promise((resolve, reject) => {
            this.modelInstance.findById(materialId)
                .then(material => {
                    this.checkValidity(material)
                        .then((data) => {
                            console.log("data : ", data);
                            if(data.length === 0) {
                                this.loggerInstance.info("Question Validity check Success");
                                this.changeStatusByQuestion(questionId, "PUBLISHED")
                                    .then(() => {
                                        resolve();
                                    })
                                    .catch((err) => {
                                        this.loggerInstance.error(`Question Status change Failed ${err}`);
                                        reject(err);
                                    })
                            } else {
                                this.loggerInstance.info("Question Validity check Done");
                                resolve(data);
                            }
                        })
                        .catch((err) => {
                            this.loggerInstance.error(`Question Validity check Failed ${err}`);
                            reject(err);
                        });
                })
                .catch((err) => {
                    this.loggerInstance.error(`DB error getting question ${err}`);
                    reject(err);
                });
        });
    }

    checkValidity(question) {

        let status = [];
        return new Promise((resolve) => {
            let quesType;

            for (let key in question) {

                if(key === "questionType") {
                    quesType = question[key];
                }

                if(key === 'conceptId' && question[key].length === 0) {
                    status.push(" conceptId ");
                }

                if(key === 'content') {

                    question[key].map((contentVal) => {
                        if(contentVal.questionContent.length === 0){
                            status.push(" questionContent ");
                        }
                        if(contentVal.solutionContent.length === 0){
                            status.push(" solutionContent ");
                        }

                        if(contentVal.correctAnswer.data.length === 0){
                            status.push(" correctAnswer ");
                        }

                        switch (quesType) {
                            case 'MCQ':
                                if(contentVal.optionsContent.length === 0){
                                    status.push(" optionsContent ");
                                }
                                break;
                            case 'Integer':

                                break;
                            case 'Matrix':
                                if((!contentVal.matrixOptionContent.optionRight || contentVal.matrixOptionContent.optionRight.length < 2) || (!contentVal.matrixOptionContent.optionLeft || contentVal.matrixOptionContent.optionLeft.length < 2)) {
                                    status.push(" matrixOptionContent ");
                                } else if (contentVal.matrixOptionContent.optionLeft.length >
                                    contentVal.correctAnswer.data.length) {
                                    status.push(" matrixOptionContent ");
                                }
                                break;
                            case 'Numerical':
                                if(contentVal.correctAnswer.data.length === 0 ||
                                    (!contentVal.correctAnswer.data.every(d =>
                                        d.hasOwnProperty("tolerance")))) {
                                    status.push(" Tolerance ");
                                }
                                break;
                            case 'True-False':

                                break;
                            case 'Blanks':

                                break;
                            case 'Descriptive':

                                break;
                            default:

                        }
                    });
                }
            }
            resolve(status);
        });

    }
}