import {asyncHandler} from '../utils/asyncHandler.js';
import {Collection} from "../models/collecntions.model.js"
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import { Web } from '../models/webs.model.js';
import { User } from '../models/users.model.js';
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
    const collectionExists = await Collection.findOne({name,owner:new mongoose.Types.ObjectId(req.user?._id)});
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
    // check if name and description is present or not
    if(!name && !description) throw new ApiError(400,"name or description is required");
    // get collectionId from params
    const {collectionId} = req.params;
    // check if collectionId is present or not
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }
    // find collection name already exists or not
    const isCollectionExists = await Collection.findOne({name,owner:new mongoose.Types.ObjectId(req.user?._id)});
    // if collection with this name and user already exists then throw error
    if (isCollectionExists) throw new ApiError(400,"Collection with this name already exists");
    // find collection by id
    const collection = await Collection.findOne({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if collection is updated or not
    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to update this collection");
    }
    // update collection
    collection.name = name || collection.name;
    collection.description = description || collection.description;
    // save collection
    const savedCollection = await collection.save({validateBeforeSave:false});
    // check if collection is saved or not
    if (!savedCollection) throw new ApiError(500,"Something went wrong while updating collection");
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,savedCollection,"Collection updated successfully"))
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
    .json(new ApiResponce(200,{},"Web added to collection successfully"))
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
    .json(new ApiResponce(200,{},"Web removed from collection successfully"))
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
    .json(new ApiResponce(200,{},"Collection publish status updated successfully"))
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
    .json(new ApiResponce(200,{},"Collection view count updated successfully"))
})

const getCollectionByCollectionId = asyncHandler(async(req,res)=>{
    // get collectionId from params
    const {collectionId} = req.params;
    // check if collectionId is present or not
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }
    // take isFollowedByMe and isLikedByMe variables
    let isFollowedByMe,isLikedByMe
        // if req.user provided then set values of isLikedByMe else set false
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
            isLikedByMe = {
                $cond:{
                    if:{
                        $in:[new mongoose.Types.ObjectId(req.user._id),"$likes.likedBy"]
                    },
                    then:true,
                    else:false
                }
            };
        } else {
            isLikedByMe = false;
            isFollowedByMe = false;
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
                            isFollowedByMe:isFollowedByMe
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
                isLikedByMe:isLikedByMe
            }
        },
        {
            $project:{
                likes:0
            }
        } 
    ])
    // check if collection is found or not
    if (collection.length === 0) {
        throw new ApiError(404,"Collection not found");
    }
    // return response
    return res
    .status(200)
    .json(new ApiResponce(200,collection[0],"Collection fetched successfully"))
})


const getCollectionWEbsByCollectionId = asyncHandler(async(req,res)=>{
    // get collectionId from params
    const {collectionId} = req.params;
    // get page and limit from query
    const {page=1,limit=4} = req.query;
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }
    // get collection by collectionId
    const collection = await Collection.findById(collectionId);
    // check if collection is found or not
    if (!collection) {
        throw new ApiError(404,"Collection not found");
    }
    // take isLikedByMe variable
    let isLikedByMe;
    // if req.user provided then set values of isLikedByMe else set false
    if (req.user) {
        isLikedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(req.user._id),"$likes.likedBy"]
                },
                then:true,
                else:false
            }
        };
    } else {
        isLikedByMe = false;
    }
    // get webs from collection
    const aggregate = Collection.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(collectionId)
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
                            isLikedByMe:isLikedByMe
                        }
                    },
                    {
                        $project:{
                            likes:0,
                            comments:0
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$webs"
        },
        {
            $replaceRoot:{
                newRoot:"$webs"
            }
        }
    ])

    const webs = await Collection.aggregatePaginate(aggregate,{
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
    // collectionType = public,private
    // sortBy = views,likesCount,websCount,createdAt
    // get userId from params
    const {username} = req.params;
    // check if username is present or not
    if (!username) throw new ApiError(400,"username is required");
    // get user by username
    const user = await User.findOne({username:username}).select("_id username");
    // check if user is found or not
    if (!user) throw new ApiError(404,"User not found");
    const userId = user._id;
    // get user_id collectionType,sortBy,sortOrder,page,limit from query
    const {collectionType="public",sortBy="createdAt",sortOrder="desc",page=1,limit=4} = req.query;
    // take isLikedByMe variable
    let isLikedByMe;
    // if req.user provided then set values of isLikedByMe else set false
    if (req.user) {
        isLikedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(req.user._id),"$likes.likedBy"]
                },
                then:true,
                else:false
            }
        };
    } else {
        isLikedByMe = false;
    }
    // get collections
    const aggregate = Collection.aggregate([
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
                webs:{$slice:["$webs",4]},
                likesCount:{$size:"$likes"},
                isLikedByMe:isLikedByMe
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
    ])

    const collections =  await Collection.aggregatePaginate(aggregate,{
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
    const aggregate = Collection.aggregate([
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
                webs:{$slice:["$webs",4]},
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
    ]);

    const collections =  await Collection.aggregatePaginate(aggregate,{
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
    const {username} = req.params;
    const {sortBy="createdAt",sortOrder="desc",page=1,limit=4} = req.query;
    // sortBy = views,likesCount,websCount,createdAt
    if (!username) {
        throw new ApiError(400,"userId is required");
    }
    // get user by username
    const user = await User.findOne({username:username}).select("_id username");
    // check if user is found or not
    if (!user) throw new ApiError(404,"User not found");
    const userId = user._id;
    // take isLikedByMe variable
    let isLikedByMe;
    // if req.user provided then set values of isLikedByMe else set false
    if (req.user) {
        isLikedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(req.user._id),"$likes.likedBy"]
                },
                then:true,
                else:false
            }
        };
    } else {
        isLikedByMe = false;
    }
    // get liked collections
    const aggregate = Like.aggregate([
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
                            webs:{$slice:["$webs",4]},
                            likesCount:{$size:"$likes"},
                            isLikedByMe:isLikedByMe
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
    ])

    const likedCollections = await Like.aggregatePaginate(aggregate,{
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
    // get search,page,limit from query
    const {search,page=1,limit=4} = req.query;
    // check if search is present or not
    if (!search) {
        throw new ApiError(400,"search query is required for searchin collections");
    }
    // take isLikedByMe variable
    let isLikedByMe;
    // if req.user provided then set values of isLikedByMe else set false
    if (req.user) {
        isLikedByMe = {
            $cond:{
                if:{
                    $in:[new mongoose.Types.ObjectId(req.user._id),"$likes.likedBy"]
                },
                then:true,
                else:false
            }
        };
    } else {
        isLikedByMe = false;
    }
    // get collections
    const aggregate = Collection.aggregate([
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
                isLikedByMe:isLikedByMe,
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
    ])

    const collections = await Collection.aggregatePaginate(aggregate,{
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

    const aggregate = Collection.aggregate([
        {
            $match:{
                $and:[
                    {
                        owner:new mongoose.Types.ObjectId(req.user?._id)
                    },
                    {
                        $text:{
                            $search:search
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
    ])

    const collections = await Collection.aggregatePaginate(aggregate,{
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

const checkCollectionNameAvailability = asyncHandler(async(req,res)=>{
    const {name} = req.params;

    if (!name) {
        throw new ApiError(400,"name is required");
    }

    const collection = await Collection.findOne({name:name.replaceAll("-"," "),owner:new mongoose.Types.ObjectId(req.user?._id)});

    if (collection) {
        throw new ApiError(400,"Collection with this name already exists");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{},"Collection name is available"))
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
    checkCollectionNameAvailability,
}