import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/users.model.js";
import jwt from "jsonwebtoken";
import {ApiResponce} from "../utils/ApiResponce.js";
import {ApiError} from "../utils/ApiError.js";
import mongoose from "mongoose";
import {sendMail} from "../utils/nodemailer.js";
import {Web} from "../models/webs.model.js"
import {uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";

function validateEmail(email) {
    // Regular expression for a basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    // Test the email against the regular expression
    return emailRegex.test(email);
}

function generateUserVerificationToken({email,fullName,_id}) {
    const token = jwt.sign({email,fullName,_id},process.env.USER_VERIFICATION_TOKEN_SECRET,{expiresIn:process.env.USER_VERIFICATION_TOKEN_EXPIRY});
    return token;
}

const registerUser = asyncHandler(async(req,res)=>{
    // get username,email,password,fullName from req.body
    const {username,email,password,fullName,verificationURL=""} = req.body;
    // check if username,email,password,fullName exists or not
    if(!username || !email || !password || !fullName){
        throw new ApiError(400,"All fields are required");
    }
    // check if password is atleast 8 characters long or not
    if (password.length < 8) {
        throw new ApiError(400,"Password must be atleast 8 characters long");
        
    }
    // validate email
    if (!validateEmail(email)) throw new ApiError(400,"Invalid email address");
    // check if user already exists
    const existeduser = await User.findOne({$or:[{username:username},{email:email}]});
    
    if (existeduser) {
        throw new ApiError(400,"User already exists");
    }
    // create user
    const user = await User.create({
        username,
        email,
        password,
        fullName
    });

    if (!user) {
        throw new ApiError(400,"Something went wrong while creating user");
    }
    
    const newUser = {
        username:user.username,
        email:user.email,
        fullName:user.fullName,
        _id:user._id
    }
    // send response
    res.status(201)
    .json(new ApiResponce(201,newUser,"User created successfully"));
    // create verification token
    const redirectURL = `${verificationURL}?token=${generateUserVerificationToken(newUser)}`
    // send verification email
    await sendMail({email,fullName,mailType:"welcomeEmail",url:redirectURL});

    return;

})

const loginUser = asyncHandler(async(req,res)=>{
    // get username or email and password from req.body
    const {username,email,password} = req.body;
    // check if username or email and password exists
    if (!username && !email) {
        throw new ApiError(400,"Username or email is required");
    }
    if (!password) {
        throw new ApiError(400,"Password is required");
    }
    // find user by username or email
    const user = await User.findOne({$or:[{username:username},{email:email}]}).select("-pined"); // find user by username or email
    // check if user exists
    if (!user) {
        throw new ApiError(400,"user dose not exists");
    }
    // check if password is correct
    const isCorrectPassword = await user.isPasswordMatch(password)
    // if password is incorrect
    if (!isCorrectPassword) {
        throw new ApiError(400,"Invalid credentials");
    }
    // if password is correct then check if user has refresh token or not
    if (!user.refreshToken) {
        // if user dose not have refresh token then generate refresh token and save it to database
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        const savedUser = await user.save({validateBeforeSave:false});
        // check if user saved or not
        if (!savedUser) {
            throw new ApiError(400,"Something went wrong while updating refresh token");
        }
    }
    // generate access token
    const accessToken = user.generateAccessToken();
    const refreshToken = user.refreshToken;
    // find user by id and send response
    const logedInUser = await User.findById(user._id).select("-password -refreshToken -__v -pined");

    const options = {
        httpOnly: true,
        secure: true
    }
    // send response
    return res
    .status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(new ApiResponce(200,{accessToken,refreshToken,user:logedInUser},"User logged in successfully"));
})

const logoutUser = asyncHandler(async(req,res)=>{
    // get user from req.user
    const user = req.user;
    // get fromAllDevices from req.query
    const {fromAllDevices = true} = req.query;

    // check fromAllDevices is true or false
    if (fromAllDevices) {
        // if fromAllDevices is true then remove refreshToken from user
        const Updateduser = await User.findByIdAndUpdate(user?._id,{$unset:{refreshToken:1}},{new:true}).select("username email");
        if (!Updateduser) {
            throw new ApiError(400,"Something went wrong while logging out");
        }
    }

    const options = {
        httpOnly: true,
        secure: true
    }
    // send response
    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(new ApiResponce(200,{},"User logged out successfully"));
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
try {
    // get refreshToken from req.cookies or req.header
        const refreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ","");
        if (!refreshToken) {
            throw new ApiError(403,"Unauthorized request");
            
        }
    // verify refreshToken
        const decodedToken = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
        if (!decodedToken) {
            throw new ApiError(403,"Unauthorized request");
        }
    // find user by id and check if refreshToken is valid
        const user = await User.findById(decodedToken?._id);
        if (!user || user.refreshToken !== refreshToken) {
            throw new ApiError(403,"Unauthorized request");
        }
    // generate new accessToken
        const accessToken = user.generateAccessToken();
    // send response
        return res
        .status(200)
        .cookie("accessToken",accessToken,{httpOnly:true,secure:true})
        .json(new ApiResponce(200,{accessToken},"Access token refreshed successfully"));
} catch (error) {
    throw new ApiError(403,"Unauthorized request");
}
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    // get user from req.user
    const user = req.user;
    return res
    .status(200)
    .json(new ApiResponce(200,user,"User get successfully"));
})

const requestVerifyEmail = asyncHandler(async(req,res)=>{
    // get _id from req.user and find user by _id
    const user = await User.findById(req.user?._id).select("-password -refreshToken -__v -pined");
    // get verificationURL from req.body
    const {verificationURL=""} = req.body;
    // check if user exists or not
    if (!user) {
        throw new ApiError(400,"User dose not exists");
    }
    // check if user is already verified or not
    if (user.isVerified) {
        throw new ApiError(400,"Email already verified");
    }
    // create verification token and send verification email
    const redirectURL = `${verificationURL}?token=${generateUserVerificationToken(user)}`
    await sendMail({email:user.email,fullName:user.fullName,mailType:"verifyEmail",url:redirectURL});
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,{},"Email verification link sent successfully"));
})

