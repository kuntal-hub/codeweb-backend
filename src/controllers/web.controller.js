import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import {Web} from "../models/webs.model.js";
import {Like} from "../models/likes.model.js";
import {Comment} from "../models/comments.model.js";
import { User } from '../models/users.model.js';
import {Follower} from "../models/followers.model.js";
import {Editor} from "../models/editor.model.js";
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"


const createWeb = asyncHandler(async (req, res) => {
    // get title, description, html, css, js, image, isPublic from req.body
    const {title,description,html,css,js,isPublic=true,cssLinks,jsLinks} = req.body;
    // check title, description, html, css, js, image, isPublic are provided or not
    if (!title || !description || !(html || css || js)) {
        throw new ApiError(400,"title, description and html/css/js are required");
    }
    // get image path from req.file.path
    const imageLocalPath = req.file?.path;
    // check image is provided or not
    if (!imageLocalPath) {
        throw new ApiError(400,"image is required");
    }
    // upload image on cloudinary
    const image = await uploadOnCloudinary(imageLocalPath);
    // check image is uploaded or not
    if (!image) {
        throw new ApiError(500,"something went wrong while uploading image on cloudinary");
    }
    // create web document
    const web = await Web.create({
        title,
        description:description,
        html:html || "",
        css:css || "",
        js:js || "",
        image:image.secure_url,
        public_id:image.public_id,
        owner:new mongoose.Types.ObjectId(req.user?._id),
        isPublic:isPublic === "true" ? true : false,
        cssLinks:JSON.parse(cssLinks) || [],
        jsLinks:JSON.parse(jsLinks) || []
    });
    // check web is created or not
    if (!web) {
        throw new ApiError(500,"something went wrong while creating web");
    }
    // send response
    return res
    .status(201)
    .json(new ApiResponce(201,web,"web created successfully"));

});


const createForkedWeb = asyncHandler(async (req, res) => {
    // get webId from req.params
    const {webId} = req.params;
    // get title, description, isPublic from req.body
    const {title,description,isPublic} = req.body;
    // check webId is provided or not
    if (!webId) {
        throw new ApiError(400,"webId is required");
    }
    // get web by webId
    const web = await Web.findById(webId);
    // check web is found or not
    if (!web) {
        throw new ApiError(404,"web not found, invalid webId");
    }
    // check web Owner is same as req.user or not
    if (web.owner.toString()===req.user?._id.toString()) {
        throw new ApiError(400,"you can not fork your own web");
    }
    // create forked web
    const forkedWeb = await Web.create({
        title: title? title : web.title,
        description:description ? description : web.description,
        html:web.html,
        css:web.css,
        js:web.js,
        image:web.image,
        public_id:web.public_id,
        owner:new mongoose.Types.ObjectId(req.user?._id),
        isPublic: isPublic? isPublic === "true"? true : false :true,
        forkedFrom:new mongoose.Types.ObjectId(webId),
        cssLinks:web.cssLinks,
        jsLinks:web.jsLinks
    });
    // check forked web is created or not
    if (!forkedWeb) {
        throw new ApiError(500,"something went wrong while creating web");
    }
    // send response
    return res
    .status(201)
    .json(new ApiResponce(201,forkedWeb,"web Forked successfully"));

});

const getWebWithoutDteailsById = asyncHandler(async (req,res)=>{
    // get webId from req.params
    const {webId} = req.params;
    // check webId is provided or not and is valid or not
    if (!webId || !mongoose.isValidObjectId(webId)) {
        throw new ApiError(400,"A Valid webId is required");
    }
    // get web by webId
    const web = await Web.findById(webId).select("html css js title cssLinks jsLinks");
    // check web is found or not
    if (!web) {
        throw new ApiError(404,"web not found");
    }
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,web,"web found successfully"));
})

