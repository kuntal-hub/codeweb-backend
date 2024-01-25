import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import {Follower } from "../models/followers.model.js"


const toggleFollow = asyncHandler(async (req, res) => {
    const {profileId} = req.params;

    if (!profileId) {
        throw new ApiError(400, 'profileId id is required');
    }

    const isFollowed = await Follower.findOne({
        profile: new mongoose.Types.ObjectId(profileId),
        followedBy: new mongoose.Types.ObjectId(req.user?._id)
    })

    if (isFollowed) {
        const removeFollow = await Follower.findByIdAndDelete(isFollowed._id);

        if (!removeFollow) {
            throw new ApiError(500, 'Something went wrong while unfollowing profile');
        }

        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Profile unfollowed successfully'));
    }

    const follow = await Follower.create({
        profile: new mongoose.Types.ObjectId(profileId),
        followedBy: new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!follow) {
        throw new ApiError(500, 'Something went wrong while following profile');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Profile followed successfully'));
});

const getFollowers = asyncHandler(async (req, res) => {
    const {profileId} = req.params;
    const {page=1,limit=20} = req.query;

    if (!profileId) {
        throw new ApiError(400, 'profileId id is required');
    }

    const followers = await Follower.aggregatePaginate([
        {
            $match: {
                profile: new mongoose.Types.ObjectId(profileId)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'followedBy',
                foreignField: '_id',
                as: 'followedBy',
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
                            as:"webs"
                        }
                    },
                    {
                        $addFields:{
                            followersCount:{
                                $size:"$followers"
                            },
                            websCount:{
                                $size:"$webs"
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
                            _id:1,
                            fullName:1,
                            username:1,
                            avatar:1,
                            followersCount:1,
                            isFollowedByMe:1,
                            websCount:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                followedBy:{
                    $first:"$followedBy"
                }
            }
        },
        {
            $replaceRoot:{
                newRoot:"$followedBy"
            }
        },
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    });

    if (!followers) {
        throw new ApiError(500, 'Something went wrong while fetching followers');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,followers, 'Followers fetched successfully'));
});

const getFollowings = asyncHandler(async (req, res) => {
    const {profileId} = req.params;
    const {page=1,limit=20} = req.query;

    if (!profileId) {
        throw new ApiError(400, 'profileId id is required');
    }

    const followings = await Follower.aggregatePaginate([
        {
            $match:{
                followedBy:new mongoose.Types.ObjectId(profileId)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"profile",
                foreignField:"_id",
                as:"profile",
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
                            as:"webs"
                        }
                    },
                    {
                        $addFields:{
                            followersCount:{
                                $size:"$followers"
                            },
                            websCount:{
                                $size:"$webs"
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
                            _id:1,
                            fullName:1,
                            username:1,
                            avatar:1,
                            followersCount:1,
                            isFollowedByMe:1,
                            websCount:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                profile:{
                    $first:"$profile"
                }
            }
        },
        {
            $replaceRoot:{
                newRoot:"$profile"
            }
        }
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    });
    
    if (!followings) {
        throw new ApiError(500, 'Something went wrong while fetching followings');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,followings, 'Followings fetched successfully'));
});

export {
    toggleFollow,
    getFollowers,
    getFollowings
}