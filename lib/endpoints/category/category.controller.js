"use strict";

import category from "./category.model";
import { ResponseController } from "../../util/response.controller";

export class CategoryController {

    constructor(parameters) {
        let { loggerInstance, config } = parameters;
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = category;
    }

    get(req, res) {
        if (req.params.id) {
            this.getById(req.params.id, res);
        } else {
            let limit = req.query.limit ? Number(req.query.limit) : 30;
            let skip = req.query.page ? limit * Number(req.query.page) : 0;
            this.modelInstance.find().skip(skip).limit(limit)
                .then(categories => {
                    this.loggerInstance.info("Retrieved categories list");
                    res.json(new ResponseController(200, "categories list retrieved successfully", categories));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing categories");
                    res.json(new ResponseController(500, "Error listing categories"));
                });
        }
    }

    getById(id, res) {
        this.modelInstance.findById(id)
            .then(category => {
                if (!category) {
                    this.loggerInstance.debug("category not found");
                    res.json(new ResponseController(404, "Not found category with given ID"));
                }
                this.loggerInstance.info("Retrieved category list");
                res.json(new ResponseController(200, "category list retrieved successfully", category));
            })
            .catch(() => {
                this.loggerInstance.debug("DB error getting category");
                res.json(new ResponseController(500, "Error getting category"));
            });
    }

    create(req, res) {
        let category = new this.modelInstance(req.body);
        category.save().then(category => {
            this.loggerInstance.info("category created successfully");
            return res.json(new ResponseController(200, "category created successfully", category));
        }).catch(err => {
            this.loggerInstance.error("Error creating category");
            return res.json(new ResponseController(500, "Error creating category", err));
        })
    }

    patch(req, res) {
        delete req.body._id;
        let id = req.params.id;
        let newCategory = req.body;
        newCategory.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newCategory, {
                new: true
            }).then(response => {
                if (!response) {
                    this.loggerInstance.debug("category not found");
                    res.json(new ResponseController(404, "Not found category with given ID"));
                }
                this.loggerInstance.info("category updated successfully");
                res.json(new ResponseController(200, "category Updated", response));
            }).catch(err => {
                this.loggerInstance.error("DB error updating category");
                res.json(new ResponseController(500, "Unable to update category", err));
            });
    }

    delete(req, res) {
        let id = req.params.id;

        this.modelInstance.findOne({ id: mongoose.Types.ObjectId(id) }, (err, doc) => {
            if (!err) {
                this.loggerInstance.debug("category not found");
                return res.json(new ResponseController(404, "category not found"));
            }
            doc.status = 'DELETED';
            doc.aclMetaData = Object.assign({}, doc.aclMetaData ? doc.aclMetaData : {},
                req.body.aclMetaData);

            doc.save((err) => {
                 if(err) {
                     this.loggerInstance.error("Error deleting category");
                     return res.json(new ResponseController(500, "Error deleting category", err));
                 }
                this.loggerInstance.info("category deleted successfully");
                return res.json(new ResponseController(200, "category deleted successfully", data));
            });
        });
    }
}