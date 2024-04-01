import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/users.model.js";
import jwt from "jsonwebtoken";
import {ApiResponce} from "../utils/ApiResponce.js";
import {ApiError} from "../utils/ApiError.js";
import mongoose from "mongoose";
import {sendMail} from "../utils/nodemailer.js";
import {Web} from "../models/webs.model.js";
import {Follower} from "../models/followers.model.js";
import {Like} from "../models/likes.model.js"
import {Comment} from "../models/comments.model.js";
import {Collection} from "../models/collecntions.model.js";
import {Asset} from "../models/assets.model.js";
import {Replay} from "../models/replays.model.js";
import {deleteFromCloudinary } from "../utils/cloudinary.js";
import { Editor } from "../models/editor.model.js";

function validateEmail(email) {
    // Regular expression for a basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    // Test the email against the regular expression
    return emailRegex.test(email);
}

function isValidUsername(inputString) {
    // Check if the string starts or ends with "-"
    if (inputString.startsWith('-') || inputString.endsWith('-')) {
      return false;
    }
    // Check if the string contains spaces, special characters (except "-"), or capital letters
    if (/[\sA-Z!@#$%^&*()_+={}[\]:;<>,.?~\\\/]/.test(inputString)) {
      return false;
    }
    // Check if the string starts with a number
    if (/^\d/.test(inputString)) {
      return false;
    }
    // If all conditions are met, return true
    return true;
}

function generateUserVerificationToken({email,fullName,_id}) {
    const token = jwt.sign({email,fullName,_id},process.env.USER_VERIFICATION_TOKEN_SECRET,{expiresIn:process.env.USER_VERIFICATION_TOKEN_EXPIRY});
    return token;
}

const registerUser = asyncHandler(async(req,res)=>{
    // get username,email,password,fullName from req.body
    const {username,email,password,fullName,verificationURL} = req.body;
    // check if username,email,password,fullName exists or not
    if(!username || !email || !password || !fullName || !verificationURL){
        throw new ApiError(400,"All fields are required");
    }
    // check if password is atleast 8 characters long or not
    if (password.length < 8) {
        throw new ApiError(400,"Password must be atleast 8 characters long");
        
    }
    // validate email
    if (!validateEmail(email)) throw new ApiError(400,"Invalid email address");
    // validate username
    if (!isValidUsername(username.trim())) throw new ApiError(400,"Invalid username");
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
        throw new ApiError(500,"Something went wrong while creating user");
    }

    await Editor.create({owner:new mongoose.Types.ObjectId(user._id)});
    
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
    const {identifier,password} = req.body;
    // check if username or email and password exists
    if (!identifier) {
        throw new ApiError(400,"Username or email is required");
    }
    if (!password) {
        throw new ApiError(400,"Password is required");
    }
    // find user by username or email
    const user = await User.findOne({$or:[{username:identifier},{email:identifier}]}).select("-pined"); // find user by username or email
    // check if user exists
    if (!user) {
        throw new ApiError(404,"user dose not exists");
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
            throw new ApiError(500,"Something went wrong while updating refresh token");
        }
    }
    // generate access token
    const accessToken = user.generateAccessToken();
    const refreshToken = user.refreshToken;
    // find user by id and send response
    const logedInUser = await User.findById(user._id).select("-password -refreshToken -__v -pined -showcase");

    const options = {
        httpOnly: true,
        SameSite: "None",
        Secure: true,
    }
    // send response
    return res
    .status(200)
    .cookie("refreshToken",refreshToken,{...options,maxAge: (86400000*30)})
    .cookie("accessToken",accessToken,{...options,maxAge: 43200000})
    .json(new ApiResponce(200,{accessToken,refreshToken,user:logedInUser},"User logged in successfully"));
})

