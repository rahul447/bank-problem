"use strict";

export default class errorMessages {
    constructor() { }

    courseSyllabus() {
        this.findPartialError = "Error in finding partial data"
        this.notPartialFound = "No partial data was found with given conditions"
        this.successPartial = "partial data found Successfully"
        this.findSubjectError = "Error in finding subjects"
        this.notSubjectFound = "No subjects was found with given conditions"
        this.successSubject = "Subjects found Successfully"
        this.findChapterError = "Error in finding chapters"
        this.notChapterFound = "No chapters was found with given conditions"
        this.successChapter = "Chapters found Successfully"
        this.findConceptError = "Error in finding concepts"
        this.notConceptFound = "No concepts was found with given conditions"
        this.successConcept = "concepts found successfully"
        this.findAllError = "Error in finding all data"
        this.notAllFound = "No all data was found with given conditions"
        this.successAll = "All data found Successfully"
        this.errorDeleteCourseSyllabus = "Error deleting course syllabus item"
        this.errorCreateCourseSyllabus = "Error creating course syllabus item"
        this.errorPatchCourseSyllabus = "Error deleting course syllabus item"
        this.successDeleteCourseSyllabus = "Course syllabus item deleted successfully"
        this.successCreateCourseSyllabus = "Course syllabus item created successfully"
        this.successPatchCourseSyllabus = "Course syllabus item updated successfully"
        this.courseSyllabusNotFound = "Course syllabus not found with given ID"
        this.successConceptDetail = "Concept Detail found Successfully"
        this.getConceptDetailError = "Error in finding Concept detail"
        this.notConceptFound = "No concept detail was found with given conditions"
    }

    courseItem() {
        this.successCreate = "Courseitem created successfully"
        this.errorCreate = "Error creating courseitem"
        this.successUpdate = "Courseitem updated successfully"
        this.errorUpdate = "Error updating courseitem"
        this.successGet = "Courseitem retrieved successfully"
        this.errorGet = "Error retrieving courseitem"
        this.notFound = "Not found a courseitem with given id"
    }
}
