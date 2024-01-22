import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import {Asset} from "../models/assets.model.js";

const createAsset = asyncHandler(async(req,res)=>{
    const {title,assetType,assetURL,assetPublicId,isPublic=true} = req.body;

    if (!title || !assetType || !assetURL || !assetPublicId) {
        throw new ApiError(400,"Please provide all the required fields");
    }

    const asset = await Asset.create({
        title,
        assetType,
        assetURL,
        assetPublicId,
        isPublic,
        owner:req.user?._id
    });

    if (!asset) {
        throw new ApiError(500,"Something went wrong while creating the asset");
    }

    return res
        .status(201)
        .json(new ApiResponce(201,asset,"Asset created successfully"));

})

export {
    createAsset,
}