const logoutUser = asyncHandler(async(req,res)=>{
    // get user from req.user
    const user = req.user;
    // get fromAllDevices from req.query
    const {fromAllDevices = "true"} = req.query;

    // check fromAllDevices is true or false
    if (fromAllDevices == "true") {
        // if fromAllDevices is true then remove refreshToken from user
        const Updateduser = await User.findByIdAndUpdate(user?._id,{$unset:{refreshToken:1}},{new:true}).select("username email");
        
        if (!Updateduser) {
            throw new ApiError(400,"Something went wrong while logging out");
        }
    }


    const options = {
        httpOnly: true,
        SameSite: "None",
        Secure: true,
    }
    // send response
    return res
    .status(200)
    .clearCookie("refreshToken",{...options,maxAge: (86400000*30)})
    .clearCookie("accessToken",{...options,maxAge: 43200000})
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
        .cookie("accessToken",accessToken,{  
            httpOnly: true,
            SameSite: "None",
            Secure: true,
            maxAge: 43200000,
        })
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
    const user = await User.findById(req.user?._id).select("-password -refreshToken -__v -pined -showcase");
    // get verificationURL from req.body
    const {verificationURL} = req.body;
    // check verificationURL is Provided or not
    if (!verificationURL) {
        throw new ApiError(400,"verificationURL is requird")
    }
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
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken -__v -pined -showcase");
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
        .json(new ApiResponce(200,savedUser,"Email verified successfully"));
} catch (error) {
    throw new ApiError(403,error.message);
}
})