const getWebByWebId = asyncHandler(async (req, res) => {
    // get webId from req.params
    const { webId } = req.params;
    // get userId from req.query
    const userId = req.user ? req.user._id : null;
    // check userId is provided or not
    let isFollowedByMe,isLikedByMe;
    // if userId provided then set values of isLikedByMe and isFollowedByMe else set false
    if (userId) {
        isFollowedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(userId),"$followers.followedBy"]
                },
                then:true,
                else:false
            }
        };
        isLikedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(userId),"$likes.likedBy"]
                },
                then:true,
                else:false
            }
        };
    } else {
        isFollowedByMe = isLikedByMe = false;
    }
    // check webId is provided or not
    if (!webId) {
        throw new ApiError(400,"webId is required");
    }
    // get web by webId from database
    const web = await Web.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(webId)
            }
        },
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
                            isFollowedByMe:isFollowedByMe
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
                likesCount:{
                    $size:"$likes"
                },
                commentsCount:{$size:"$comments"},
                isLikedByMe:isLikedByMe,
                owner:{$first:"$owner"}
            }
        },
        {
            $project:{
                likes:0,
                comments:0,
            }
        }
    ])
    // check web is found or not
    if (web.length < 1) {
        throw new ApiError(404,"web not found");
    }
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,web[0],"web found successfully"));
});


const getAllWebsByUserId = asyncHandler(async (req, res) => {
    // get user_id, webType, sortBy, sortOrder, page, limit from req.query
    const { webType = "public", sortBy="views", sortOrder="desc", page=1, limit=4 } = req.query;
    // get username from req.params
    const { username } = req.params;
    // sortBy = views, createdAt, likesCount, commentsCount
    // webType = public, private, forked
    // return array of webs created by usee (userId)
    // webType: public, private, forked
    // userId = the user whose webs are to be fetched
    // user_id = the user who is requesting for webs
    // check userId is provided or not
    if (!username) {
        throw new ApiError(400,"username is required");
    }
    // get user by username
    const user = await User.findOne({username}).select("_id username");
    // check user is found or not
    if (!user) throw new ApiError(404,"user not found");
    // get userId from user
    const userId = user._id;
    // check webType is valid or not
    let match,isLikedByMe;
    // if webType is private then select only private webs
    if (webType === "private") {
        match = {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
                isPublic:false
            }
        }
        // if webType is forked then select only forked webs
    } else if (webType === "forked") {
        match = {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
                forkedFrom:{$exists:true}
            }
        }
        // if webType is public then select only public webs
    } else if(webType === "public"){
        match = {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
                isPublic:true
            }
        }
        // if webType is invalid then throw error
    }else{
        throw new ApiError(400,"invalid webType");
    }
    // if req.user provided then set values of isLikedByMe and isFollowedByMe else set false
    if (req.user) {
        isLikedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
                },
                then:true,
                else:false
            }
        };
    } else {
        isLikedByMe = false;
    }
    // get webs
    const aggregate = Web.aggregate([
        match,
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
                likesCount:{
                    $size:"$likes"
                },
                commentsCount:{
                    $size:"$comments"
                },
                owner:{$first:"$owner"},
                isLikedByMe:isLikedByMe
            }
        },
        {
            $project:{
                likes:0,
                comments:0,
            }
        },
        {
            $sort:{
                [sortBy]:sortOrder === "asc" ? 1 : -1
            }
        }
    ]);

    const webs = await Web.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    });
    // check webs are found or not
    if (!webs) {
        throw new ApiError(500,"something went wrong while fetching webs");
        
    }
    //return response
    return res
    .status(200)
    .json(new ApiResponce(200,webs,"webs found successfully"));
})

const getLikedWebs = asyncHandler(async (req, res) => {
    // return array of webs liked by user
    // get username from req.params
    const {username} = req.params;
    // get sortBy, sortOrder, page, limit from req.query
    const {sortBy="createdAt",sortOrder="desc", page=1, limit=4 } = req.query;
    // sortBy = views, createdAt, likesCount, commentsCount
    // check userId is provided or not
    if (!username) {
        throw new ApiError(400,"username is required");
    }
    // get user by username
    const user = await User.findOne({username}).select("_id username");
    // check user is found or not
    if (!user) throw new ApiError(404,"user not found");
    // get userId from user
    const userId = user._id;
    // take a variable isLikedByMe
    let isLikedByMe;
    // if req.user provided then set values of isLikedByMe and isFollowedByMe else set false
    if (req.user) {
        isLikedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
                },
                then:true,
                else:false
            }
        };
    } else {
        isLikedByMe = false;
    }
    // get liked webs
    const aggregate = Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId),
                web:{$exists:true}
            }
        },
        {
            $lookup:{
                from:"webs",
                localField:"web",
                foreignField:"_id",
                as:"web",
                pipeline:[
                    {
                        $match:{
                            isPublic:true
                        }
                    },
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
                            likesCount:{
                                $size:"$likes"
                            },
                            commentsCount:{
                                $size:"$comments"
                            },
                            owner:{$first:"$owner"},
                            isLikedByMe:isLikedByMe
                        }
                    },
                    {
                        $project:{
                            likes:0,
                            comments:0,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                web:{
                    $first:"$web"
                }
            }
        },
        {
            $replaceRoot:{
                newRoot:"$web"
            }
        },
        {
            $sort:{
                [sortBy]:sortOrder === "asc" ? 1 : -1
            }
        }
    ]);

    const likedWebs = await Like.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    })

    if (!likedWebs) {
        throw new ApiError(500,"something went wrong while fetching webs");
    }
    if (likedWebs.length < 1) {
        return res
        .status(200)
        .json(new ApiResponce(200,[],"you have not liked any web yet"));
    }
    return res
    .status(200)
    .json(new ApiResponce(200,likedWebs,"webs found successfully"));
})

