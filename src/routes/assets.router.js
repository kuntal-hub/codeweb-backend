import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    createAsset,
    getAllAssetsCreatedByUser,
    getAllPublicAssets,
    searchFromPublicAssets,
    getAssetById,
    deleteAssetById,
    updateAssetById
} from "../controllers/asset.controller.js";


const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/create").post(createAsset);
router.route("/my-assets").get(getAllAssetsCreatedByUser);
router.route("/assets").get(getAllPublicAssets);
router.route("/assets/search").get(searchFromPublicAssets);
router.route("/asset/:assetId").get(getAssetById);
router.route("/delete/:assetId").delete(deleteAssetById);
router.route("/update/:assetId").put(updateAssetById);


export default router;