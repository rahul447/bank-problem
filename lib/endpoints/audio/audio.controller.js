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
        bodyObj.content = JSON.parse(bodyObj.content);
        return new Promise((resolve, reject) => {
            ((that) => {
                let cloneObj = _.pick(oldObj, ['_id']);
                let newClonedObj = _.omitBy(bodyObj, function(value, key) {
                    return key.startsWith("_id");
                });
                newClonedObj.publishId = cloneObj._id;
                newClonedObj.status = "DRAFT";

                that.audiosModelInstance.findOneAndUpdate({_id: oldObj.draftId}, newClonedObj,
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
        bodyObj.content = JSON.parse(bodyObj.content);
        return new Promise((resolve, reject) => {
            let cloneObj = _.pick(oldObj, ['_id']);
            let newClonedObj = _.omitBy(bodyObj, function(value, key) {
                return key.startsWith("_id");
            });
            newClonedObj.publishId = cloneObj._id;
            newClonedObj.status = "DRAFT";
            let audio = new this.audiosModelInstance(newClonedObj);
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
        ((that) => {
            that.audiosModelInstance.findOne({ _id: mongoose.Types.ObjectId(req.query.id)})
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
                let conditions = { _id: mongoose.Types.ObjectId(req.query.id) };
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
            that.audiosModelInstance.findOne({_id:audioId}).lean()
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
            that.audiosModelInstance.findOne({ _id: mongoose.Types.ObjectId(req.params.id) }, function (err, doc) {
                doc.tags = req.body.tags;
                doc.save(function(err) {
                    if(err) {
                        that.loggerInstance.error(`updateAudioTags fail ${err}`);
                        return res.json(new ResponseController(200, "updateAudioTags fail ", err));
                    }
                    else{
                        that.loggerInstance.info("updateAudioTags success");
                        return res.json(new ResponseController(500, "updateAudioTags success"));
                    }
                });
            });
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
}