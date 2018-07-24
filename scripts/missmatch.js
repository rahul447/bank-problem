print("quesId,status,draftId,uniqueId,testName,publishId")

var cursor = db.questions.aggregate([
    {
        $lookup: {
            from: "tests",
            as: "testsData",
            localField: "_id",
            foreignField: "data.sections.subSection.questions.qId"
        }
    },
    {
        "$project": {
            "content": 1,
            "quesId": "$_id",
            "status": 1,
            "draftId": 1,
            "testId": "$testsData._id",
            "uniqueId": "$testsData.uploadDetail.uniqueId",
            "testName": "$testsData.name",
            "publishId": 1,
            "_id": 0
        }
    }
]);


while (cursor.hasNext()) {
    doc = cursor.next();
    doc.content.length > 0 && doc.content.map(con => {
        var optionSet = new Set();
        var corrAns = con.correctAnswer.data;
        con.optionsContent.map(op => optionSet.add(op.id));
        if(con.correctAnswer && con.correctAnswer.data && con.correctAnswer.data.length > 0)
            corrAns = con.correctAnswer.data.filter(ans => optionSet.has(ans.value));

        if(con.correctAnswer.data.length !== corrAns.length) {
            print(doc.quesId.valueOf() + "," + doc.status + ",\"" + doc.draftId+"\"" + ",\"" + doc.uniqueId.join(",")+"\"" + ",\"" + doc.testName.join(",")+"\"" + ",\"" + doc.publishId+"\"")
        };
    });
}