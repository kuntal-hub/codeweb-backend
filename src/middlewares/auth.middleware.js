import jwt from 'jsonwebtoken';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/users.model.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        // get token from header or cookie
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // check if token exists
        if (!token) {
            throw new ApiError(403,"Unauthorized request");
        }
        // verify token
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        // check if token is valid
        if (!decodedToken) throw new ApiError(403,"Unauthorized request");
        // find user
        const user = await User.findOne({$and:[{_id:new mongoose.Types.ObjectId(decodedToken?._id)},{refreshToken:{$exists:true}}]})
        .select("-password -refreshToken -pined");
        // check if user exists
        if (!user) {
            throw new ApiError(403,"Unauthorized request");
        }
        // set user to req.user
        req.user = user;
        next();

    } catch (error) {
        // check if token is expired or invalid
        if (error.message === "jwt expired") {
            throw new ApiError(401,"Token expired");  
        }else{
            throw new ApiError(403,"Unauthorized request");
        }
    }
})


export {verifyJWT}