const verifyEmail = asyncHandler(async(req,res)=>{
    // get token from req.body
    const {token} = req.body;
    // check if token exists or not
    if (!token) {
        throw new ApiError(403,"unauthorized request");
    }
try {
    // verify token
        const decodedToken = jwt.verify(token,process.env.USER_VERIFICATION_TOKEN_SECRET);
        if (!decodedToken) {
            throw new ApiError(403,"Invalid token");
        }
        // find user by id and check if user exists or not
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken -__v -pined");
        if (!user) {
            throw new ApiError(403,"User dose not exists");
        }
        // check if user is already verified or not
        if (user.isVerified) {
            throw new ApiError(403,"Email already verified");
        }
        // if everything is fine then set isVerified to true and save user
        user.isVerified = true;
        const savedUser = await user.save({validateBeforeSave:false});
        // check if user saved or not
        if (!savedUser) {
            throw new ApiError(400,"Something went wrong while updating avatar");
        }
        // send response
        return res
        .status(200)
        .json(new ApiResponce(200,{},"Email verified successfully"));
} catch (error) {
    throw new ApiError(403,error.message);
}
})

const requestForgotPasswordEmail = asyncHandler(async(req,res)=>{
    // get email from req.body
    const {email,verificationURL=""} = req.body;
    // check if email exists or not
    if (!email) {
        throw new ApiError(400,"Email is required");
    }
    // validate email
    if (!validateEmail(email)) throw new ApiError(400,"Invalid email address");
    // find user by email
    const user = await User.findOne({email:email}).select("-password -refreshToken -__v -pined");
    // check if user exists or not
    if (!user) {
        throw new ApiError(400,"User dose not exists");
    }
    // create verification token and send verification email
    const redirectURL = `${verificationURL}?token=${generateUserVerificationToken(user)}`
    await sendMail({email:user.email,fullName:user.fullName,mailType:"forgotPassword",url:redirectURL});
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,{},"Password reset link sent successfully"));
})

const resetPassword = asyncHandler(async(req,res)=>{
    // get newPassword and token from req.body
    const { newPassword, token } = req.body;
    // check if newPassword exists or not
    if (!newPassword) {
        throw new ApiError(400,"password is required");
    }
    // check if newPassword is atleast 8 characters long or not
    if (newPassword.length < 8) {
        throw new ApiError(400,"Password must be atleast 8 characters long");
    }
    // check token exists or not
    if (!token) {
        throw new ApiError(403,"unauthorized request");
    }
    try {
        // verify token
        const decodedToken = jwt.verify(token,process.env.USER_VERIFICATION_TOKEN_SECRET);
        if (!decodedToken) {
            throw new ApiError(403,"unauthorized request");
        }
        // find user by id and check if user exists or not
        const user = await User.findById(decodedToken?._id).select("-pined");

        if (!user) throw new ApiError(400,"User dose not exists");
        // if everything is fine then change password and save user
        user.password = newPassword;
        const savedUser = await user.save({validateBeforeSave:false});
        // check if user saved or not
        if (!savedUser) {
            throw new ApiError(400,"Something went wrong while resetting password");
        }
        // send response
        return res
        .status(200)
        .json(new ApiResponce(200,{},"Password reset successfully"));
    } catch (error) {
        throw new ApiError(403,error.message);
    }
    
})

