import {asyncHandler} from '../utils/asyncHandler.js';
import {Collection} from "../models/collecntions.model.js"
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import { Web } from '../models/webs.model.js';
import mongoose from 'mongoose';
import { Like } from '../models/likes.model.js';

const createCollection = asyncHandler(async(req,res)=>{
    const {name,description,isPublic=true} = req.body;

    if (!name) {
        throw new ApiError(400,"Name is required");
    }

    const collectionExists = await Collection.findOne({name,owner:req.user?._id});

    if (collectionExists) throw new ApiError(400,"Collection with this name already exists");

    const collection = await Collection.create({
        name:name,
        description:description || "",
        isPublic,
        owner:req.user?._id
    });

    if (!collection) {
        throw new ApiError(500,"Something went wrong while creating collection");
    }

    return res
    .status(201)
    .json(new ApiResponce(201,collection,"Collection created successfully"))
})

const updateCollection = asyncHandler(async(req,res)=>{
    const {name,description} = req.body;
    const {collectionId} = req.params;

    if (!name || !collectionId) {
        throw new ApiError(400,"collectionId and name is required");
    }

    const collection = await Collection.findOneAndUpdate({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    },
    {
        name,
        description:description || ""
    },{new:true});

    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to update this collection");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Collection updated successfully"))
})

const deleteCollection = asyncHandler(async(req,res)=>{
    const {collectionId} = req.params;

    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }
    
    const collection = await Collection.findOneAndDelete({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to delete this collection");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{},"Collection deleted successfully"))
})

const addWebToCollection = asyncHandler(async(req,res)=>{
    const {collectionId,webId} = req.params;
    if (!collectionId || !webId) {
        throw new ApiError(400,"collectionId and webId is required");
    }

    const exiestingCollection = await Collection.findOne({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!exiestingCollection) throw new ApiError(404,"Collection not found or you are not authorized to update this collection");

    const collection = await Collection.findByIdAndUpdate(
        collectionId,
        {
            $addToSet:{
                webs:new mongoose.Types.ObjectId(webId)
            }
        },
        {new:true}
    )

    if (!collection) {
        throw new ApiError(500,"something went wrong while adding web to collection");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Web added to collection successfully"))
})

const removeWebFromCollection = asyncHandler(async(req,res)=>{
    const {collectionId,webId} = req.params;
    if (!collectionId || !webId) {
        throw new ApiError(400,"collectionId and webId is required");
    }

    const collection = await Collection.findOneAndUpdate(
        {
            _id:new mongoose.Types.ObjectId(collectionId),
            owner:new mongoose.Types.ObjectId(req.user?._id)
        },
        {
            $pull:{
                webs:new mongoose.Types.ObjectId(webId)
            }
        },
        {new:true}
    );

    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to update this collection");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Web removed from collection successfully"))
})

const toggleCollectionPublishStatus = asyncHandler(async(req,res)=>{
    const {collectionId} = req.params;
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }

    const collection = await Collection.findOne({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to update this collection");
    }

    collection.isPublic = !collection.isPublic;

    const savedCollection = await collection.save({validateBeforeSave:false});

    if (!savedCollection) {
        throw new ApiError(500,"something went wrong while updating collection publish status");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,savedCollection,"Collection publish status updated successfully"))
});

const updateViewCount = asyncHandler(async(req,res)=>{
    const {collectionId} = req.params;
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }

    const collection = await Collection.findOneAndUpdate(
        {
            _id:new mongoose.Types.ObjectId(collectionId),
        },
        {
            $inc:{
                views:1
            }
        },
        {new:true}
    ).select("views");

    if (!collection) {
        throw new ApiError(404,"Collection not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Collection view count updated successfully"))
})

