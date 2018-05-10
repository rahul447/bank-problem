"use strict";

import audios from "./audio.model";
import {ResponseController} from "../../util/response.controller";
import mongoose from "mongoose";
import {_} from "lodash";

export class AudioController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.audiosModelInstance = audios;
    }

    saveAudioDetails(req, res) {
        let reqBody = req.body;
        let reqQuery = req.query;

        if(reqQuery.id) {
            this.updateNewAudio(reqBody, reqQuery, res);
        } else {
            this.saveNewAudio(reqBody, reqQuery, res);
        }
    }

    saveNewAudio(reqBody, reqQuery, res) {
        reqBody.content = JSON.parse(reqBody.content);
        reqBody.content.map((con) => {
            con.data = {};
            con.data.audios = con.audios;
            Reflect.deleteProperty(con, 'audios');
        });

        let AudioObj = {};
        AudioObj.content = reqBody.content;
        AudioObj.via = reqQuery.via;
        AudioObj.status = reqBody.status;
        reqBody.subjects ? AudioObj.subjects = reqBody.subjects: '';

        let audio = new this.audiosModelInstance(AudioObj);

        audio.save((err, doc) => {
            if (err) {
                this.loggerInstance.error("Error creating newAudio");
                return res.json({status: 500, data: err});
            }
            this.loggerInstance.info("Audio created successfully");
            return res.json({status: 200, data: doc._id});
        });
    }

    updateNewAudio(reqBody, reqQuery, res) {
        reqBody.content = JSON.parse(reqBody.content);
        ((that) => {
            reqBody.content.map((con) => {
                con.data = {};
                con.data.audios = con.audios;
                Reflect.deleteProperty(con, 'audios');
            });

            let conditions = { _id: mongoose.Types.ObjectId(reqQuery.id) }
                , update = { $push: { content: { $each: reqBody.content } } }
                , options = { multi: false };

            that.audiosModelInstance.update(conditions, update, options, callback);

            function callback (err, numAffected) {
                if (err) {
                    that.loggerInstance.error("Error Audio in New Locale");
                    return res.json({status: 500, data: err});
                }
                that.loggerInstance.info(`Success audio in New Locale ${numAffected}`);
                return res.json({status: 200, data: numAffected});
            }
        })(this);
    }

    updateAudioClone(oldObj, bodyObj) {
        if(bodyObj.content)
            bodyObj.content = JSON.parse(bodyObj.content);

        return new Promise((resolve, reject) => {
            ((that) => {
                if (oldObj.constructor.name === 'model') {
                    oldObj = oldObj.toObject()
                }

                let cloneObj = _.pick(oldObj, ['_id']);
                let tailoredObj = Object.assign({}, oldObj.draftId, bodyObj);
                tailoredObj = _.omit(tailoredObj, ["_id", "draftId"]);
                tailoredObj.publishId = cloneObj._id;
                tailoredObj.status = "DRAFT";

                that.audiosModelInstance.findOneAndUpdate({_id: oldObj.draftId}, tailoredObj,
                    {new: true, upsert: true, setDefaultsOnInsert: true}, function(err) {
                        if(err) {
                            that.loggerInstance.error(`Audio Clone Update error ${err}`);
                            reject(err);
                        }
                        that.loggerInstance.info(`Audio Clone Update success`);
                        resolve();
                    });
            })(this);
        });
    }

    createAudioClone(oldObj, bodyObj) {
        if(bodyObj.content)
            bodyObj.content = JSON.parse(bodyObj.content);

        return new Promise((resolve, reject) => {
            let cloneObj = _.pick(oldObj, ['_id']);
            if (oldObj.constructor.name === 'model') {
                oldObj = oldObj.toObject()
            }

            let tailoredObj = Object.assign({}, oldObj, bodyObj);
            tailoredObj = _.omit(tailoredObj, "_id");
            tailoredObj.publishId = cloneObj._id;
            tailoredObj.status = "DRAFT";
            let audio = new this.audiosModelInstance(tailoredObj);
            ((that) => {
                audio.save()
                .then(function(audio) {
                    that.loggerInstance.info(`Audio Clone saved successfully ${audio._id}`);
                    resolve(audio);
                })
                .catch(function(err) {
                    that.loggerInstance.error(`Audio Clone saved error ${err}`);
                    reject(err);
                })
            })(this);
        });
    }

    editAudio(req, res){
        let id = req.query.draftId ? req.query.draftId : req.query.id;
        console.log("typeof id : ", typeof id, id, req.query);
        ((that) => {
            that.audiosModelInstance.findOne({ _id: mongoose.Types.ObjectId(id)}).lean()
            .then(function (newObj) {
                return new Promise((resolve, reject) => {
                    if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                        that.createAudioClone(newObj, req.body)
                        .then((cloneAudio) => {
                            newObj.draftId = cloneAudio._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Audio Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                        that.updateAudioClone(newObj, req.body)
                        .then(() => {
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Audio Clone Updation Error ${err}`);
                            reject(err);
                        });
                    } else {
                        req.body.content = JSON.parse(req.body.content);
                        resolve(req.body);
                    }
                });
            })
            .then(function(newObj) {
                let conditions = { _id: mongoose.Types.ObjectId(id) };
                that.audiosModelInstance.findOneAndUpdate(conditions,newObj,{new:true})
                .then(function(audioObj){
                    that.loggerInstance.info(`Success audio in New Locale`);
                    return res.json(new ResponseController(200, "audio updated",audioObj));
                })
                .catch(function(err){
                    that.loggerInstance.info(`DB Error`);
                    return res.json(new ResponseController(200, "audio updated",err));
                });
            })
        })(this);
    }

    getAudioNamesById(audioIdsArr) {
        return new Promise((resolve, reject) => {
            this.audiosModelInstance.aggregate([
                {
                    "$match": {
                        "_id": {$in: audioIdsArr}
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: {$arrayElemAt: ["$content", 0]},
                        via: 1
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: "$name.title",
                        via: 1
                    }
                }
            ])
            .then(function (docs) {
                console.log("docs : ", docs);
                resolve(docs);
            }).catch(err => {
                reject(err);
            });

        });
    }

    getAudio(req, res){
        let audioId = req.query.draftId ? req.query.draftId : req.params.id;
        ((that)=>{
            that.audiosModelInstance.findOne({_id:audioId})
            .populate('subjects.subjectId', 'name')
            .populate('subjects.chapters.chapterId', 'name')
            .populate('subjects.chapters.concepts.conceptId', 'name')
            .lean()
            .then(function(audioObj){
                if(audioObj){
                    audioObj.content.map((content)=>{
                        content.data.audios.map((audio) => {
                            let initSplit = audio.fileS3Location.split("/");
                            let fileName = initSplit[initSplit.length-1].split("-")[2];
                            audio.fileName = fileName;
                            //return audio;
                        });
                    })
                    that.loggerInstance.info("Audio found successfully");
                    return res.json(new ResponseController(200, "Audio found successfully",audioObj));
                }
                else{
                    that.loggerInstance.info("Audio not found");
                    return res.json(new ResponseController(500, "Audio not found"));
                }
            })
            .catch(function(err){
                that.loggerInstance.error("DB Error finding audio");
                return res.json(new ResponseController(500, "DB Error finding audio",err));
            })
        })(this)
    }

    updateAudioTags(req, res) {
        ((that) => {
            let id = req.query.draftId ? req.query.draftId : req.params.id;
            that.audiosModelInstance.findOne({ _id: mongoose.Types.ObjectId(id)})
            .populate('draftId')
            .then(function (newObj) {
                return new Promise((resolve, reject) => {
                    if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                        that.createAudioClone(newObj, req.body)
                        .then((cloneAudio) => {
                            newObj.draftId = cloneAudio._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Audio Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                        that.updateAudioClone(newObj, req.body)
                        .then(() => {
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Audio Clone Updation Error ${err}`);
                            reject(err);
                        });
                    } else {
                        newObj.tags = [...new Set(newObj.tags ? newObj.tags.concat(req.body.tags) :
                            req.body.tags)];
                        resolve(newObj);
                    }
                });
            })
            .then(function(newObj) {
                let conditions = { _id: mongoose.Types.ObjectId(id) };
                that.audiosModelInstance.findOneAndUpdate(conditions,newObj,{new:true})
                .then(function(audioObj){
                    that.loggerInstance.info(`Success audio Tag update`);
                    return res.json(new ResponseController(200, "audio updated",audioObj));
                })
                .catch(function(err){
                    that.loggerInstance.error(`DB Error`);
                    return res.json(new ResponseController(200, "audio updated",err));
                });
            })
        })(this);
    }

    publishAudio(audioId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.audiosModelInstance.findOne({ _id: audioId }).
                populate('draftId').
                exec(function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting Audio ${err}`);
                        reject(err);
                    } else {
                        if(doc.draftId) {
                            doc.content = doc.draftId.content;
                            doc.tags = doc.draftId.tags;
                            that.deleteAudio(doc.draftId._id)
                                .then(() => {
                                    doc.draftId = undefined;
                                    that.loggerInstance.info("Draft Audio Deleted");
                                    doc.save(function (err) {
                                        if(err) {
                                            that.loggerInstance.error(`Audio Save Failed ${err}`);
                                            reject(err);
                                        }
                                        resolve();
                                    });
                                });
                        } else {
                            doc.status = "PUBLISHED";
                            doc.save(function (err) {
                                if(err) {
                                    that.loggerInstance.error(`Audio Save Failed ${err}`);
                                    reject(err);
                                }
                                resolve();
                            });
                        }
                    }
                });
            })(this);
        });
    }

    deleteAudio(audioId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.audiosModelInstance.findById(audioId, function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting audio ${err}`);
                        reject(err);
                    } else {
                        doc.status = "DELETED";
                        doc.save(function (err) {
                            if(err) {
                                that.loggerInstance.error(`audio Soft Delete Failed ${err}`);
                                reject(err);
                            }
                            resolve();
                        });
                    }
                });
            })(this);
        });
    }

    updateAudioConcept(req, res) {
        const id = req.query.draftId ? req.query.draftId : req.params.id;

        this.audiosModelInstance.findOne({ _id: mongoose.Types.ObjectId(id)})
        .populate('draftId')
        .then(newObj => {
            return new Promise(async (resolve, reject) => {
                if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                    let cloneAudio = await this.createAudioClone(newObj, req.body);
                    newObj.draftId = cloneAudio._id;
                    resolve(newObj);
                } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                    this.updateAudioClone(newObj, req.body)
                    .then(() => {
                        resolve(newObj);
                    })
                    .catch(err => {
                        this.loggerInstance.error(`Audio Clone Updation Error ${err}`);
                        reject(err);
                    });
                } else {
                    newObj.subjects = req.body.subjects;
                    resolve(newObj);
                }
            });
        })
        .then(newObj => {
            let conditions = { _id: mongoose.Types.ObjectId(id) };
            this.audiosModelInstance.findOneAndUpdate(conditions, newObj, { new: true })
            .then(audioObj => {
                this.loggerInstance.info(`Success audio Concept update`);
                return res.json(new ResponseController(200, "audio updated",audioObj));
            })
            .catch(err => {
                this.loggerInstance.error(`DB Error`);
                return res.json(new ResponseController(200, "audio updated",err));
            });
        });
    }
}