const Updateduser = asyncHandler(async(req,res)=>{
    // get fullName,bio,link1,link2,link3 from req.body
    const {fullName,bio,link1,link2,link3} = req.body;
    // check if fullName,bio,link1,link2,link3 exists or not
    if (!fullName && !bio && !link1 && !link2 && !link3) {
        throw new ApiError(400,"atleast one field is required"); 
    }
    // find user by req.user._id
    const user = await User.findById(req.user?._id).select("-password -refreshToken -__v -pined");
    // check if user exists or not
    if (!user) {
        throw new ApiError(400,"user dose not exists");
    }
    // if fullName,bio,link1,link2,link3 exists then update user
    if (fullName) {
        user.fullName = fullName;
    }
    if (bio) {
        user.bio = bio;
    }
    if (link1) {
        user.link1 = link1;
    }
    if (link2) {
        user.link2 = link2;
    }
    if (link3) {
        user.link3 = link3;
    }
    // save user
    const savedUser = await user.save({validateBeforeSave:false});
    // check if user saved or not
    if (!savedUser) {
        throw new ApiError(400,"Something went wrong while updating user info");
    }

    savedUser.password = "";
    savedUser.refreshToken = "";
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,savedUser,"User updated successfully"));
})

const chengePassword = asyncHandler(async(req,res)=>{
    // find user by req.user._id
    const user = await User.findById(req.user?._id).select("-__v -pined");
    // get oldPassword and newPassword from req.body
    const {oldPassword,newPassword} = req.body;
    // check if oldPassword and newPassword exists
    if (!oldPassword || !newPassword) {
        throw new ApiError(400,"All fields are required");
    }
    // check if oldPassword is correct or not
    const isCorrectPassword = await user.isPasswordMatch(oldPassword);
    if (!isCorrectPassword) {
        throw new ApiError(400,"Invalid credentials");
    }
    // check if oldPassword and newPassword are same or not
    if (oldPassword === newPassword) {
        throw new ApiError(400,"New password must be different from old password");
    }
    // check if newPassword is atleast 8 characters long or not
    if (newPassword.length < 8) {
        throw new ApiError(400,"Password must be atleast 8 characters long");
    }
    // if everything is fine then change password
    user.password = newPassword;
    const savedUser = await user.save({validateBeforeSave:false});
    // check if user saved or not
    if (!savedUser) {
        throw new ApiError(400,"Something went wrong while updating password");
    }
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,{},"Password changed successfully"));
})

const chengeEmail = asyncHandler(async(req,res)=>{
    // find user by req.user._id
    const user = await User.findById(req.user?._id).select("-__v -pined");
    // get email and password from req.body
    const {email,password,verificationURL} = req.body;
    // check if email and password exists
    if (!email || !password) {
        throw new ApiError(400,"All fields are required");
    }
    // validate email
    if (!validateEmail(email)) throw new ApiError(400,"Invalid email address");
    // check new email and old email are same or not
    if (user.email === email) {
        throw new ApiError(400,"New email must be different from old email");
    }
    // check email already exists or not
    const isEmailExists = await User.findOne({email:email}).select("_id email");

    if (isEmailExists) {
        throw new ApiError(400,"Email already exists");
    }
    // check if password is correct or not
    const isCorrectPassword = await user.isPasswordMatch(password);

    if (!isCorrectPassword) {
        throw new ApiError(400,"Invalid credentials");
    }
    // if everything is fine then change email
    user.email = email;
    user.isVerified = false;
    const savedUser = await user.save({validateBeforeSave:false});
    // check if user saved or not
    if (!savedUser) {
        throw new ApiError(400,"Something went wrong while updating email");
    }

    // send response
    res
    .status(200)
    .json(new ApiResponce(200,{},"Email changed successfully"));

    const redirectURL = `${verificationURL}?token=${generateUserVerificationToken(user)}`

    await sendMail({email:user.email,fullName:user.fullName,mailType:"changeEmail",url:redirectURL});

    return;
})

