"use strict";

import subCategory from "./subCategory.model";
import { ResponseController } from "../../util/response.controller";

export class SubCategoryController {

    constructor(parameters) {
        let { loggerInstance, config } = parameters;
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = subCategory;
    }

    get(req, res) {
        if (req.params.id) {
            this.getById(req.params.id, res);
        } else {
            let query = {};
            if (req.query.category) {
                query.categoryId = req.query.category;
            }
            let limit = req.query.limit ? Number(req.query.limit) : 30;
            let skip = req.query.page ? limit * Number(req.query.page) : 0;
            this.modelInstance.find(query).skip(skip).limit(limit)
                .then(categories => {
                    this.loggerInstance.info("Retrieved sub categories list");
                    res.json(new ResponseController(200, "sub categories list retrieved successfully", categories));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing sub categories");
                    res.json(new ResponseController(500, "Error listing sub categories"));
                });
        }
    }

    getById(id, res) {
        this.modelInstance.findById(id)
            .then(subcategory => {
                if (!subcategory) {
                    this.loggerInstance.debug("sub category not found");
                    res.json(new ResponseController(404, "Not found sub category with given ID"));
                }
                this.loggerInstance.info("Retrieved sub category list");
                res.json(new ResponseController(200, "sub category list retrieved successfully", subcategory));
            })
            .catch(() => {
                this.loggerInstance.debug("DB error getting sub category");
                res.json(new ResponseController(500, "Error getting sub category"));
            });
    }

    create(req, res) {
        let subcategory = new this.modelInstance(req.body);
        subcategory.save().then(subcategory => {
            this.loggerInstance.info("sub category created successfully");
            return res.json(new ResponseController(200, "sub category created successfully", subcategory));
        }).catch(err => {
            this.loggerInstance.error("Error creating sub category");
            return res.json(new ResponseController(500, "Error creating sub category", err));
        })
    }

    patch(req, res) {
        delete req.body._id;
        let id = req.params.id;
        let newSubCategory = req.body;
        newSubCategory.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newSubCategory, {
                new: true
            }).then(response => {
                if (!response) {
                    this.loggerInstance.debug("sub category not found");
                    res.json(new ResponseController(404, "Not found sub category with given ID"));
                }
                this.loggerInstance.info("sub category updated successfully");
                res.json(new ResponseController(200, "sub category Updated", response));
            }).catch(err => {
                this.loggerInstance.error("DB error updating sub category");
                res.json(new ResponseController(500, "Unable to update sub category", err));
            });
    }

    delete(req, res) {
        let id = req.params.id;
        this.modelInstance.findByIdAndRemove(id)
            .then(data => {
                if (!data) {
                    this.loggerInstance.debug("sub category not found");
                    return res.json(new ResponseController(404, "sub category not found"));
                }
                this.loggerInstance.info("sub category deleted successfully");
                return res.json(new ResponseController(200, "sub category deleted successfully", data));
            }).catch(err => {
                this.loggerInstance.error("Error deleting sub category");
                return res.json(new ResponseController(500, "Error deleting sub category", err));
            });
    }
}