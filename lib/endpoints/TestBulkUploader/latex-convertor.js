var mjAPI = require("mathjax-node");
var request = require("request");
var fs = require("fs");
var mongoose = require('mongoose');
var async = require('async');
var dom = require('xmldom').DOMParser;
var xpath = require('xpath');

var courseSyllabus = require('../courseSyllabus/courseSyllabus.model');
var question = require('../question/question.model');

let {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));


mjAPI.config({
    MathJax: {
        // tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']],},
    }
});
mjAPI.start();

// var yourMath = "\\Rightarrow \\,\\,T = {m_2}g \\Rightarrow F = 2{m_2}g";
question.find({latexTwoStatus:'notDone'}).exec(function (err, data) {
    data = JSON.parse(JSON.stringify(data));
    if (err) {
        console.log(err);
        mongoose.disconnect();
    }
    else {
        runOnEveryQuestionArray(data, function (err) {
            if (err) {
                console.log(err);
                mongoose.disconnect();
            }
            else {
                mongoose.disconnect();
            }
        })
    }
})

function process(str) {
    // console.log(str)
    var regex = /<span class='math-tex'>/gi, result, indices = [];
    while ((result = regex.exec(str))) {
        indices.push(result.index + 25);
    }

    var regexEnd = /<\/span>/gi, resultEnd, indicesEnd = [];
    while ((resultEnd = regexEnd.exec(str))) {
        indicesEnd.push(resultEnd.index - 2);
    }

    if (indices.length === indicesEnd.length) {
        // console.log('It worked')
    }

    var array = []
    var array1 = []
    for (var i = 0; i < indicesEnd.length; i++) {
        newString = str.slice(indices[i], indicesEnd[i]);
        if (newString.length > 4) {
            array1.push(newString);
            newString = newString.replace(new RegExp('&gt;', 'g'),'>');
            newString = newString.replace(new RegExp('&lt;', 'g'),'<');
            newString = newString.replace(new RegExp('&amp;', 'g'),'&');
            array.push(newString);
        }
    }
    // console.log(array);
    return [array, array1];
}

function processAnother(array, data) {
    return chagedData;
}

function convertToLatexArray(yourMaths, id, next) {
    var array = []
    async.eachSeries(yourMaths, function (yourMath, callback) {
        convertToLatex(yourMath, id, function (err, response) {
            if (err) {
                callback(err)
            }
            else {
                array.push(response)
                callback()
            }
        })
    }, function (err) {
        if (err)
            next(err);
        else
            next(null, array);
    });
}

function runOnEveryQuestionArray(array, next) {
    async.eachSeries(array, function (data, callback) {
        // console.log('started new question');
        runOnEveryQuestion(data, function (err, response) {
            if (err) {
                callback(err)
            }
            else {
                callback()
            }
        })
    }, function (err) {
        if (err)
            next(err);
        else
            next(null);
    });
}

function convertToLatex(yourMath, id, next) {
    mjAPI.typeset({
        math: yourMath,
        format: "TeX", // or "inline-TeX", "MathML"
        mml: true,      // or svg:true, or html:true
    }, function (data) {
        // console.log(data);
        if (!data.errors) {
            var endpoint = `${config.pythonScriptPath}/convertToMathMl`;
            x = { "mathMl": data.mml }
            request({
                    url: endpoint,
                    method: 'POST',
                    json: x
                },
                function (error, response, body) {
                    if (error) {
                        next(error);
                    }
                    else {
                        // console.log(response.body)
                        var result = response.body.slice(1, -1);
                        var newResult = result;
                        //console.log(newResult);
                        newResult = newResult.replace(/\\phantom\{\\rule\{thinmathspace\}\{0ex\}\}/g,'\\ ');
                        newResult = newResult.replace(/\\phantom\{\\rule\{1pt\}\{0ex\}\}/g,'\\ ');
                        //console.log(newResult);
                        next(null, newResult);
                    }
                });
        }
        else {
            console.log("Could not parse tex of " + id)
            console.log("The tex was " + yourMath)
            next(null, yourMath);
        }
    });
}

