import { Router } from "express";

import { checkToken } from "../middlewares/auth";
import upload from "../utils/uploadFile";
import { forgotPassword, login, changePassword, getProfile, updateProfile } from "../models/user.model";

const router = Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/change-password", checkToken, changePassword);
router.get("/profile", checkToken, getProfile);
router.put("/profile", checkToken, upload.single('avatar'), updateProfile)


export default router;