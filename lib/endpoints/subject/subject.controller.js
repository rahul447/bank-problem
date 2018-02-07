"use strict";

import subjects from "./subject.model";

export class SubjectController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.subjectModelInstance = subjects;
    }

    subjectListByGrade(req, res) {
        let gradeId = req.query.gradeId;
        // if (!gradeId) {
        //     return res.json({
        //         'status': '500',
        //         'message': "Grade ID is Mandatory"
        //     });
        // }
        this.subjectModelInstance.find(
            // {'grade.id': gradeId}
            )
            .then(subjects => res.json({
                'status': '200',
                'message': 'Subjects list retrieved successfully',
                'data': subjects
            })).catch(err => res.json({
                'status': '500',
                'message': 'Error listing subjects'
            }));
    }
}