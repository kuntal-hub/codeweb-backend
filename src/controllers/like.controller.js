import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import { Like } from '../models/likes.model.js';

const toggleWebLike = asyncHandler(async (req, res) => {
    const {webId} = req.params;

    if (!webId) {
        throw new ApiError(400, 'Web id is required');
    }

    const isLiked = await Like.findOne({
        web: new mongoose.Types.ObjectId(webId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })

    if (isLiked) {
        const removeLike = await Like.findByIdAndDelete(isLiked._id);

        if (!removeLike) {
            throw new ApiError(500, 'Something went wrong');
        }

        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Web unliked successfully'));
    }

    const like = await Like.create({
        web: new mongoose.Types.ObjectId(webId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!like) {
        throw new ApiError(500, 'Something went wrong while liking web');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Web liked successfully'));
});

const toggleAssetLike = asyncHandler(async (req, res) => {
    const {assetId} = req.params;

    if (!assetId) {
        throw new ApiError(400, 'assetId id is required');
    }

    const isLiked = await Like.findOne({
        asset: new mongoose.Types.ObjectId(assetId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })

    if (isLiked) {
        const removeLike = await Like.findByIdAndDelete(isLiked._id);

        if (!removeLike) {
            throw new ApiError(500, 'Something went wrong');
        }

        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Web unliked successfully'));
    }

    const like = await Like.create({
        asset: new mongoose.Types.ObjectId(assetId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!like) {
        throw new ApiError(500, 'Something went wrong while liking asset');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Web liked successfully'));
});

const toggleCollectiontLike = asyncHandler(async (req, res) => {
    const {collectionId} = req.params;

    if (!collectionId) {
        throw new ApiError(400, 'assetId id is required');
    }

    const isLiked = await Like.findOne({
        collection: new mongoose.Types.ObjectId(collectionId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })

    if (isLiked) {
        const removeLike = await Like.findByIdAndDelete(isLiked._id);

        if (!removeLike) {
            throw new ApiError(500, 'Something went wrong');
        }

        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Web unliked successfully'));
    }

    const like = await Like.create({
        collection: new mongoose.Types.ObjectId(collectionId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!like) {
        throw new ApiError(500, 'Something went wrong while liking asset');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Web liked successfully'));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if (!commentId) {
        throw new ApiError(400, 'assetId id is required');
    }

    const isLiked = await Like.findOne({
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })

    if (isLiked) {
        const removeLike = await Like.findByIdAndDelete(isLiked._id);

        if (!removeLike) {
            throw new ApiError(500, 'Something went wrong');
        }

        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Web unliked successfully'));
    }

    const like = await Like.create({
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!like) {
        throw new ApiError(500, 'Something went wrong while liking asset');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Web liked successfully'));
});

const toggleReplayLike = asyncHandler(async (req, res) => {
    const {replayId} = req.params;

    if (!replayId) {
        throw new ApiError(400, 'assetId id is required');
    }

    const isLiked = await Like.findOne({
        replay: new mongoose.Types.ObjectId(replayId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })

    if (isLiked) {
        const removeLike = await Like.findByIdAndDelete(isLiked._id);

        if (!removeLike) {
            throw new ApiError(500, 'Something went wrong');
        }

        return res
            .status(200)
            .json(new ApiResponce(200,{}, 'Web unliked successfully'));
    }

    const like = await Like.create({
        replay: new mongoose.Types.ObjectId(replayId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!like) {
        throw new ApiError(500, 'Something went wrong while liking asset');
    }

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