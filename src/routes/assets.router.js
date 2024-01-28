import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    createAsset,
    getAllAssetsCreatedByUser,
    getAllPublicAssets,
    searchFromPublicAssets,
    getAssetById,
    deleteAssetById,
    updateAssetById,
    getLikedAssets
} from "../controllers/asset.controller.js";


const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/create").post(createAsset);
router.route("/my-assets").get(getAllAssetsCreatedByUser);
router.route("/get").get(getAllPublicAssets);
router.route("/search/all-assets").get(searchFromPublicAssets);
router.route("/get/:assetId").get(getAssetById);
router.route("/delete/:assetId").delete(deleteAssetById);
router.route("/update/:assetId").patch(updateAssetById);
router.route("/liked").get(getLikedAssets);


export default router;