const deleteUser = asyncHandler(async(req,res)=>{
    // find user by req.user._id
    const user = await User.findById(req.user?._id).select("-__v -pined");
    // get password from req.body
    const {password} = req.body;
    // check if password exists or not
    if (!password) {
        throw new ApiError(400,"Password is required");
    }
    // check if password is correct or not
    const isCorrectPassword = await user.isPasswordMatch(password);

    if (!isCorrectPassword) {
        throw new ApiError(400,"Invalid credentials");
    }
    // if everything is fine then delete user
    const deletedUser = await User.findByIdAndDelete(user._id);

    if (!deletedUser) {
        throw new ApiError(400,"Something went wrong while deleting user");
    }
    // send response
    return res
    .status(200)
    .clearCookie("refreshToken")
    .clearCookie("accessToken")
    .json(new ApiResponce(200,{},"User deleted successfully"));
})

const updateAvatar = asyncHandler(async(req,res)=>{
    // get image and public_id from req.body
    const {image,public_id} = req.body;
    // check if image and public_id exists or not
    if (!image || !public_id) {
        throw new ApiError(400,"image and public_id is required");
    }
    // find user by req.user._id
    const user = await User.findById(req.user?._id).select("-password -refreshToken -__v -pined");
    // check if user exists or not
    if (!user) {
        throw new ApiError(400,"user dose not exists");
    }
    // if user already have avatar then delete it from cloudinary
    if (!user.avatarPublicId === "vbhdn2mo3facgwbanema") {
        // delete image from cloudinary
        const deleted = await deleteFromCloudinary(user.avatarPublicId); 
        // check if image deleted or not
        if (!deleted) {
            throw new ApiError(400,"Something went wrong while deleting image from cloudinary");
        }
    }
    // update avatar and avatarPublicId
    user.avatar = image;
    user.avatarPublicId = public_id;
    // save user
    const savedUser = await user.save({validateBeforeSave:false});
    // check if user saved or not
    if (!savedUser) {
        throw new ApiError(400,"Something went wrong while updating avatar");
    }
    // set password and refreshToken to empty string
    savedUser.password = "";
    savedUser.refreshToken = "";
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,savedUser,"Avatar updated successfully"));

})

const updateCoverImage = asyncHandler(async(req,res)=>{
    // get image and public_id from req.body
    const {image,public_id} = req.body;
    // check if image and public_id exists or not
    if (!image || !public_id) {
        throw new ApiError(400,"image and public_id is required");
    }
    // find user by req.user._id
    const user = await User.findById(req.user?._id).select("-password -refreshToken -__v -pined");
    // check if user exists or not
    if (!user) {
        throw new ApiError(400,"user dose not exists");
    }
    // if user already have coverImage then delete it from cloudinary
    if (!user.coverImagePublicId === "l1bthaxmnngyxabxmhwi") {
        // delete image from cloudinary
        const deleted = await deleteFromCloudinary(user.coverImagePublicId); 
        // check if image deleted or not
        if (!deleted) {
            throw new ApiError(400,"Something went wrong while deleting image from cloudinary");
        }
    }
    // update coverImage and coverImagePublicId
    user.coverImage = image;
    user.coverImagePublicId = public_id;
    // save user
    const savedUser = await user.save({validateBeforeSave:false});
    // check if user saved or not
    if (!savedUser) {
        throw new ApiError(400,"Something went wrong while updating cover image");
    }
    // set password and refreshToken to empty string
    savedUser.password = "";
    savedUser.refreshToken = "";
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,savedUser,"Avatar updated successfully"));

})

