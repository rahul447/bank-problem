/* eslint-disable */
var Question = require('../endpoints/question/question.model.js'),
    Test = require('../endpoints/test/tests.model.js'),
    async = require('async'),
    mongoose = require('mongoose'),
    _ = require("lodash");


//var analysis = [];
var mongoose = require('mongoose');

module.exports = {

    getQuestion: function (req, res) {
        var array = req.body.questionArray;
        var analysis = [];
        console.log("array of questions", req.body.questionArray);
        var query = { _id: { $in: array } }
        Question.find(query, function (err, questions) {
            if (err) {
                return res.json({ 'status': '500', 'message': 'Error in retrieving all questions' });
            }
            else {
                var obj = [];
                var newObj = {}
                for (var i = 0; i < questions.length; i++) {
                    newObj[questions[i]._id.toString()] = i;
                }
                for (var j = 0; j < array.length; j++) {
                    if (newObj[array[j].toString()] > -1) {
                        var ques = questions[newObj[array[j].toString()]]
                        for (var i = 0; i < ques.content.length; i++) {
                            content = ques.content[i];
                            content.correctAnswer = { answerType: 'no data here', data: ['na '] };
                            obj.push(content);
                        }
                        analysis.push({ 'status': '200', 'message': 'Question retrieved', 'data': { 'qData': { 'content': obj }, 'qId': array[j].toString(), 'questionType': ques.questionType, 'questionCode': ques.questionCode, passageId: ques.passageId ? ques.passageId : null } });
                    }
                    else {
                        analysis.push({ 'status': '500', 'message': 'Error retrieving question', 'data': null });
                    }
                }
                res.json(analysis);
            }
        });
    },

    questionList: function (req, res) {
        Test.find({ '_id': req.query.testId })
            .populate('data.sections.subSection.questions')
            .exec(function (err, Questions) {
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': 'Error retrieving questions'
                    });
                }
                else {
                    return res.json({
                        'status': '200',
                        'message': 'Questions retrieved',
                        'data': Questions
                    });
                }
            });
    },
    saveQuestion: function (req, res) {
        var question = new Question(req.body);
        question.save(function (err) {
            if (!err) {
                return res.json({
                    'status': "200",
                    'message': "no error",
                    "qId": question._id
                })
            }
            else {
                return res.json({
                    'status': "400",
                    'message': err
                })
            }
        })
    },

    submitQuesMap: function (req, res) {

        var changesQues = req.body;

        try {
            for (var key in changesQues) {
                (function (key) {
                    Question.findOne({ "_id": key }, function (err, doc) {
                        doc.content = changesQues[key];
                        doc.save();
                    });
                })(key);
            }
            return res.json({
                'status': "200",
                'message': "All Questions Updated"
            })
        } catch (err) {
            console.log("err : ", err);
            return res.json({
                'status': "400",
                'message': err
            })
        }
    }
}