const getFollowingWebs = asyncHandler(async (req, res) => {
    // return array of webs created by following users
    const { sortBy="views", sortOrder="desc", page=1, limit=4 } = req.query;
    // sortBy= views, createdAt, likesCount, commentsCount

    const aggregate = Follower.aggregate([
        {
            $match:{
                followedBy:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"webs",
                localField:"profile",
                foreignField:"owner",
                as:"webs",
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
                            likesCount:{
                                $size:"$likes"
                            },
                            commentsCount:{
                                $size:"$comments"
                            },
                            owner:{$first:"$owner"},
                            isLikedByMe:{
                                $cond:{
                                    if:{
                                        $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
                                    },
                                    then:true,
                                    else:false
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            likes:0,
                            comments:0,
                        }
                    }
                ]
            }
        },
        {
            $project:{
                webs:1
            }
        },
        {
            $unwind:"$webs"
        },
        {
            $replaceRoot:{
                newRoot:"$webs"
            }
        },
        {
            $sort:{
                [sortBy]:sortOrder === "asc" ? 1 : -1
            }
        }
    ]);
    
    const followingWebs = await Follower.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    })
    
    if (!followingWebs) {
        throw new ApiError(500,"something went wrong while fetching webs");
    }

    if (followingWebs.length < 1) {
        return res
        .status(200)
        .json(new ApiResponce(200,[],"you have not followed anyone yet"));
    }

    return res
    .status(200)
    .json(new ApiResponce(200,followingWebs,"webs found successfully"));
})

const getTrendingWebs = asyncHandler(async (req, res) => {
    // return array of webs first sort by impressions(views+likes+comments) then by date
    const { page=1, limit=4 } = req.query;
    // take a variable isLikedByMe
    let isLikedByMe;
    // if req.user provided then set values of isLikedByMe and isFollowedByMe else set false
    if (req.user) {
        isLikedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
                },
                then:true,
                else:false
            }
        };
    } else {
        isLikedByMe = false;
    }

    const aggregate = Web.aggregate([
        {
            $match:{
                isPublic:true
            }
        },
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
                likesCount:{
                    $size:"$likes"
                },
                commentsCount:{
                    $size:"$comments"
                },
                owner:{$first:"$owner"},
                isLikedByMe:isLikedByMe
            }
        },
        {
            $addFields:{
                impressions:{
                    $add:["$views","$likesCount","$commentsCount"]
                }
            }
        },
        {
            $project:{
                likes:0,
                comments:0,
            }
        },
        {
            $sort:{
                impressions:-1,
                createdAt:-1
            }
        }
    ])

    const webs = await Web.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    })

    if (!webs) {
        throw new ApiError(500,"something went wrong while fetching webs");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,webs,"webs found successfully"));
})

const getYourWorkWebs = asyncHandler(async (req, res) => {
    const { page=1, limit=4 , sortBy="views", sortOrder="desc"} = req.query;
    // sortBy = likesCount,views,commentsCount,createdAt

    const aggregate = Web.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user?._id)
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
                likesCount:{
                    $size:"$likes"
                },
                commentsCount:{
                    $size:"$comments"
                },
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                likes:0,
                comments:0,
            }
        },
        {
            $sort:{
                [sortBy]:sortOrder === "asc" ? 1 : -1
            }
        }
    ]);

    const webs = await Web.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    })

    if (!webs) {
        throw new ApiError(500,"something went wrong while fetching webs");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,webs,"webs found successfully"));
})

