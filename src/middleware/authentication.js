const jwt = require("jsonwebtoken")
const User = require("../models/user")

const auth = async (req, res, next) => {
    // console.log("Authenticating.....")
    // next()
    try{
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'thisisNODEJSCOURSE')
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})   //tokens store all the tokens generated when user logs-in. When the user logs out that token is removed. So we check whther the user is still logged in ie, the token still exists
    
        if(!user){
            throw new Error()
        }

        req.token = token
        req.user = user
        next()
    } catch (e){
        res.status(401).send({error: 'Please Authenticate.....'})
    }
}

module.exports = auth