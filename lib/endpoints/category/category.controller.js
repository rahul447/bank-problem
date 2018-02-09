"use strict";
import category from "./category.model";
import {ResponseController} from "../../util/response.controller";

export class CategoryController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.categoryModelInstance = category;
    }

    categoryCreate(req, res) {
        let categoryObj = new this.categoryModelInstance(req.body);
        ((that) => {
            categoryObj.save()
            .then(function(categoryObj) {
                that.loggerInstance.info("Category saved successfully");
                return res.json(new ResponseController(200, "Category saved successfully", categoryObj));
            })
            .catch(function(err) {
                that.loggerInstance.error("DB Error saving Category");
                return res.json(new ResponseController(500, "Error saving Category",err));
            })
        })(this)
    }

    categoryEdit(req, res){
        let categoryObj = new this.categoryModelInstance(req.body);
        ((that)=>{
            this.categoryModelInstance.findOneAndUpdate({_id:categoryObj._id},categoryObj,{new: true})
            .then(function(newObj){
                that.loggerInstance.info("Category updated successfully");
                return res.json(new ResponseController(200, "Category updated successfully",newObj));
            })
            .catch(function(err){
                that.loggerInstance.error("DB Error saving Category");
                return res.json(new ResponseController(500, "Error updating Category",err));
            })
        })(this)
    }

    categoryDelete(req,res){
        if(req.body.categoryId == null){
            this.loggerInstance.error("Id null");
            return res.json(new ResponseController(500, "Id null"));
        }
        else{
            ((that)=>{
                this.categoryModelInstance.findOneAndRemove({_id:req.body.categoryId})
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
}