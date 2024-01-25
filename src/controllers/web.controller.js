import {asyncHandler} from '../utils/asyncHandler.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import {Web} from "../models/webs.model.js";
import {Like} from "../models/likes.model.js";
import { User } from '../models/users.model.js';
import {Follower} from "../models/followers.model.js";
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"


const createWeb = asyncHandler(async (req, res) => {
    // get title, description, html, css, js, image, isPublic from req.body
    const {title,description,html,css,js,isPublic=true} = req.body;
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
        isPublic:isPublic
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
    // create forked web
    const forkedWeb = await Web.create({
        title:web.title,
        description:web.description,
        html:web.html,
        css:web.css,
        js:web.js,
        image:web.image,
        public_id:web.public_id,
        owner:new mongoose.Types.ObjectId(req.user?._id),
        isPublic:true,
        forkedFrom:web._id
    });
    // check forked web is created or not
    if (!forkedWeb) {
        throw new ApiError(500,"something went wrong while creating web");
    }
    // send response
    return res
    .status(201)
    .json(new ApiResponce(201,forkedWeb,"web created successfully"));

});

const getWebByWebId = asyncHandler(async (req, res) => {
    const { webId } = req.params;
    const {userId} = req.query;
    
    if (!webId) {
        throw new ApiError(400,"webId is required");
    }

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
                            isFollowedByMe:{
                                $cond:{
                                    if:{
                                        $in:[userId? new mongoose.Types.ObjectId(userId) : "","$followers.followedBy"]
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
                likesCount:{
                    $size:"$likes"
                },
                commentsCount:{$size:"$comments"},
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[userId? new mongoose.Types.ObjectId(userId) : "","$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                },
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

    if (web.length < 1) {
        throw new ApiError(404,"web not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,web[0],"web found successfully"));
});


const getAllWebsByUserId = asyncHandler(async (req, res) => {
    const { user_id, webType = "public", sortBy="views", sortOrder="desc", page=1, limit=4 } = req.query;
    const { userId } = req.params;
    // sortBy = views, createdAt, likesCount, commentsCount
    // return array of webs created by usee (userId)
    // webType: public, private, forked
    // userId = the user whose webs are to be fetched
    // user_id = the user who is requesting for webs

    if (!userId) {
        throw new ApiError(400,"userId is required");
    }

    let match;
    if (webType === "private") {
        match = {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
                isPublic:false
            }
        }
    } else if (webType === "forked") {
        match = {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
                forkedFrom:{$exists:true}
            }
        }
    } else if(webType === "public"){
        match = {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
                isPublic:true
            }
        }
    }else{
        throw new ApiError(400,"invalid webType");
    }

    const webs = await Web.aggregatePaginate([
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
            isLikedByMe:{
                $cond:{
                    if:{
                        $in:[user_id? new mongoose.Types.ObjectId(user_id) : "","$likes.likedBy"]
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
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    });

    if (!webs) {
        throw new ApiError(500,"something went wrong while fetching webs");
        
    }

    return res
    .status(200)
    .json(new ApiResponce(200,webs,"webs found successfully"));
})

const getLikedWebs = asyncHandler(async (req, res) => {
    // return array of webs liked by user
    const {userId} = req.params;
    const {user_id,sortBy="createdAt",sortOrder="desc", page=1, limit=4 } = req.query;

    if (!userId) {
        throw new ApiError(400,"userId is required");
    }
    
    const likedWebs = await Like.aggregatePaginate([
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
                            isLikedByMe:{
                                $cond:{
                                    if:{
                                        $in:[user_id? new mongoose.Types.ObjectId(user_id) : "","$likes.likedBy"]
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
    ],{
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
    
    const followingWebs = await Follower.aggregatePaginate([
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
    ],{
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
    const { page=1, limit=4 } = req.query;
    // return array of webs first sort by impressions(views+likes+comments) then by date

    const webs = await Web.aggregatePaginate([
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
                owner:{$first:"$owner"}
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
    ],{
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

    const webs = await Web.aggregatePaginate([
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
    ],{
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

    const webs = await Web.aggregatePaginate([
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
    ],{
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
    // get all following ids
    const following = await Follower.find({followedBy:req.user?._id}).select("profile");
    // get all following ids
    const followingIds = following.map(f => f.profile);
    // get all users who are not followed by user but have created public webs
    const users = await User.aggregatePaginate([
        {
            $match:{
                _id:{$nin:followingIds},
                isVerified:true
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
                from:"webs",
                localField:"_id",
                foreignField:"owner",
                as:"showcaseWebs",
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
                        $limit:2
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
            }
        },
        {
            $sort:{
                followersCount:-1,
                totalWebViews:-1,
                websCount:-1
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
                showcaseWebs:1
            }
        }
    ],{
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
    const {title,description,html,css,js} = req.body;
    // get image path from req.file.path
    const imageLocalPath = req.file?.path;
    // check webId is provided or not
    if (!webId) {
        throw new ApiError(400,"webId is required");
    }
    // check webId, title, description, html, css, js, image, isPublic are provided or not
    if (!title || !description || !(html || css || js)) {
        throw new ApiError(400,"title, description and html/css/js are required");  
    }
    // check image is provided or not
    if (!imageLocalPath) {
        throw new ApiError(400,"image not provided");
    }
    // get web by webId
    const web = await Web.findById(webId);
    // check web is found or not
    if (!web) {
        throw new ApiError(404,"invalid webId");
    }
    // check web owner is same as user who is updating web
    if (web.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403,"you are not allowed to update this web");
    }
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
    // update web
    web.title = title;
    web.description = description;
    web.html = html || web.html;
    web.css = css || web.css;
    web.js = js || web.js;
    web.image = image.secure_url;
    web.public_id = image.public_id;
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
    await Like.deleteMany({web:webId});
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,{},"web deleted successfully"));
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
    const { page=1, limit=4 , search, userId} = req.query;

    if (!search) {
        throw new ApiError(400,"search query is required for searching webs");
    }

    const webs = await Web.aggregatePaginate([
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
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[userId? new mongoose.Types.ObjectId(userId):"","$likes.likedBy"]
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
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    })
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
}
