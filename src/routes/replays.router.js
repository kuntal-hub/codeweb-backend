import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    createReplay,
    updateReplay,
    deleteReplay
} from "../controllers/replay.controller.js"


const router = Router();
router.use(verifyJWT);

router.route("/create").post(createReplay);
router.route("/update/:replayId").patch(updateReplay);
router.route("/delete/:replayId").delete(deleteReplay);

export default router;