print("quesId,status,draftId,testId,uniqueId,testName,publishId")
var cursor = db.questions.aggregate([
    {
        "$match": {
            "content.correctAnswer.data.value": { "$exists": false}
        }
    },
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
    jsonObject = cursor.next();
    print(jsonObject.quesId.valueOf() + "," + jsonObject.status + ",\"" + jsonObject.draftId+"\"" + ",\"" + jsonObject.testId.join(",")+"\"" + ",\"" + jsonObject.uniqueId.join(",")+"\"" + ",\"" + jsonObject.testName.join(",")+"\"" + ",\"" + jsonObject.publishId+"\"")
}