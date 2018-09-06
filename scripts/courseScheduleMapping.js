print("CourseId, Name, scheduleIds, scheduleDates");
var cursor = db.courses.aggregate([
    {
        "$unwind": "$courseItems"
    },
    {
        "$match": {
            "courseItems.itemType": "scheduledTests"
        }
    },
    {
        $lookup: {
            from: "courseitems",
            localField: "courseItems.id",
            foreignField: "_id",
            as: "courseItemData"
        }
    },
    {
        "$unwind": "$courseItemData"
    },
    {
        "$unwind": "$courseItemData.details.schedule"
    },
    {
        "$group": {
            _id: "$_id",
            names: { $addToSet: "$name" },
            displayNames: { $addToSet: "$courseItemData.details.schedule.displayName" },
            schIds: { $push: "$courseItemData.details.schedule.scheduleID" },
            scheduleDates: { $push: "$courseItemData.details.schedule.scheduleDate" }
        }
    }
]);
while (cursor.hasNext()) {
    jsonObject = cursor.next();

    print(jsonObject._id+","+jsonObject.names[0]+","+jsonObject.schIds.join(",")+","+jsonObject.scheduleDates.join(","));
}
