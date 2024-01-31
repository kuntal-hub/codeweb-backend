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
    getCollectionsCreatedByMe,
    checkCollectionNameAvailability
} from "../controllers/collection.controller.js"


const router = Router();

router.route("/create").post(verifyJWT,createCollection);
router.route("/update/:collectionId").patch(verifyJWT,updateCollection);
router.route("/delete/:collectionId").delete(verifyJWT,deleteCollection);
router.route("/add-web/:collectionId/:webId").patch(verifyJWT,addWebToCollection);
router.route("/remove-web/:collectionId/:webId").patch(verifyJWT,removeWebFromCollection);
router.route("/toggle-publish-status/:collectionId").patch(verifyJWT,toggleCollectionPublishStatus);
router.route("/inc-view/:collectionId").patch(updateViewCount);
router.route("/get/:collectionId").get(checkCurrentUser,getCollectionByCollectionId);
router.route("/get-webs/:collectionId").get(checkCurrentUser,getCollectionWEbsByCollectionId);
router.route("/user-collection/:userId").get(checkCurrentUser,getCollectionsByUserId);
router.route("/my-collections").get(verifyJWT, getCollectionsCreatedByMe);
router.route("/liked/:userId").get(checkCurrentUser,getLikedCollectionsByUserId);
router.route("/search/all-collections").get(checkCurrentUser,searchFromAllCollections);
router.route("/search/my-collections").get(verifyJWT,searchFromAllCollectionsCreatedByMe);
router.route("/check-name-availability/:name").get(verifyJWT,checkCollectionNameAvailability);



export default router;