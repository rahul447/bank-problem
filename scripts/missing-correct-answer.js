print("quesId,QuesStatus,testId,testName,testStatus");
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
            "testContentId": "$testsData.contentId",
            "testName": "$testsData.name",
            "publishId": 1,
            "_id": 0,
            "contentId": 1,
            "content": 1,
            "testStatus": "$testsData.status",
        }
    }
]);
while (cursor.hasNext()) {
    jsonObject = cursor.next();

    print(jsonObject.contentId+","+jsonObject.status+","+jsonObject.testContentId+","+jsonObject.testName+","+jsonObject.testStatus);
}
