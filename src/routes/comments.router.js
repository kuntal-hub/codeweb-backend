import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    createComment,
    updateComment,
    deleteComment,
    getAllWebComments
} from "../controllers/comment.controller.js"

const router = Router();

router.use(verifyJWT);

router.route("/create").post(createComment);
router.route("/update").patch(updateComment);
router.route("/delete/:commentId").delete(deleteComment);
router.route("/get-comments").get(getAllWebComments);



export default router;