const getCollectionByCollectionId = asyncHandler(async(req,res)=>{
    const {collectionId} = req.params;
    const {userId} = req.query;
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }

    const collection = await Collection.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(collectionId)
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
                            followersCount:{$size:"$followers"},
                            isFollowedByMe:{
                                $cond:{
                                    if:{
                                        $in:[userId? new mongoose.Types.ObjectId(userId) : " ","$followers.followedBy"]
                                    },
                                    then:true,
                                    else:false
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1,
                            followersCount:1,
                            isFollowedByMe:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"collection",
                as:"likes"
            }
        },
        {
            $addFields:{
                websCount:{$size:"$webs"},
                likesCount:{$size:"$likes"},
                owner:{$first:"$owner"},
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[userId? new mongoose.Types.ObjectId(userId) : " ","$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                likes:0
            }
        } 
    ])

    if (!collection) {
        throw new ApiError(404,"Collection not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Collection fetched successfully"))
})


const getCollectionWEbsByCollectionId = asyncHandler(async(req,res)=>{
    const {collectionId} = req.params;
    const {userId,page=1,limit=4} = req.query;
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }

    const collection = await Collection.findById(collectionId);

    if (!collection) {
        throw new ApiError(404,"Collection not found");
    }

    const webs = await Web.aggregatePaginate([
        {
            $match:{
                _id:{$in:collection.webs}
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
                            fullName:1,
                            username:1,
                            avatar:1
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
                likesCount:{$size:"$likes"},
                commentsCount:{$size:"$comments"},
                owner:{$first:"$owner"},
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[userId? new mongoose.Types.ObjectId(userId) : " ","$likes.likedBy"]
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
                comments:0
            }
        }
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    });

    if (!webs) {
        throw new ApiError(404,"Webs not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,webs,"Webs fetched successfully"))

})

const getCollectionsByUserId = asyncHandler(async(req,res)=>{
    // get all collections created by user
    const {userId} = req.params;
    const {user_id,collectionType="public",sortBy="createdAt",sortOrder="desc",page=1,limit=4} = req.query;
    // sortBy = views,likesCount,websCount,createdAt
    if (!userId) {
        throw new ApiError(400,"userId is required");
    }

    const collections =  await Collection.aggregatePaginate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
                isPublic:collectionType === "public" ? true : false
            }
        },
        {
            $lookup:{
                from:"webs",
                localField:"webs",
                foreignField:"_id",
                as:"webs",
                pipeline:[
                    {
                        $sort:{
                            views:-1
                        }
                    },
                    {
                        $project:{
                            title:1,
                            image:1,
                            _id:1
                        }
                    }
                ]
            }
        },
        {
            Lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"collection",
                as:"likes"
            }
        },
        {
            $addFields:{
                websCount:{$size:"$webs"},
                webs:{$slice:["$webs",0,4]},
                likesCount:{$size:"$likes"},
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
                likes:0
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

    if (!collections) {
        throw new ApiError(404,"Collections not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collections,"Collections fetched successfully"))
})
const getCollectionsCreatedByMe = asyncHandler(async(req,res)=>{
    const { sortBy="createdAt",sortOrder="desc",page=1,limit=4} = req.query;
    // sortBy = views,likesCount,websCount,createdAt

    const collections =  await Collection.aggregatePaginate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user?._id),
            }
        },
        {
            $lookup:{
                from:"webs",
                localField:"webs",
                foreignField:"_id",
                as:"webs",
                pipeline:[
                    {
                        $sort:{
                            views:-1
                        }
                    },
                    {
                        $project:{
                            title:1,
                            image:1,
                            _id:1
                        }
                    }
                ]
            }
        },
        {
            Lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"collection",
                as:"likes"
            }
        },
        {
            $addFields:{
                websCount:{$size:"$webs"},
                webs:{$slice:["$webs",0,4]},
                likesCount:{$size:"$likes"},
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
                likes:0
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

    if (!collections) {
        throw new ApiError(404,"Collections not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collections,"Collections fetched successfully"))
})

const getLikedCollectionsByUserId = asyncHandler(async(req,res)=>{
    // get all collections liked by user
    const {userId} = req.params;
    const {user_id,sortBy="createdAt",sortOrder="desc",page=1,limit=4} = req.query;
    // sortBy = views,likesCount,websCount,createdAt
    if (!userId) {
        throw new ApiError(400,"userId is required");
    }

    const likedCollections = await Like.aggregatePaginate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId),
                collection:{$exists:true}
            }
        },
        {
            $lookup:{
                from:"collections",
                localField:"collection",
                foreignField:"_id",
                as:"collection",
                pipeline:[
                    {
                        $match:{
                            isPublic:true
                        }
                    },
                    {
                        $lookup:{
                            from:"webs",
                            localField:"webs",
                            foreignField:"_id",
                            as:"webs",
                            pipeline:[
                                {
                                    $sort:{
                                        views:-1
                                    }
                                },
                                {
                                    $project:{
                                        title:1,
                                        image:1,
                                        _id:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        Lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"collection",
                            as:"likes"
                        }
                    },
                    {
                        $addFields:{
                            websCount:{$size:"$webs"},
                            webs:{$slice:["$webs",0,4]},
                            likesCount:{$size:"$likes"},
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
                            likes:0
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                collection:{$first:"$collection"}
            }
        },
        {
            $replaceRoot:{
                newRoot:"$collection"
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

    if (!likedCollections) {
        throw new ApiError(404,"Liked collections not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,likedCollections,"Liked collections fetched successfully"))
})

const searchFromAllCollections = asyncHandler(async(req,res)=>{
    const {search,page=1,limit=4,userId} = req.query;

    if (!search) {
        throw new ApiError(400,"search query is required for searchin collections");
    }

    const collections = await Collection.aggregatePaginate([
        {
            $match:{
                $text:{
                    $search:search
                },
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
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"webs",
                localField:"webs",
                foreignField:"_id",
                as:"webs",
                pipeline:[
                    {
                        $sort:{
                            views:-1
                        }
                    },
                    {
                        $project:{
                            title:1,
                            image:1,
                            _id:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"collection",
                as:"likes"
            }
        },
        {
            $addFields:{
                websCount:{$size:"$webs"},
                likesCount:{$size:"$likes"},
                webs:{$slice:["$webs",0,4]},
                owner:{$first:"$owner"},
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[userId? new mongoose.Types.ObjectId(userId) : " ","$likes.likedBy"]
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
                likes:0
            }
        },
        {
            $sort:{score:-1}
        }
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    });

    if (!collections) {
        throw new ApiError(404,"Collections not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collections,"Collections fetched successfully"))
})

const searchFromAllCollectionsCreatedByMe = asyncHandler(async(req,res)=>{
    const {search,page=1,limit=4} = req.query;

    if (!search) {
        throw new ApiError(400,"search query is required for searchin collections");
    }

    const collections = await Collection.aggregatePaginate([
        {
            $match:{
                $text:{
                    $search:search
                }
            }
        },
        {
            $lookup:{
                from:"webs",
                localField:"webs",
                foreignField:"_id",
                as:"webs",
                pipeline:[
                    {
                        $sort:{
                            views:-1
                        }
                    },
                    {
                        $project:{
                            title:1,
                            image:1,
                            _id:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"collection",
                as:"likes"
            }
        },
        {
            $addFields:{
                websCount:{$size:"$webs"},
                likesCount:{$size:"$likes"},
                webs:{$slice:["$webs",0,4]},
                "score": { "$meta": "textScore" },
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
                likes:0
            }
        },
        {
            $sort:{score:-1}
        }
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    });

    if (!collections) {
        throw new ApiError(404,"Collections not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collections,"Collections fetched successfully"))
})

export {
    createCollection,
    updateCollection,
    deleteCollection,
    addWebToCollection,
    removeWebFromCollection,
    toggleCollectionPublishStatus,
    updateViewCount,
    getCollectionByCollectionId,
    getCollectionWEbsByCollectionId,
    getCollectionsByUserId,
    getLikedCollectionsByUserId,
    searchFromAllCollections,
    searchFromAllCollectionsCreatedByMe,
    getCollectionsCreatedByMe,
}