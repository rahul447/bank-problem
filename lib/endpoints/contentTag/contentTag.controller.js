"use strict";

import contentTag from "./contentTag.model";
import { ResponseController } from "../../util/response.controller";

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
}