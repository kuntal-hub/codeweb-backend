import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import { Like } from '../models/likes.model.js';

const toggleWebLike = asyncHandler(async (req, res) => {
    // get webId from params
    const {webId} = req.params;
    // check if webId is present or not
    if (!webId) {
        throw new ApiError(400, 'Web id is required');
    }
    // check if web is already liked by user or not
    const isLiked = await Like.findOne({
        web: new mongoose.Types.ObjectId(webId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    // if web is already liked by user then remove like
    if (isLiked) {
        // remove like
        const removeLike = await Like.findByIdAndDelete(isLiked._id);
        // check if like is removed or not
        if (!removeLike) {
            throw new ApiError(500, 'Something went wrong');
        }
        // return response
        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Web unliked successfully'));
    }
    // if web is not liked by user then like web
    const like = await Like.create({
        web: new mongoose.Types.ObjectId(webId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if like is created or not
    if (!like) {
        throw new ApiError(500, 'Something went wrong while liking web');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Web liked successfully'));
});

const toggleAssetLike = asyncHandler(async (req, res) => {
    // get assetId from params
    const {assetId} = req.params;
    // check if assetId is present or not
    if (!assetId) {
        throw new ApiError(400, 'assetId id is required');
    }
    // check if asset is already liked by user or not
    const isLiked = await Like.findOne({
        asset: new mongoose.Types.ObjectId(assetId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    // if asset is already liked by user then remove like
    if (isLiked) {
        // remove like
        const removeLike = await Like.findByIdAndDelete(isLiked._id);
        // check if like is removed or not
        if (!removeLike) {
            throw new ApiError(500, 'Something went wrong');
        }
        // return response
        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Web unliked successfully'));
    }
    // if asset is not liked by user then like asset
    const like = await Like.create({
        asset: new mongoose.Types.ObjectId(assetId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if like is created or not
    if (!like) {
        throw new ApiError(500, 'Something went wrong while liking asset');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Web liked successfully'));
});

const toggleCollectiontLike = asyncHandler(async (req, res) => {
    // get collectionId from params
    const {collectionId} = req.params;
    // check if collectionId is present or not
    if (!collectionId) {
        throw new ApiError(400, 'assetId id is required');
    }
    // check if collection is already liked by user or not
    const isLiked = await Like.findOne({
        collection: new mongoose.Types.ObjectId(collectionId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    // if collection is already liked by user then remove like
    if (isLiked) {
        // remove like
        const removeLike = await Like.findByIdAndDelete(isLiked._id);
        // check if like is removed or not
        if (!removeLike) {
            throw new ApiError(500, 'Something went wrong');
        }
        // return response
        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Web unliked successfully'));
    }
    // if collection is not liked by user then like collection
    const like = await Like.create({
        collection: new mongoose.Types.ObjectId(collectionId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if like is created or not
    if (!like) {
        throw new ApiError(500, 'Something went wrong while liking asset');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Web liked successfully'));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    // get commentId from params
    const {commentId} = req.params;
    // check if commentId is present or not
    if (!commentId) {
        throw new ApiError(400, 'assetId id is required');
    }
    // check if comment is already liked by user or not
    const isLiked = await Like.findOne({
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    // if comment is already liked by user then remove like
    if (isLiked) {
        // remove like
        const removeLike = await Like.findByIdAndDelete(isLiked._id);
        // check if like is removed or not
        if (!removeLike) {
            throw new ApiError(500, 'Something went wrong');
        }
        // return response
        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Web unliked successfully'));
    }
    // if comment is not liked by user then like comment
    const like = await Like.create({
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if like is created or not
    if (!like) {
        throw new ApiError(500, 'Something went wrong while liking asset');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Web liked successfully'));
});

const toggleReplayLike = asyncHandler(async (req, res) => {
    // get replayId from params
    const {replayId} = req.params;
    // check if replayId is present or not
    if (!replayId) {
        throw new ApiError(400, 'assetId id is required');
    }
    // check if replay is already liked by user or not
    const isLiked = await Like.findOne({
        replay: new mongoose.Types.ObjectId(replayId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    // if replay is already liked by user then remove like
    if (isLiked) {
        // remove like
        const removeLike = await Like.findByIdAndDelete(isLiked._id);
        // check if like is removed or not
        if (!removeLike) {
            throw new ApiError(500, 'Something went wrong');
        }
        // return response
        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Web unliked successfully'));
    }
    // if replay is not liked by user then like replay
    const like = await Like.create({
        replay: new mongoose.Types.ObjectId(replayId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if like is created or not
    if (!like) {
        throw new ApiError(500, 'Something went wrong while liking asset');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Web liked successfully'));
});


export {
    toggleWebLike,
    toggleReplayLike,
    toggleCommentLike,
    toggleCollectiontLike,
    toggleAssetLike
}