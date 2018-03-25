"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {QuestionController} from "./question.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    questionSaveRoute = router.route("/questionSave"),
    questionEditRoute = router.route("/questionEdit"),
    questionLinkedCreateRoute = router.route("/questionLinkedCreate"),
    distinctQuestionTypesRoute = router.route("/distinctQuestionTypes"),
    updateQuestionTagsRoute = router.route("/updateQuestionTags/:id"),
    questionInstance = new QuestionController(loggerInstance, config);

    questionSaveRoute.post(questionInstance.questionSave.bind(questionInstance));
    questionEditRoute.put(questionInstance.questionEdit.bind(questionInstance));
    questionLinkedCreateRoute.post(questionInstance.questionLinkedCreate.bind(questionInstance));
    router.route("/getQuestion/:id?").get(questionInstance.getQuestion.bind(questionInstance));

    distinctQuestionTypesRoute.get(questionInstance.distinctQuestionTypes.bind(questionInstance));
    updateQuestionTagsRoute.post(questionInstance.updateQuestionTags.bind(questionInstance));

    router.route('/getQuestionText/:id').get(questionInstance.getQuestionText.bind(questionInstance));

export default router;