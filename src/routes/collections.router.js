import { Router } from "express";
import {verifyJWT, checkCurrentUser} from "../middlewares/auth.middleware.js";
import {
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
    getCollectionsCreatedByMe
} from "../controllers/collection.controller.js"


const router = Router();

router.route("/create").post(verifyJWT,createCollection);
router.route("/update/:collectionId").patch(verifyJWT,updateCollection);
router.route("/delete/:collectionId").delete(verifyJWT,deleteCollection);
router.route("/add-web/:collectionId/:webId").patch(verifyJWT,addWebToCollection);
router.route("/remove-web/:collectionId/:webId").patch(verifyJWT,removeWebFromCollection);
router.route("/toggle-publish-status/:collectionId").patch(verifyJWT,toggleCollectionPublishStatus);
router.route("/inc-view/:collectionId").patch(updateViewCount);
router.route("/get/:collectionId").get(getCollectionByCollectionId);
router.route("/get-webs/:collectionId").get(getCollectionWEbsByCollectionId);
router.route("/user-collection/:userId").get(getCollectionsByUserId);
router.route("/my-collections").get(verifyJWT, getCollectionsCreatedByMe);
router.route("/liked/:userId").get(getLikedCollectionsByUserId);
router.route("/search").get(searchFromAllCollections);
router.route("/my-collections/search").get(verifyJWT,searchFromAllCollectionsCreatedByMe);



export default router;