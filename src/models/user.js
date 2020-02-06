const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')
const sharp = require('sharp')

const userSchema = new mongoose.Schema({
    name:{
        type : String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email!!!")
            }
        }
    },
    age:{
        type : Number,
        default: 0,
        validate(value) {                       //this is method not a function
            if(value<0){
                throw new Error("Age must be positive!!!!!")
            }
        }
    },
    password:{
        required: true,
        type: String,
        trim: true,
        validate(value){
            if(value.length<=6){
                throw new Error("Length of password must be more than 6!!!")
            }
            if(value.toLowerCase().includes("password")){
                throw new Error("Password should not contain 'password'.. in any form")
            }
        }
    },
    tokens: [{
        token: {
            required: true,
            type: String
        }
    }],
    avatar: {
        type: Buffer
    }
},{
    timestamps: true
}) 


//If Owner wants to call Tasks -> create a virtual database that connects Owners to the tasks
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})
// The localField and foreignField options. 
// Mongoose will populate documents from the model in ref
// whose foreignField matches this document's localField.



userSchema.methods.toJSON = function() {                                    //Automating to hide required data
    const user = this

    const userObject = user.toObject()
    
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    
    return userObject 
}
// .toJSON converts and deletes the private data from showing... like password and token
// So for each router handler we call User every time password and tokens are hiden
// Note that for login we are returning token so it gets displayed.
// In other route handlers we are only returning user -> so each time password and tokens are hidden.   


userSchema.methods.generateAuthToken = async function() {                        //do not use arrow function if you need to bind with 'this'
    const user = this                                                            //methods is used for individual

    const token = jwt.sign({_id: user._id.toString()}, 'thisisNODEJSCOURSE')
    user.tokens = user.tokens.concat({token})                                    
    await user.save()

    return (token)
}

userSchema.statics.findByCredentials = async (email, password) => {                 //statics is important to create your own defined functions

    const user = await User.findOne({email})                                        //find One user with email

    if(!user){
        throw new Error("Unable to Login!!!!")        
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error("Unable to Login!!!!")
    }

    return user
}


//Hash the Password
userSchema.pre('save', async function (next) {                  //do not use arrow function if you need to bind with 'this'
    const user = this
    
    // console.log("Just before Saving")

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

//Delete all tasks when user deletes the profile
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User