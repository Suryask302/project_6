/*                                         questionsSchema                                              */

const mongoose = require('mongoose')

const quesSchema = new mongoose.Schema({

    description: {

        type: String,
        required: true
    },

    tag: ['string'],

    askedBy: {

        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    deletedAt: {
        type: Date,
        default: null
    },

    isDeleted: {

        type: Boolean,
        default: false
    }

}, { timestamps: true })

module.exports = mongoose.model('Question', quesSchema)