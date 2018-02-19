"use strict";

import courseItem from "./courseitem.model";
import { ResponseController } from "../../util/response.controller";
import errorMessages from '../../util/errorMessages';

export class courseItemController {
    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = courseItem;
        this.message = new errorMessages();
        this.message.courseItem();
    }

    get(req, res) {
        if (req.params.id){
            return this.getById(req.params.id, res);
        }
        let query = {
            sort: {}
        };
        this.modelInstance.find(query)
            .then(data => this.handleOtherResponses(this.message.successGet, data, res))
            .catch(err => this.handleError(this.message.errorGet, err, null, res))
    }

    getById(id, res){
        this.modelInstance.findById(id)
            .then(data => data ? 
                this.handleOtherResponses(this.message.successGet, data, res) :
                this.handleError(null, 404, this.message.notFound, res))
            .catch(err => this.handleError(this.message.errorGet, err, null, res))
    }

    create(req, res) {
        let courseitem = new this.modelInstance(req.body);
        courseitem.save()
        .then(data => this.handleOtherResponses(this.message.successCreate, data, res))
        .catch(err => this.handleError(this.message.errorCreate, 500, err, res));
    }
    
    patch(req, res) {
        delete req.body._id;
        let id = req.params.id;
        let newItem = req.body;
        newItem.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newItem, {
            new: true
        }).then(response => response ?
            this.handleOtherResponses(this.message.successUpdate, response, res) :
            this.handleError(null, 404, this.message.notFound, res))
            .catch(err => this.handleError(this.message.errorUpdate, 500, err, res));
    }
        
    handleError(errorMessage, err, otherError, res) {
        if (err === 404) {
            this.loggerInstance.debug(otherError);
            return res.json(new ResponseController(404, otherError));
        }
        this.loggerInstance.error(err);
        return res.json(new ResponseController(500, errorMessage, err));
    }

    handleOtherResponses(success, responseObject, res) {
        this.loggerInstance.info(success);
        return res.json(new ResponseController(200, success, responseObject));
    }
}