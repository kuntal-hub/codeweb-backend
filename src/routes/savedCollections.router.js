import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleSavedCollection,
    getSavedCollections,
    createSavedCollection,
    deleteSavedCollection,
} from "../controllers/savedCollections.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/toggle/:collectionId").post(toggleSavedCollection);
router.route("/create/:collectionId").post(createSavedCollection);
router.route("/delete/:collectionId").delete(deleteSavedCollection);
router.route("/get").get(getSavedCollections);

export default router;