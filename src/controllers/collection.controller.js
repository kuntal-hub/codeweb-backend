import {asyncHandler} from '../utils/asyncHandler.js';
import {Collection} from "../models/collecntions.model.js"
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import { Web } from '../models/webs.model.js';
import mongoose from 'mongoose';
import { Like } from '../models/likes.model.js';

const createCollection = asyncHandler(async(req,res)=>{
    // get name and description from body
    const {name,description,isPublic=true} = req.body;
    // check if name is present or not
    if (!name) {
        throw new ApiError(400,"Name is required");
    }
    // check if collection with this name and user already exists or not
    const collectionExists = await Collection.findOne({name,owner:req.user?._id});
    // if collection with this name and user already exists then throw error
    if (collectionExists) throw new ApiError(400,"Collection with this name already exists");
    // if collection with this name and user does not exists then create collection
    const collection = await Collection.create({
        name:name,
        description:description || "",
        isPublic,
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if collection is created or not
    if (!collection) {
        throw new ApiError(500,"Something went wrong while creating collection");
    }
    // return response
    return res
    .status(201)
    .json(new ApiResponce(201,collection,"Collection created successfully"))
})

const updateCollection = asyncHandler(async(req,res)=>{
    // get name and description from body
    const {name,description} = req.body;
    // get collectionId from params
    const {collectionId} = req.params;
    // check if name and collectionId both are present or not
    if (!name || !collectionId) {
        throw new ApiError(400,"collectionId and name is required");
    }
    // update collection
    const collection = await Collection.findOneAndUpdate({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    },
    {
        name,
        description:description || ""
    },{new:true});
    // check if collection is updated or not
    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to update this collection");
    }
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Collection updated successfully"))
})

const deleteCollection = asyncHandler(async(req,res)=>{
    // get collectionId from params
    const {collectionId} = req.params;
    // check if collectionId is present or not
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }
    // delete collection
    const collection = await Collection.findOneAndDelete({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if collection is deleted or not
    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to delete this collection");
    }
    // delete all likes on collection
    await Like.deleteMany({collection:new mongoose.Types.ObjectId(collectionId)});
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,{},"Collection deleted successfully"))
})

const addWebToCollection = asyncHandler(async(req,res)=>{
    // get collectionId and webId from params
    const {collectionId,webId} = req.params;
    // check if collectionId and webId both are present or not
    if (!collectionId || !webId) {
        throw new ApiError(400,"collectionId and webId is required");
    }
    // add web to collection
    const collection = await Collection.findOneAndUpdate(
        {
            _id:new mongoose.Types.ObjectId(collectionId),
            owner:new mongoose.Types.ObjectId(req.user?._id)
        },
        {
            $addToSet:{
                webs:new mongoose.Types.ObjectId(webId)
            }
        },
        {new:true}
    )
    // check if collection is updated or not
    if (!collection) {
        throw new ApiError(404,"collection not found or you are not authorized to update this collection");
    }
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Web added to collection successfully"))
})

const removeWebFromCollection = asyncHandler(async(req,res)=>{
    // get collectionId and webId from params
    const {collectionId,webId} = req.params;
    // check if collectionId and webId both are present or not
    if (!collectionId || !webId) {
        throw new ApiError(400,"collectionId and webId is required");
    }
    // check if collection exists or not
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
    // check if collection is updated or not
    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to update this collection");
    }
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Web removed from collection successfully"))
})

const toggleCollectionPublishStatus = asyncHandler(async(req,res)=>{
    // get collectionId from params
    const {collectionId} = req.params;
    // check if collectionId is present or not
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }
    // toggle collection publish status
    const collection = await Collection.findOne({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if collection is found or not
    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to update this collection");
    }
    // toggle collection publish status
    collection.isPublic = !collection.isPublic;
    // save collection
    const savedCollection = await collection.save({validateBeforeSave:false});
    // check if collection is saved or not
    if (!savedCollection) {
        throw new ApiError(500,"something went wrong while updating collection publish status");
    }
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,savedCollection,"Collection publish status updated successfully"))
});

const updateViewCount = asyncHandler(async(req,res)=>{
    // get collectionId from params
    const {collectionId} = req.params;
    // check if collectionId is present or not
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }
    // find the collection by collectionId update collection view count
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
    // check if collection is found or not
    if (!collection) {
        throw new ApiError(404,"Collection not found");
    }
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Collection view count updated successfully"))
})

const getCollectionByCollectionId = asyncHandler(async(req,res)=>{
    // get collectionId from params
    const {collectionId} = req.params;
    // get userId from query
    const {userId} = req.query;
    // check if collectionId is present or not
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }
    // get collection by collectionId 
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
    // check if collection is found or not
    if (!collection) {
        throw new ApiError(404,"Collection not found");
    }
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Collection fetched successfully"))
})


const getCollectionWEbsByCollectionId = asyncHandler(async(req,res)=>{
    // get collectionId from params
    const {collectionId} = req.params;
    // get userId from query
    const {userId,page=1,limit=4} = req.query;
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }
    // get collection by collectionId
    const collection = await Collection.findById(collectionId);
    // check if collection is found or not
    if (!collection) {
        throw new ApiError(404,"Collection not found");
    }
    // get webs from collection
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
    // check if webs are found or not
    if (!webs) {
        throw new ApiError(404,"Webs not found");
    }
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,webs,"Webs fetched successfully"))

})

const getCollectionsByUserId = asyncHandler(async(req,res)=>{
    // get all collections created by user
    // get userId from params
    const {userId} = req.params;
    // get user_id collectionType,sortBy,sortOrder,page,limit from query
    const {user_id,collectionType="public",sortBy="createdAt",sortOrder="desc",page=1,limit=4} = req.query;
    // sortBy = views,likesCount,websCount,createdAt
    // check if userId is present or not
    if (!userId) {
        throw new ApiError(400,"userId is required");
    }
    // get collections
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
    // check if collections are found or not
    if (!collections) {
        throw new ApiError(404,"Collections not found");
    }
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,collections,"Collections fetched successfully"))
})
const getCollectionsCreatedByMe = asyncHandler(async(req,res)=>{
    // get all collections created by user
    const { sortBy="createdAt",sortOrder="desc",page=1,limit=4} = req.query;
    // sortBy = views,likesCount,websCount,createdAt
    // get collections
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
    // check if collections are found or not
    if (!collections) {
        throw new ApiError(404,"Collections not found");
    }
    // return response
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