const searchFromWebsCreatedByMe = asyncHandler(async (req, res) => {
    const { page=1, limit=4 , search} = req.query;
    // sortBy = likesCount,views,commentsCount,createdAt

    if (!search) {
        throw new ApiError(400,"search query is required for searching webs");
    }

    const aggregate = Web.aggregate([
        {
            $match:{
                $and:[
                    {
                        $text:{$search:search}
                    },
                    {
                        owner:new mongoose.Types.ObjectId(req.user?._id)
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
                likesCount:{
                    $size:"$likes"
                },
                commentsCount:{
                    $size:"$comments"
                },
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                },
                "score": { "$meta": "textScore" }
            }
        },
        {
            $project:{
                likes:0,
                comments:0,
            }
        },
        {
            $sort:{
                score:-1
            }
        }
    ])

    const webs = await Web.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    })

    if (!webs) {
        throw new ApiError(500,"something went wrong while fetching webs");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,webs,"webs found successfully"));
})

const RecomendedpeopleToFollow = asyncHandler(async (req, res) => {
    // return array of users who are not followed by user but have created public webs
    const { page=1, limit=8 } = req.query;
    // get all users who are not followed by user but have created public webs
    const aggregate = Follower.aggregate([
        {
            $match:{
                followedBy:{
                    $ne:new mongoose.Types.ObjectId(req.user?._id)
                }
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"profile",
                foreignField:"_id",
                as:"user",
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
                            totalWebViews:{
                                $sum:"$webs.views"
                            },
                            showcaseWebs:{
                                $slice:["$webs",2]
                            }
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
                            showcaseWebs:1,
                            isVerified:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                user:{
                    $first:"$user"
                }
            }
        },
        {
            $replaceRoot:{
                newRoot:"$user"
            }
        },
        {
            $match:{
                isVerified:true
            }
        },
        {
            $sort:{
                followersCount:-1,
                totalWebViews:-1,
                websCount:-1
            }
        }
    ]);

    const users = await Follower.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    })

    if (!users) {
        throw new ApiError(500,"something went wrong while fetching users");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,users,"users found successfully"));
})

const updateWeb = asyncHandler(async (req, res) => {
    // get webId from req.params
    const { webId } = req.params;
    // get title, description, html, css, js, image, isPublic from req.body
    const {title,description,html,css,js,isPublic} = req.body;
    // check webId is provided or not
    if (!webId) {
        throw new ApiError(400,"webId is required");
    }
    // check webId, title, description, html, css, js, image, isPublic are provided or not
    if (!title && !description && !isPublic && html===undefined && css===undefined && js===undefined) {
        throw new ApiError(400,"at least one of title, description, webType, html, css, js is required");  
    }
    // check webId, title, description, html, css, js, image, isPublic are provided or not
    if (html==="" && css==="" && js==="") {
        throw new ApiError(400,"can not update all of html, css, js to empty string");  
    }
    // get web by webId
    const web = await Web.findOne({_id:new mongoose.Types.ObjectId(webId),owner:new mongoose.Types.ObjectId(req.user?._id)});
    // check web is found or not
    if (!web) {
        throw new ApiError(404,"invalid webId or unauthorized");
    }
    // check image is provided or not
    if(req.file){
        const imageLocalPath = req.file?.path;
        // delete image from cloudinary
        const deleteImage = await deleteFromCloudinary(web.public_id);
        // check image is deleted or not
        if (!deleteImage) {
            throw new ApiError(500,"something went wrong while deleting image from cloudinary");
        }
        // upload image on cloudinary
        const image = await uploadOnCloudinary(imageLocalPath);
        // check image is uploaded or not
        if (!image) {
            throw new ApiError(500,"something went wrong while uploading image on cloudinary");
        }
        web.image = image.secure_url;
        web.public_id = image.public_id;
    }
    // update web
    web.title = title || web.title;
    web.description = description || web.description;
    web.html = html !== undefined ? html : web.html;
    web.css = css !== undefined ? css : web.css;
    web.js = js !== undefined ? js : web.js;
    web.isPublic = isPublic? isPublic === "true" ? true : false : web.isPublic;
    // save web
    const savedWeb = await web.save({validateBeforeSave:true});
    // check web is saved or not
    if (!savedWeb) {
        throw new ApiError(500,"something went wrong while updating web");
    }
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,savedWeb,"web updated successfully"));
})

