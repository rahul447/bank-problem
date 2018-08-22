print("currContentId,oldContentId");
var cursor = db.questionsBk.aggregate([
    {
        $lookup: {
            from: "questions",
            as: "questions",
            localField: "_id",
            foreignField: "_id"
        }
    },
    {
        "$project": {
            "currContentId": "$questions.contentId",
            "oldContentId": "$contentId"
        }
    }
]);

while (cursor.hasNext()) {
    jsonObject = cursor.next();
    jsonObject.currContentId[0] !== jsonObject.oldContentId && print(jsonObject.currContentId[0]+","+jsonObject.oldContentId);
}
