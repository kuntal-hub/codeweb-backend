import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import {Follower } from "../models/followers.model.js";
import { User } from '../models/users.model.js';


const toggleFollow = asyncHandler(async (req, res) => {
    // get username from params
    const {username} = req.params;
    // check if username is present or not
    if (!username) {
        throw new ApiError(400, 'username id is required');
    }
    // find profile by username
    const profile = await User.findOne({username}).select('_id username');
    // check if profile is present or not
    if (!profile) throw new ApiError(404, 'Profile not found');
    // get profileId from profile
    const profileId = profile._id;
    // check if profile is already followed by user or not
    const isFollowed = await Follower.findOne({
        profile: new mongoose.Types.ObjectId(profileId),
        followedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    // if profile is already followed by user then unfollow profile
    if (isFollowed) {
        // remove follow
        const removeFollow = await Follower.findByIdAndDelete(isFollowed._id);
        // check if follow is removed or not
        if (!removeFollow) {
            throw new ApiError(500, 'Something went wrong while unfollowing profile');
        }
        // return response
        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Profile unfollowed successfully'));
    }
    // if profile is not followed by user then follow profile
    const follow = await Follower.create({
        profile: new mongoose.Types.ObjectId(profileId),
        followedBy: new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if follow is created or not
    if (!follow) {
        throw new ApiError(500, 'Something went wrong while following profile');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Profile followed successfully'));
});

const getFollowers = asyncHandler(async (req, res) => {
    // get username from params
    const {username} = req.params;
    // get page and limit from query
    const {page=1,limit=20} = req.query;
    // check if username is present or not
    if (!username) {
        throw new ApiError(400, 'username id is required');
    }
    // find profile by username
    const profile = await User.findOne({username}).select('_id username');
    // check if profile is present or not
    if (!profile) throw new ApiError(404, 'Profile not found');
    // get profileId from profile
    const profileId = profile._id;
    // get followers 
    const aggregate = Follower.aggregate([
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
    ])

    const followers = await Follower.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    });
    // check if followers are fetched or not
    if (!followers) {
        throw new ApiError(500, 'Something went wrong while fetching followers');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,followers, 'Followers fetched successfully'));
});

const getFollowings = asyncHandler(async (req, res) => {
    // get username from params
    const {username} = req.params;
    // get page and limit from query
    const {page=1,limit=20} = req.query;
    // check if username is present or not
    if (!username) {
        throw new ApiError(400, 'username id is required');
    }
    // find profile by username
    const profile = await User.findOne({username}).select('_id username');
    // check if profile is present or not
    if (!profile) throw new ApiError(404, 'Profile not found');
    // get profileId from profile
    const profileId = profile._id;
    // get followings
    const aggregate = Follower.aggregate([
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
    ]);
    
    const followings = await Follower.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit)
    });
    // check if followings are fetched or not
    if (!followings) {
        throw new ApiError(500, 'Something went wrong while fetching followings');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,followings, 'Followings fetched successfully'));
});


// export all follower controllers
export {
    toggleFollow,
    getFollowers,
    getFollowings
}