function runOnEveryQuestion(data, next) {
    var str = convertDataToString(data.content[0])
    yourMath = process(str);
    convertToLatexArray(yourMath[0], data._id, function (err, array) {
        if (err) {
            next(err);
        }
        else {
            // console.log(array);
            // console.log(data);
            data.content[0] = convertStringToData(yourMath[1], array, data.content[0])
            data.latexTwoStatus = 'done';
            // console.log(data);
            question.findOneAndUpdate({_id: data._id},data,function (err, data) {
                if (err) {
                    next(err);
                }
                else {
                    next();
                }
            });
        }
    })
}

function convertDataToString(data) {
    // return JSON.stringify(data);
    var str = '';
    if (data['passageQuestion']) {
        str = str + data.passageQuestion
    }
    if (data['questionContent']) {
        str = str + data.questionContent
    }
    if (data['optionsContent'] && data.optionsContent.length !== 0) {
        for (var i = 0; i < data.optionsContent.length; i++) {
            str = str + data.optionsContent[i].value;
        }
    }
    if (data['matrixOptionContent'] && data.matrixOptionContent.length !== 0) {
        if (data.matrixOptionContent['optionRight'] && data.matrixOptionContent.optionRight.length !== 0) {
            for (var i = 0; i < data.matrixOptionContent.optionRight.length; i++)
                str = str + data.matrixOptionContent.optionRight[i].value;
        }
        if (data.matrixOptionContent['optionLeft'] && data.matrixOptionContent.optionLeft.length !== 0) {
            for (var i = 0; i < data.matrixOptionContent.optionLeft.length; i++)
                str = str + data.matrixOptionContent.optionLeft[i].value;
        }
    }
    if (data['solutionContent']) {
        str = str + data.solutionContent
    }
    if (data['questionHints']) {
        str = str + data.questionHints
    }
    return str;
}


function convertStringToData(yourMath, array, data) {
    var str = '';
    if (data['passageQuestion']) {
        for (var i = 0; i < array.length; i++) {
            data.passageQuestion = data.passageQuestion.replace(yourMath[i], array[i])
        }
    }
    if (data['questionContent']) {
        for (var i = 0; i < array.length; i++) {
            data.questionContent = data.questionContent.replace(yourMath[i], array[i])
        }
    }
    if (data['optionsContent'] && data.optionsContent.length !== 0) {
        for (var i = 0; i < data.optionsContent.length; i++) {
            for (var j = 0; j < array.length; j++) {
                data.optionsContent[i].value = data.optionsContent[i].value.replace(yourMath[j], array[j])
            }
        }
    }
    if (data['matrixOptionContent'] && data.matrixOptionContent.length !== 0) {
        if (data.matrixOptionContent['optionRight'] && data.matrixOptionContent.optionRight.length !== 0) {
            for (var i = 0; i < data.matrixOptionContent.optionRight.length; i++) {
                for (var j = 0; j < array.length; j++) {
                    data.matrixOptionContent.optionRight[i].value = data.matrixOptionContent.optionRight[i].value.replace(yourMath[j], array[j])
                }
            }
        }
        if (data.matrixOptionContent['optionLeft'] && data.matrixOptionContent.optionLeft.length !== 0) {
            for (var i = 0; i < data.matrixOptionContent.optionLeft.length; i++) {
                for (var j = 0; j < array.length; j++) {
                    data.matrixOptionContent.optionLeft[i].value = data.matrixOptionContent.optionLeft[i].value.replace(yourMath[j], array[j])
                }
            }
        }
    }
    if (data['solutionContent']) {
        for (var i = 0; i < array.length; i++) {
            data.solutionContent = data.solutionContent.replace(yourMath[i], array[i])
        }

    }
    if (data['questionHints']) {
        for (var i = 0; i < array.length; i++) {
            data.questionHints = data.questionHints.replace(yourMath[i], array[i])
        }
    }
    return data;
}