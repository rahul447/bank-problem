"use strict";

import express from "express";
import {getQuestionControllerInstance} from "./question.controller";

let router = express.Router(),
    questionSaveRoute = router.route("/questionSave"),
    questionEditRoute = router.route("/questionEdit"),
    questionLinkedCreateRoute = router.route("/questionLinkedCreate"),
    questionLinkedEditRoute = router.route("/questionLinkedEdit"),
    questionGetByIdRoute = router.route("/questionGetById/:passageId"),
    distinctQuestionTypesRoute = router.route("/distinctQuestionTypes"),
    updateQuestionTagsRoute = router.route("/updateQuestionTags/:id"),
    updateQuestionConceptRoute = router.route("/updateQuestionConcept/:id"),
    questionInstance = getQuestionControllerInstance();

    questionSaveRoute.post(questionInstance.questionSave.bind(questionInstance));
    questionEditRoute.put(questionInstance.questionEdit.bind(questionInstance));
    questionGetByIdRoute.get(questionInstance.questionGetById.bind(questionInstance));
    questionLinkedEditRoute.post(questionInstance.questionLinkedEdit.bind(questionInstance));
    questionLinkedCreateRoute.post(questionInstance.questionLinkedCreate.bind(questionInstance));
    router.route("/getQuestion/:id?").get(questionInstance.getQuestion.bind(questionInstance));

    distinctQuestionTypesRoute.get(questionInstance.distinctQuestionTypes.bind(questionInstance));
    updateQuestionTagsRoute.post(questionInstance.updateQuestionTags.bind(questionInstance));
    updateQuestionConceptRoute.post(questionInstance.updateQuestionConcept.bind(questionInstance));

    router.route('/getQuestionText/:id').get(questionInstance.getQuestionText.bind(questionInstance));

export default router;