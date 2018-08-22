'use strict';
/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');
import values from "../../../config/values";
const config = Object.freeze(require("../../../config/" + process.env.NODE_ENV));
const CryptoJS = require("crypto-js");
/**
 * Rules Schema
 */
var StudyMaterialSchema = new Schema({
    content: [{
        locale: String,
        content: { type: String },
        title: String,
    }],
    status: {
        type: String,
        default: values.contentStatus.default,
        enum: values.contentStatus.values
    },
    draftId: { type: mongoose.Schema.Types.ObjectId },
    publishId: { type: mongoose.Schema.Types.ObjectId },
    tags: [{
        relation: {
            "name": String,          //tag name
            "id": { type: mongoose.Schema.Types.ObjectId, ref: "contentTag" }
        },
        type: {
            type: String, //date picker, list picker, number, text, type(question, test, video, audio)
            enum: values.tagAssociationTypes
        },
        values: []      // date value, array of list, number, string, objectIds
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
    subjects: [
        {
            subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
            chapters: [
                {
                    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
                    concepts: [
                        {
                            conceptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Concept' },
                            conceptCode: String,
                        }
                    ]
                }
            ]
        }
    ],
    aclMetaData: {
        createdBy: {
            id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
            email: { type: String }
        },
        updatedBy: {
            id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
            email: { type: String }
        },
        clientId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "Client" },
        allowedTo: [
            {
                user: {
                    id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
                    email: { type: String }
                },
                allPermissionAllowed: { type: Boolean },
                accessAllowed: [{ type: String, enum: values.validAccessTypes }]
            }
        ],
        subjects: [{ type: String }],
        centers: [{ type: String }]
    },
    contentId: { type: String },
    oldContentId: String,
    docCounter: Number
});

/*StudyMaterialSchema.post('find', decryptData);

StudyMaterialSchema.post('findOne', decryptData);*/

function decryptData(doc) {
    const key = config.encryptKey;
    if(Array.isArray(doc)) {
        doc.map(each => {
            each.content.map(con => {
                let conversion = CryptoJS.AES.decrypt(con.title, key).toString(CryptoJS.enc.Utf8);
                con.title = conversion ? conversion : con.title;
                return con;
            });
            return each;
        });
    } else {
        doc.content.map(con => {
            let conversion = CryptoJS.AES.decrypt(con.title, key).toString(CryptoJS.enc.Utf8);
            con.title = conversion ? conversion : con.title;
            return con;
        });
    }
}

StudyMaterialSchema.index({ updatedAt: -1 });
StudyMaterialSchema.index({ draftId: 1 }, {sparse: true});
StudyMaterialSchema.index({ "subjects.subjectId": 1 }, {sparse: true});
StudyMaterialSchema.index({ "subjects.chapters.chapterId": 1 }, {sparse: true});
StudyMaterialSchema.index({ "subjects.chapters.concepts.conceptId": 1 }, {sparse: true});
StudyMaterialSchema.index({ "status": 1 });

StudyMaterialSchema.pre('save', function(next) {
    if(!config.skipHook)
        this.updatedAt = Date.now();
    next();
});

StudyMaterialSchema.pre('save', async function(next) {
    if(!config.skipHook) {
        const exists = await this.checkUpdateOrInsert(this._id);
        if(!exists) {
            const lastContentId = await this.getMaxContentId();
            if(this.publishId) {
                this.contentId = `${this.contentId}-DRAFT`;
            } else {
                this.contentId = !lastContentId ? 'S-1': `S-${lastContentId + 1}`;
                this.docCounter = !lastContentId ? 1 : lastContentId + 1;
            }
        }
    }
    next();
});


StudyMaterialSchema.methods.checkUpdateOrInsert = (docId) => {
    return new Promise((resolve, reject) => {
        mongoose.models['StudyMaterial'].count({_id: mongoose.Types.ObjectId(docId)}).exec()
            .then((count) => {
                resolve(count);
            }).catch(err => {
            reject(err);
        });
    });
};

StudyMaterialSchema.methods.getMaxContentId = () => {
    return new Promise((resolve, reject) => {
        mongoose.models['StudyMaterial'].find({}, {docCounter: 1}).sort({docCounter:-1}).limit(1)
        .exec((err, doc) => {
            const lastId = doc[0] ? doc[0].docCounter : undefined;
            err ? reject(err) : resolve(lastId);
        });
    });
};

StudyMaterialSchema.methods.findStatusById = (id) => {
    return new Promise((resolve, reject) => {
        mongoose.models['StudyMaterial'].find({_id: mongoose.Types.ObjectId(id)}, (err, doc) => {
            err ? reject(err) : resolve(doc[0].status);
        });
    });
};

StudyMaterialSchema.plugin(mongoosePaginate);


/*StudyMaterialSchema.pre('save', function(next) {
    const key = config.encryptKey;
    this.content.map(con => con.title = CryptoJS.AES.encrypt(con.title, key));
    console.log("this.content in save: ", this.content);
    next();
});*/



module.exports = mongoose.model('StudyMaterial', StudyMaterialSchema, 'studyMaterials');



