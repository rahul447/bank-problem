"use strict";
import languages from "./language.model";
import {ResponseController} from "../../util/response.controller";

export class LanguageController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.languageModelInstance = languages;
    }

    languageList(req, res){
        this.languageModelInstance.find()
            .then(data => {
                this.loggerInstance.info("Languages retrieved successfully");
                return res.json(new ResponseController(200, "Languages retrieved successfully", data));
            })
            .catch(err => {
                this.loggerInstance.error("Error retrieving languages");
                return res.json(new ResponseController(500, "Error retrieving languages", err));
            })
    }

    languageAdd(req, res){
        let language = new this.languageModelInstance(req.body);
        language.save()
            .then(newLanguage => {
                this.loggerInstance.info("Language created successfully");
                return res.json(new ResponseController(200, "Language created successfully", newLanguage));
            })
            .catch(err => {
                this.loggerInstance.error("Error creating language");
                return res.json(new ResponseController(500, "Error creating language", err));
            })
    }

    languageUpdate(req, res){
        delete req.body._id;
        let languageId = req.params.id;
        if (!languageId){
            this.loggerInstance.debug("No languageId specified");
            return res.json(new ResponseController(400, "No languageId specified"));
        }
        let newLanguage = req.body;
        newLanguage.updatedAt = new Date();
        this.languageModelInstance.findOneAndUpdate({
            _id: languageId
        }, newLanguage, {
            new: true
        }).then(response => {
            if (!response) {
                this.loggerInstance.debug("Language not found");
                res.json(new ResponseController(404, "Not found language with given ID"));
            }
            this.loggerInstance.info("Language updated succesfully");
            res.json(new ResponseController(200, "Language Updated", response));
        }).catch(err => {
            this.loggerInstance.error("DB error updating language");
            res.json(new ResponseController(500, "Unable to update language", err));
        });
    }
    languageDelete(req,res){
        const {
            languageId
        } = req.params;
        console.log(languageId);
        ((that)=>{
            this.languageModelInstance.findOneAndRemove({_id:languageId})
            .then(function(newObj){
                that.loggerInstance.info("Category deleting successfully");
                return res.json(new ResponseController(200, "Category deleted successfully",newObj));
            })
            .catch(function(err){
                that.loggerInstance.error("DB Error deleting Category");
                return res.json(new ResponseController(500, "Error deleting Category",err));
            })
        })(this)
    }
}