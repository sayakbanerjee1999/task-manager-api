const express = require("express")
const Task = require("../models/task")
const User = require("../models/user")
const auth = require("../middleware/authentication")
const router = new express.Router()

router.post('/tasks', auth, async (req, res)=>{
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try{
        await task.save()
        res.status(201).send(task)
    }catch(error){
        res.status(400).send(error)
    }
})

router.get('/tasks', async (req, res)=>{
    try{
        const tasks = await Task.find({})
        res.send(tasks)
    }catch(e){
        res.status(500).send(e)
    }
})



// Get only the required data instead of all
// GET tasks/me?completed=true    
// GET tasks/me?limit=10&skip=20          limit skip (pagination)        
// GET tasks/me?sortBy=createdAt_desc     tasks/me?sortBy=createdAt:desc

router.get('/tasks/me', auth, async (req, res)=>{                                               //logged in user gets to see the tasks created
    const match = {}
    const sort = {}

    if (req.query.completed){
        match.completed = req.query.completed === "true"
    }

    if (req.query.sortBy){
        const parts = req.query.sortBy.split(":")
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try{
        // const tasks = await Task.find({owner: req.user._id}) 
        // res.send(tasks) 

        await req.user.populate({
            path:'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }                                                                                   //descending is -1, ascending is +1
        }).execPopulate()                                                                       //populate tasks of the owner          
        
        res.send(req.user.tasks)
    }catch(e){
        res.status(500).send(e)
    }
})




router.get('/tasks/:id', auth, async (req, res)=>{
    const _id = req.params.id
    
    try{
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    } 
})

router.patch('/tasks/:id', auth, async (req, res) => {    
    const updates = Object.keys(req.body)
    
    try{
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        
        if(!task){
            res.status(404).send()
        }

        updates.forEach((update)=>{
            task[update] = req.body[update]
        })
        
        await task.save()
        res.send(task)
    }catch(e){
        res.status(500).send(e)    
    }
})

router.delete("/tasks/:id", auth, async (req,res)=>{
    try{
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if(!task){
            res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

module.exports = router