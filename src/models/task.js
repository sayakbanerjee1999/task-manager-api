const mongoose = require('mongoose')
const validator = require('validator')
const User = require('../models/user')

const taskSchema = new mongoose.Schema({
    description:{
        type: String,
        trim: true,
        required: true
    },
    completed:{
        type: Boolean,
        default: false
    },
    owner: {                                                             //Only the user logged in can create a task -> task is related to owner. owner is not related to task. Task can call the owner. Owner cannot call the task.
        type: mongoose.Schema.Types.ObjectId,
        required: true,                                                  //Owner has direct link to the Owner ie, user field
        ref:'User'
    }
},{
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task