const deleteWeb = asyncHandler(async (req, res) => {
    // get webId from req.params
    const {webId} = req.params;
    // check webId is provided or not
    if (!webId) {
        throw new ApiError(400,"webId is required");
    }
    // get web by webId and owner
    const web = await Web.findOne({_id:new mongoose.Types.ObjectId(webId),owner:new mongoose.Types.ObjectId(req.user?._id)});
    // check web is found or not
    if (!web) {
        throw new ApiError(404,"web not found, invalid webId or unauthorized");
    }
    // delete image from cloudinary
    const deleteImage = await deleteFromCloudinary(web.public_id);
    // check image is deleted or not
    if (!deleteImage) {
        throw new ApiError(500,"something went wrong while deleting image from cloudinary");
    }
    // delete web
    const deletedWeb = await Web.findByIdAndDelete(webId);
    // check web is deleted or not
    if (!deletedWeb) {
        throw new ApiError(500,"something went wrong while deleting web");
    }
    // delete likes of web
    await Like.deleteMany({web:new mongoose.Types.ObjectId(webId)});
    // delete comments of web
    await Comment.deleteMany({web:new mongoose.Types.ObjectId(webId)});
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,{},"web deleted successfully"));
})

const addNewCssLink = asyncHandler(async (req,res)=>{
    const {webId} = req.params;
    const {cssLink} = req.body;

    if (!webId || !cssLink) {
        throw new ApiError(400,"webId and cssLink is required");
    }

    const web = await Web.findOneAndUpdate({_id:new mongoose.Types.ObjectId(webId),owner:new mongoose.Types.ObjectId(req.user?._id)},{
        $addToSet:{
            cssLinks:cssLink
        }
    },{new:true});

    if (!web) {
        throw new ApiError(404,"Web Not Found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{},"Link Added Successfully!"))

})

const removeCssLink = asyncHandler(async (req,res)=>{
    const {webId} = req.params;
    const {cssLink} = req.body;

    if (!webId || !cssLink) {
        throw new ApiError(400,"webId and cssLink is required");
    }

    const web = await Web.findOneAndUpdate({_id:new mongoose.Types.ObjectId(webId),owner:new mongoose.Types.ObjectId(req.user?._id)},{
        $pull:{
            cssLinks:cssLink
        }
    },{new:true});

    if (!web) {
        throw new ApiError(404,"Web Not Found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{},"Link removed Successfully!"))

})

const addNewJsLink = asyncHandler(async (req,res)=>{
    const {webId} = req.params;
    const {jsLink} = req.body;

    if (!webId || !jsLink) {
        throw new ApiError(400,"webId and jsLink is required");
    }

    const web = await Web.findOneAndUpdate({_id:new mongoose.Types.ObjectId(webId),owner:new mongoose.Types.ObjectId(req.user?._id)},{
        $addToSet:{
            jsLinks :jsLink
        }
    },{new:true});

    if (!web) {
        throw new ApiError(404,"Web Not Found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{},"Link Added Successfully!"))

})

const removeJsLink = asyncHandler(async (req,res)=>{
    const {webId} = req.params;
    const {jsLink} = req.body;

    if (!webId || !jsLink) {
        throw new ApiError(400,"webId and jsLink is required");
    }

    const web = await Web.findOneAndUpdate({_id:new mongoose.Types.ObjectId(webId),owner:new mongoose.Types.ObjectId(req.user?._id)},{
        $pull:{
            jsLinks :jsLink
        }
    },{new:true});

    if (!web) {
        throw new ApiError(404,"Web Not Found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{},"Link removed Successfully!"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const {webId} = req.params;
    if (!webId) {
        throw new ApiError(400,"webId is required");
    }

    const web = await Web.findOne({_id:new mongoose.Types.ObjectId(webId),owner:new mongoose.Types.ObjectId(req.user?._id)})

    if (!web) {
        throw new ApiError(404,"web not found, invalid webId or unauthorized")
    }

    web.isPublic = !web.isPublic;

    const savedWeb = await web.save({validateBeforeSave:false});

    if (!savedWeb) {
        throw new ApiError(500,"something went wrong while updating web");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{},"web deleted successfully"))
})

const updateWebViewCount = asyncHandler(async (req,res)=>{
    // get webId from req.params
    const {webId} = req.params;
    // check webId is provided or not
    if (!webId) {
        throw new ApiError(400,"webId is required");
    }
    // get web by webId and update views
    const web = await Web.findByIdAndUpdate(webId,{$inc:{views:1}})
    // check web is found or not
    if (!web) {
        throw new ApiError(500,"something went wrong while updating web");
    }
    // send response
    return res
    .status(200)
    .json(new ApiResponce(200,{},"view count updated successfully"))
})

const searchFromAllWebs = asyncHandler(async (req, res) => {
    // get page, limit, search from req.query
    const { page=1, limit=4 , search } = req.query;
    // check search is provided or not
    if (!search) {
        throw new ApiError(400,"search query is required for searching webs");
    }
    // take a variable isLikedByMe
    let isLikedByMe;
    // if req.user provided then set values of isLikedByMe and isFollowedByMe else set false
    if (req.user) {
        isLikedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
                },
                then:true,
                else:false
            }
        };
    } else {
        isLikedByMe = false;
    }
    // get webs
    const aggregate = Web.aggregate([
        {
            $match:{
                $text:{$search:search},
                isPublic:true
            }
        },
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
                likesCount:{
                    $size:"$likes"
                },
                commentsCount:{
                    $size:"$comments"
                },
                owner:{$first:"$owner"},
                isLikedByMe:isLikedByMe,
                "score": { "$meta": "textScore" }
            }
        },
        {
            $project:{
                likes:0,
                comments:0,
            }
        },
        {
            $sort:{
                score:-1
            }
        }
    ])

    const webs = await Web.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    })
    // check webs are found or not
    if (!webs) {
        throw new ApiError(500,"something went wrong while fetching webs");
    }
    // send responce
    return res
    .status(200)
    .json(new ApiResponce(200,webs,"webs found successfully"));
})

