const express = require("express")
const User = require("../models/user")
const auth = require("../middleware/authentication")
const router = new express.Router()
const Task = require("../models/task")
const multer = require("multer")
const sharp = require('sharp')
const { sendWelcomeMail, sendCancellationMail } = require('../emails/account')


router.post('/users', async (req, res)=>{
    const user = new User(req.body)

    try{ 
        await user.save()
        sendWelcomeMail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)        //findByCredentials is self-defined function 
        const token =  await user.generateAuthToken()                                       //generating token for a single user --> so 'user' not 'User'
        // res.send({user: user.getPublicProfile(), token})                                 //hiding data manually by creating the function getPublicProfile
        res.send({user, token})
    }catch(error){
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res)=>{
    try{ 
        req.user.tokens = req.user.tokens.filter((token)=>{                                //once th user logs out the token that was generated for login will be deleted
            return token.token!==req.token
        })
        await req.user.save()

        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutALL', auth, async (req, res)=>{
    try{
        req.user.tokens = req.user.tokens.delete                                            //req.user.tokens = []    -> another way of deleting 

        await req.user.save()

        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.get('/users', async (req, res)=>{      
    
    try{
        const users = await User.find({})
        res.send(users)
    }catch(e){
        res.status(500).send(e)
    }
})

//Getting only Your DATA
router.get('/users/me', auth, async (req, res)=>{      
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {                        //only logged in user can update
    const updates = Object.keys(req.body)
    try{
        const user = await User.findByIdAndUpdate(req.user._id)

        updates.forEach((update)=>{
            req.user[update] = req.body[update]                  //doing this to overcome middleware
        })

        await req.user.save()

        res.send(req.user)
    }catch(e){
        res.status(500).send(e)
    }    
})

router.delete('/users/me', auth, async (req, res)=>{
    try{
        await req.user.remove()
        sendCancellationMail(req.user.email, req.user.name)
        res.send(req.user)
    }catch(e){
        res.status(500).send(e)
    }
})

const upload = multer({
    // dest: "avatars",
    limits: {
        fileSize: 5000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(png|jpg|jpeg)$/)){
            return cb(new Error("Please upload an image"))
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('upload'), async (req, res)=>{
    const buffer = await sharp(req.file.buffer).resize({
        height:250,
        width: 250
    }).png().toBuffer()
    req.user.avatar = buffer                                                               //req.user.avatar = req.file.buffer  -> if you want the raw quality of the img/file uploaded
    await req.user.save()
    res.status(200).send({message:"File Uploaded Successfully"})
},(error, req, res, next)=>{                                                               //middleware to create apna error
    res.status(400).send({error: error.message})
})

router.delete("/users/me/avatar", auth, async(req, res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send({message:"File deleted Successfully"})
})


//Render the File to the User
router.get("/users/:id/avatar", async(req, res)=>{
    try{
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error({error:"Image cannot be found..."})
        }

        res.set('Content-Type','image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(400).send()
    }
})



module.exports = router