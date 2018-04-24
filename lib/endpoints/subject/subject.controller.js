"use strict";

import subjects from "./subject.model";
import {ResponseController} from "../../util/response.controller";
import elasticInstance from "../../util/elasticDb";

export class SubjectController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.subjectModelInstance = subjects;
        this.elasticInstance = elasticInstance;
    }

    subjectListByGrade(req, res) {
        // let gradeId = req.query.gradeId;
        // if (!gradeId) {
        //     return res.json({
        //         'status': '500',
        //         'message': "Grade ID is Mandatory"
        //     });
        // }
        this.subjectModelInstance.find(
            // {'grade.id': gradeId}
            )
            .then(subjects => res.json({
                'status': '200',
                'message': 'Subjects list retrieved successfully',
                'data': subjects
            })).catch(() => res.json({
                'status': '500',
                'message': 'Error listing subjects'
            }));
    }

    subjectAdd(req, res){
        let subject = new this.subjectModelInstance(req.body);
        ((that) => {
            subject.save()
            .then(async (subject) => {
                that.loggerInstance.info("Subject saved successfully");
                await this.pushSubjectToElastic(subject);
                return res.json(new ResponseController(200, "Subject saved successfully", subject._id));
            })
            .catch(function(err) {
                that.loggerInstance.error("DB Error saving subject");
                return res.json(new ResponseController(500, "Error saving subject",err));
            })
        })(this)


    }

    async pushSubjectToElastic(subject) {
        const subBody = (({ _id, name }) => ({ subjectId: _id, name }))(subject);
        return new Promise(async (resolve) => resolve(await this.elasticInstance.addDocToIndex
        ('cms-subjects', 'cms-subjects', subBody)));
    }

    subjectEdit(req, res){
        let subject = new this.subjectModelInstance(req.body);
        ((that) => {
            this.subjectModelInstance.findOneAndUpdate({_id:subject._id},subject,{new: true})
            .then(async function(newObj){
                that.loggerInstance.info("Subject updated successfully");
                await that.updateSubjectInIndex(subject);
                return res.json(new ResponseController(200, "Subject updated successfully",newObj));
            })
            .catch(function(err){
                that.loggerInstance.error("DB Error saving subject");
                return res.json(new ResponseController(500, "Error updating subject",err));
            })
        })(this)
    }

    async updateSubjectInIndex(subject) {
        const subBody = (({ name, _id }) => ({ name, _id }))(subject);

        let doc = {};
        for(let prop in subBody) {
            doc[prop] = subBody[prop];
        }

        ['cms-subjects-chapters', 'cms-subjects-chapters-concepts'].map(indexes => {
            this.elasticInstance.getElasticInstance().update({
                index: indexes,
                type: indexes,
                id: {
                    "query": {
                        "wildcard": {
                            "_id": { "value": `*${subBody._id}*` }
                        }
                    }
                },
                body: {
                    // put the partial document under the `doc` key
                    doc: doc
                }
            }, (error, response) => {
                //
            });
        });
        return await this.elasticInstance.updateDocInIndex('cms-subjects', 'cms-subjects', subBody._id, subBody);

    }

    subjectDelete(req,res){
        if(!req.body.subjectId){
            this.loggerInstance.error("Id null");
            return res.json(new ResponseController(500, "Id null"));
        }
        else{
            ((that) => {
                this.subjectModelInstance.findOneAndRemove({_id:req.body.subjectId})
                .then(async function(newObj){
                    await that.deleteSubjectFromIndex(req.body.subjectId);
                    that.loggerInstance.info("Subject deleting successfully");
                    return res.json(new ResponseController(200, "Subject deleted successfully",newObj));
                })
                .catch(function(err){
                    that.loggerInstance.error("DB Error deleting subject");
                    return res.json(new ResponseController(500, "Error deleting subject",err));
                })
            })(this)
        }
    }

    async deleteSubjectFromIndex(id) {
        ['cms-subjects-chapters', 'cms-subjects-chapters-concepts'].map(indexes => {
            this.elasticInstance.getElasticInstance().delete({
                index: indexes,
                type: indexes,
                id: {
                    "query": {
                        "wildcard": {
                            "_id": { "value": `*${id}*` }
                        }
                    }
                },
            }, (error, response) => {
                //
            });
        });

        return await this.elasticInstance.deleteDocFromIndex('cms-subjects', 'cms-subjects', id)
    }

    get(req, res) {
        if (req.params.id) {
            this.getById(req.params.id, res);
        } else {
            // let limit = req.query.limit ? Number(req.query.limit) : 30;
            // let skip = req.query.page ? limit * Number(req.query.page) : 0;
            this.subjectModelInstance.find()
                // .skip(skip).limit(limit)
                .then(subjects => {
                    this.loggerInstance.info("Retrieved subjects list");
                    res.json(new ResponseController(200, "Subjects list retrieved successfully", subjects));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing subjects");
                    res.json(new ResponseController(500, "Error listing subjects"));
                });
        }
    }

    getById(id, res) {
        this.subjectModelInstance.findById(id)
            .then(subject => {
                if (!subject) {
                    this.loggerInstance.debug("Subject not found");
                    res.json(new ResponseController(404, "Not found subject with given ID"));
                }
                this.loggerInstance.info("Retrieved subject list");
                res.json(new ResponseController(200, "Subject list retrieved successfully", subject));
            })
            .catch(() => {
                this.loggerInstance.debug("DB error getting subject");
                res.json(new ResponseController(500, "Error getting subject"));
            });
    }

    async getSubjectsFromElastic(req, res) {

        const searchBody = {
            "query": {
                "match_all": {}
            }
        };

        const subjectList = await this.elasticInstance.searchIndex('cms-subjects', searchBody);
        return res.json({
            status:200,
            message: `Subjects from Elastic`,
            data: subjectList.hits.hits
        })
    }
}