const requestForgotPasswordEmail = asyncHandler(async(req,res)=>{
    // get email from req.body
    const {email,resetPasswordURL} = req.body;
    // check if email exists or not
    if (!email) {
        throw new ApiError(400,"Email is required");
    }
    // check resetPasswordURL is provided or not
    if (!resetPasswordURL) {
        throw new ApiError(400,"resetPasswordURL is required")
    }
    // validate email
    if (!validateEmail(email)) throw new ApiError(400,"Invalid email address");
    // find user by email
    const user = await User.findOne({email:email}).select("-password -refreshToken -__v -pined -showcase");
    // check if user exists or not
    if (!user) {
        throw new ApiError(400,"User dose not exists");
    }
    // create verification token and send verification email
    const redirectURL = `${resetPasswordURL}?token=${generateUserVerificationToken(user)}`
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
        const user = await User.findById(decodedToken?._id).select("-pined -showcase");

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
    const user = await User.findById(req.user?._id).select("-password -refreshToken -__v -pined -showcase");
    // check if user exists or not
    if (!user) {
        throw new ApiError(400,"user dose not exists");
    }
    // if fullName,bio,link1,link2,link3 exists then update user
    if (fullName && fullName.trim()!=="") {
        user.fullName = fullName;
    }
    if (bio && bio.trim()!=="") {
        user.bio = bio;
    }
    if (link1 && link1.trim()!=="") {
        user.link1 = link1;
    }
    if (link2 && link2.trim()!=="") {
        user.link2 = link2;
    }
    if (link3 && link3.trim()!=="") {
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
    .json(new ApiResponce(200,savedUser,"Chenges Saved successfully"));
})

const chengePassword = asyncHandler(async(req,res)=>{
    // find user by req.user._id
    const user = await User.findById(req.user?._id).select("-__v -pined -showcase");
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
    const user = await User.findById(req.user?._id).select("-__v -pined -showcase");
    // get email and password from req.body
    const {email,password,verificationURL=""} = req.body;
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

    savedUser.password = "";
    savedUser.refreshToken = "";

    // send response
    res
    .status(200)
    .json(new ApiResponce(200,savedUser,"Email changed successfully"));

    const redirectURL = `${verificationURL}?token=${generateUserVerificationToken(user)}`

    await sendMail({email:user.email,fullName:user.fullName,mailType:"changeEmail",url:redirectURL});

    return;
})

const deleteUser = asyncHandler(async(req,res)=>{
    // find user by req.user._id
    const user = await User.findById(req.user?._id).select("-__v -pined -showcase");
    // get password from req.body
    const {password} = req.params;
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
    // check if user deleted or not
    if (!deletedUser) {
        throw new ApiError(400,"Something went wrong while deleting user");
    }
    // delete user Editor settings
    await Editor.deleteOne({owner:new mongoose.Types.ObjectId(user._id)});
    // delete user's webs
    await Web.deleteMany({owner:new mongoose.Types.ObjectId(user._id)});
    // delete user's followers and following
    await Follower.deleteMany({$or:[{profile:new mongoose.Types.ObjectId(user._id)},{followedBy:new mongoose.Types.ObjectId(user._id)}]});
    // delete user's likes
    await Like.deleteMany({likedBy:new mongoose.Types.ObjectId(user._id)});
    // delete user's comments
    await Comment.deleteMany({owner:new mongoose.Types.ObjectId(user._id)});
    // delete user's collections
    await Collection.deleteMany({owner:new mongoose.Types.ObjectId(user._id)});
    // delete user's assets
    await Asset.deleteMany({owner:new mongoose.Types.ObjectId(user._id)});
    // delete user's replays
    await Replay.deleteMany({owner:new mongoose.Types.ObjectId(user._id)});
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
    const user = await User.findById(req.user?._id).select("-password -refreshToken -__v -pined -showcase");
    // check if user exists or not
    if (!user) {
        throw new ApiError(400,"user dose not exists");
    }
    // if user already have avatar then delete it from cloudinary
    if (user.avatarPublicId !== "vbhdn2mo3facgwbanema") {
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
    const user = await User.findById(req.user?._id).select("-password -refreshToken -__v -pined -showcase");
    // check if user exists or not
    if (!user) {
        throw new ApiError(400,"user dose not exists");
    }
    // if user already have coverImage then delete it from cloudinary
    if (user.coverImagePublicId !== "l1bthaxmnngyxabxmhwi") {
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
    .json(new ApiResponce(200,savedUser,"Cover Image updated successfully"));

})

const getUserProfile = asyncHandler(async(req,res)=>{
    // get username from req.params
    const {username} = req.params;
    // get currentUser from req.user
    if (!username) {
        throw new ApiError(400,"username is required");
    }

    let isFollowedByMe,isLikedByMe;
    // check if currentUser exists or not and set isFollowing and isLiked
    if(req.user){
        isFollowedByMe={
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(req.user?._id),"$followers.followedBy"]
                },
                then:true,
                else:false
            }
        };
        isLikedByMe={
            $cond: {
                if: {$in: [new mongoose.Types.ObjectId(req.user?._id), "$likes.likedBy"]},
                then: true,
                else: false
            }
        };
    }else{
        isFollowedByMe= false;
        isLikedByMe =false;
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
                        $lookup:{
                            from:"comments",
                            localField:"_id",
                            foreignField:"web",
                            as:"comments"
                        }
                    },
                    {
                        $addFields:{
                            likesCount:{
                                $size:"$likes"
                            },
                            commentsCount:{
                                $size:"$comments"
                            },
                            isLikedByMe:isLikedByMe
                        }
                    },
                    {
                        $project:{
                            likes:0,
                            comments:0,
                            html:0, 
                            css:0, 
                            js:0, 
                            cssLinks:0, 
                            jsLinks:0, 
                            htmlLinks:0
                        }
                    }
                ]
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
            $addFields:{
                followersCount:{$size:"$followers"},
                followingCount:{$size:"$following"},
                isFollowedByMe:isFollowedByMe
            }
        },
        {
            $project:{
                password:0,
                refreshToken:0,
                followers:0,
                following:0,
                pined:0,
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

const getShowcaseItems = asyncHandler(async(req,res)=>{
    // get username from req.params
    const {username} = req.params;
    let isLiked;
    if (req.user) {
        isLiked = {
            $cond: {
                if: {$in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"]},
                then: true,
                else: false
            }
        }
    }else{
        isLiked = false;
    };
    // get showcase items from database
    const items = await User.aggregate([
        {
            $match:{
                username:username
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
                        $lookup:{
                            from:"comments",
                            localField:"_id",
                            foreignField:"web",
                            as:"comments"
                        }
                    },
                    {
                        $addFields:{
                            likesCount:{
                                $size:"$likes"
                            },
                            commentsCount:{
                                $size:"$comments"
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
                            commentsCount:1,
                            isLiked:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$showcase"
        },
        {
            $replaceRoot:{
                newRoot:"$showcase"
            }
        }
    ]);

    // check if items exists or not
    if (!items) throw new ApiError(500,"something went wrong while geting showcase items")

    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,items,"Showcase items get successfully"));
})

const getPinedItems = asyncHandler(async(req,res)=>{
    const {page=1,limit=10} = req.query;
    // get user from database
    const aggregate = User.aggregate([
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
                                    $lookup:{
                                        from:"followers",
                                        localField:"_id",
                                        foreignField:"profile",
                                        as:"followers"
                                    }
                                },
                                {
                                    $addFields:{
                                        followersCount:{
                                            $size:"$followers"
                                        },
                                        isFollowedByMe:{
                                            $cond:{
                                                if:{
                                                    $in:[new mongoose.Types.ObjectId(req.user?._id),"$followers.followedBy"]
                                                },
                                                then:true,
                                                else:false
                                            }
                                        }
                                    }
                                },
                                {
                                    $project:{
                                        followersCount:1,
                                        isFollowedByMe:1,
                                        username:1,
                                        fullName:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"web",
                            as:"likes"
                        }
                    },
                    {
                        $lookup:{
                            from:"comments",
                            localField:"_id",
                            foreignField:"web",
                            as:"comments"
                        }
                    },
                    {
                        $addFields:{
                            owner:{$first:"$owner"},
                            likesCount:{
                                $size:"$likes"
                            },
                            commentsCount:{
                                $size:"$comments"
                            },
                            isLikedByMe:{
                                $cond: {
                                    if: {$in: [new mongoose.Types.ObjectId(req.user?._id), "$likes.likedBy"]},
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            likes:0,
                            comments:0,
                            html:0, 
                            css:0, 
                            js:0, 
                            cssLinks:0, 
                            jsLinks:0, 
                            htmlLinks:0
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$pined"
        },
        {
            $replaceRoot:{
                newRoot:"$pined"
            }
        }
    ]);

    const pinedItems = await User.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    });
    // check if user exists or not
    if(!pinedItems) throw new ApiError(500,"something went wrong while geting pined items")
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,pinedItems,"Pined items get successfully"));
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
    .select("_id username");
    // check if user exists or not
    if (!user) throw new ApiError(400,"User dose not exists");
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,{},"Web added to pined items successfully"));
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
    .select("_id username");
    // check if user exists or not
    if (!user) throw new ApiError(400,"User dose not exists");
    // send response
    return res 
    .status(200)
    .json(new ApiResponce(200,{},"Web removed from pined items successfully"));
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

const checkUsernameAvailablity = asyncHandler(async(req,res)=>{
    // get username from req.params
    const {username} = req.params;
    // check if username exists or not
    if (!username) {
        throw new ApiError(400,"username is required");
    }
    // find user by username
    const user = await User.findOne({username:username}).select("_id username");
    // check if user exists or not
    if (user) {
        throw new ApiError(400,"Username already exists");
    }
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,{},"Username available"));
})