const getUserProfile = asyncHandler(async(req,res)=>{
    // get username from req.params
    const {username} = req.params;
    // check if username exists or not
    if (!username) {
        throw new ApiError(400,"username is required");
    }
    let currentUser;

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
        .select("_id username email");
        // check if user exists
        if (!user) {
            throw new ApiError(403,"Unauthorized request");
        }
        // set user to req.user
        currentUser = user;

    } catch (error) {
        // if error then set currentUser to null
        currentUser = null;
    }

    let isFollowing,isLiked;

    if(currentUser){
        isFollowing = {
            $cond: {
                if: {$in: [currentUser?._id, "$followers.followedBy"]},
                then: true,
                else: false
            }
        };
        isLiked = {
            $cond: {
                if: {$in: [currentUser?._id, "$likes.likedBy"]},
                then: true,
                else: false
            }
        }
    }else{
        isFollowing = false;
        isLiked = false;
    }

    // get profile
    const profile = await User.aggregate([
        {
            $match:{
                username:username
            }
        },
        {
            $lookup:{
                from:"followers",
                localField:"_id",
                foreignField:"profile",
                as:"followers"
            }
        },
        {
            $lookup:{
                from:"followers",
                localField:"_id",
                foreignField:"followedBy",
                as:"following"
            }
        },
        {
            $lookup:{
                from:"webs",
                localField:"showcase",
                foreignField:"_id",
                as:"showcase",
                pipeline:[
                    {
                        $lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"web",
                            as:"likes"
                        }
                    },
                    {
                        $addFields:{
                            likesCount:{
                                $size:"$likes"
                            },
                            isLiked:isLiked
                        }
                    },
                    {
                        $project:{
                            title:1,
                            description:1,
                            image:1,
                            html:1,
                            css:1,
                            js:1,
                            public_id:1,
                            views:1,
                            likesCount:1,
                            isLiked:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                followersCount:{$size:"$followers"},
                followingCount:{$size:"$following"},
                isFollowing:isFollowing
            }
        },
        {
            $project:{
                password:0,
                refreshToken:0,
                followers:0,
                following:0,
                pined:0
            }
        }
    ])
    // check if profile exists or not
    if (profile.length === 0) {
        throw new ApiError(400,"user dose not exists");
    }
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,profile[0],"User profile get successfully"));
})

const getPinedItems = asyncHandler(async(req,res)=>{
    const {page=1,limit=10} = req.query;
    // get user from database
    const user = await User.aggregatePaginate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"webs",
                localField:"pined",
                foreignField:"_id",
                as:"pined",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        avatar:1,
                                        fullName:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{$first:"$owner"}
                        }
                    }
                ]
            }
        }
    ],{page:page,limit:limit})
    // check if user exists or not
    if (user.length === 0) {
        throw new ApiError(400,"user dose not exists");
    }
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,user[0].pined,"Pined items get successfully"));
})

const addToPinedItems = asyncHandler(async(req,res)=>{
    // get webId from req.params
    const {webId} = req.params;
    // check if webId exists or not
    if (!webId) {
        throw new ApiError(400,"webId is required");
    }
    // find web by webId
    const web = await Web.findById(webId);
    // check if web exists or not
    if (!web) throw new ApiError(400,"Web dose not exists");
    // find user by req.user._id and add webId to pined items
    const user = await User.findByIdAndUpdate(req.user?._id,{$addToSet:{pined:new mongoose.Types.ObjectId(webId)}},{new:true})
    .select("-password -refreshToken -__v");
    // check if user exists or not
    if (!user) throw new ApiError(400,"User dose not exists");
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,user,"Web added to pined items successfully"));
})

const removePinedItem = asyncHandler(async(req,res)=>{
    // get webId from req.params
    const {webId} = req.params;
    // check if webId exists or not
    if (!webId) {
        throw new ApiError(400,"webId is required");
    }
    // remove webId from pined items
    const user = await User.findByIdAndUpdate(req.user?._id,{$pull:{pined:new mongoose.Types.ObjectId(webId)}},{new:true})
    .select("-password -refreshToken -__v");
    // check if user exists or not
    if (!user) throw new ApiError(400,"User dose not exists");
    // send response
    return res 
    .status(200)
    .json(new ApiResponce(200,user,"Web removed from pined items successfully"));
})

const updateShowcase = asyncHandler(async(req,res)=>{
    // get showcase from req.body
    const {showcase} = req.body;
    // check if showcase exists or not
    if (!showcase) {
        throw new ApiError(400,"showcase is required");
    }
    // convert each showcase string element into mongoose objectId
    showcase.forEach((element,index) => {
        showcase[index] = new mongoose.Types.ObjectId(element)
    });
    // find user by req.user._id and update showcase
    const user = await User.findByIdAndUpdate(req.user?._id,{$set:{showcase:showcase}},{new:true}).select("email username showcase");
    // check if user exists or not
    if (!user) throw new ApiError(400,"User dose not exists");
    // send response
    return res
    .status(200)   
    .json(new ApiResponce(200,user,"Showcase updated successfully"));
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    chengePassword,
    chengeEmail,
    deleteUser,
    requestVerifyEmail,
    verifyEmail,
    requestForgotPasswordEmail,
    resetPassword,
    Updateduser,
    updateAvatar,
    updateCoverImage,
    getUserProfile,
    getPinedItems,
    addToPinedItems,
    removePinedItem,
    updateShowcase
}