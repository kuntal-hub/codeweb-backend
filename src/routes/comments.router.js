import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    createComment,
    updateComment,
    deleteComment,
    getAllWebComments,
    getCommentById
} from "../controllers/comment.controller.js"

const router = Router();

router.use(verifyJWT);

router.route("/create").post(createComment);
router.route("/update/:commentId").patch(updateComment);
router.route("/delete/:commentId").delete(deleteComment);
router.route("/get-comments/:webId").get(getAllWebComments);
router.route("/get/:commentId").get(getCommentById);



export default router;