const searchUsers = asyncHandler(async(req,res)=>{
    // get search from req.query
    const {search,page=1,limit=6} = req.query;
    // check if search exists or not
    if (!search) {
        throw new ApiError(400,"search is required");
    }
    // check if user is logged in or not
    let isFollowedByMe;
    if (req.user) {
        isFollowedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(req.user?._id),"$followers.followedBy"]
                },
                then:true,
                else:false
            }
        };
    } else {
        isFollowedByMe = false;
    }
    // find user by search
    const aggregate = User.aggregate([
        {
            $match:{
                $or:[
                    {username:search},
                    {$text:{$search:search}}
                ]
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
                from:"webs",
                localField:"_id",
                foreignField:"owner",
                as:"webs",
                pipeline:[
                    {
                        $match:{
                            isPublic:true
                        }
                    },
                    {
                        $sort:{
                            views:-1
                        }
                    },
                    {
                        $project:{
                            title:1,
                            _id:1,
                            image:1,
                            views:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                websCount:{
                    $size:"$webs"
                },
                followersCount:{
                    $size:"$followers"
                },
                isFollowedByMe:isFollowedByMe,
                webs:{$slice:["$webs",2]},
                score:{$meta:"textScore"},
                totalWebViews:{
                    $sum:"$webs.views"
                },
            }
        },
        {
            $sort:{
                score:-1,
                followersCount:-1,
            }
        },
        {
            $project:{
                followersCount:1,
                totalWebViews:1,
                websCount:1,
                username:1,
                fullName:1,
                avatar:1,
                webs:1,
                isVerified:1,
                isFollowedByMe:1
            }
        }
    ]);

    const users = await User.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    });

    // check if users exists or not
    if (!users) {
        throw new ApiError(500,"something went wrong while searching users");
    }

    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,users,"Users get successfully"));
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
    getShowcaseItems,
    getPinedItems,
    addToPinedItems,
    removePinedItem,
    updateShowcase,
    checkUsernameAvailablity,
    searchUsers
}