const getEditorPreferences = asyncHandler(async (req, res) => {
    if (req.user) {
        const response = await Editor.findOne({owner:new mongoose.Types.ObjectId(req.user?._id)});

        if (!response) {
            return res
            .status(200)
            .json(new ApiResponce(200,{
                theme:"vs-dark",
                indentation:2,
                fontSize:"15px",
                fontWeight:"500",
                formatOnType:true,
                minimap:false,
                lineHeight:20,
                mouseWheelZoom:true,
                wordWrap:"on"
            }, "editor preferences get successfully"));
        }

        return res
        .status(200)
        .json(new ApiResponce(200,response, "editor preferences get successfully"));
    } else {
        return res
        .status(200)
        .json(new ApiResponce(200,{
            theme:"vs-dark",
            indentation:2,
            fontSize:"15px",
            fontWeight:"500",
            formatOnType:true,
            minimap:false,
            lineHeight:20,
            mouseWheelZoom:true,
            wordWrap:"on"
        }, "editor preferences get successfully"));
    }
})

const updateEditorPreferences = asyncHandler(async (req, res) => {
    const {theme,fontSize,fontWeight,formatOnType,lineHeight,mouseWheelZoom,wordWrap} = req.body;

    const response = await Editor.findOneAndUpdate({owner:new mongoose.Types.ObjectId(req.user?._id)},{
        theme:theme || "vs-dark",
        fontSize:fontSize || "15px",
        fontWeight:fontWeight || "500",
        formatOnType:formatOnType || true,
        lineHeight:lineHeight || 20,
        mouseWheelZoom:mouseWheelZoom || true,
        wordWrap:wordWrap || "on"
    },{
        new:true,
    })

    if (!response) {
        throw new ApiError(500,"something went wrong while updating editor preferences");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,response,"editor preferences updated successfully"));
});

const ChengeEditorView = asyncHandler(async (req, res) => {
    const {indentation} = req.body;

    if(!indentation){
        throw new ApiError(400,"indentation is required");
    }

    const response = await Editor.findOneAndUpdate({owner:new mongoose.Types.ObjectId(req.user?._id)},{indentation},{
        new:true
    });

    if (!response) {
        throw new ApiError(500,"something went wrong while updating editor preferences");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,response,"editor view updated successfully"));
})

export{
    createWeb,
    createForkedWeb,
    getWebByWebId,
    getAllWebsByUserId,
    getFollowingWebs,
    getTrendingWebs,
    getLikedWebs,
    getYourWorkWebs,
    RecomendedpeopleToFollow,
    updateWeb,
    deleteWeb,
    togglePublishStatus,
    updateWebViewCount,
    searchFromWebsCreatedByMe,
    searchFromAllWebs,
    getEditorPreferences,
    updateEditorPreferences,
    ChengeEditorView,
    getWebWithoutDteailsById,
    addNewCssLink,
    addNewJsLink,
    removeCssLink,
    removeJsLink,
}