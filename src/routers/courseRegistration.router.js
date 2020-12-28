import { Router } from "express";

import { checkAdmin } from "../middlewares/auth"

import { createCourseRegistration, getCourseRegistration, getListCourseRegistration, updateCourseRegistration, deleteCourseRegistration } from "../models/courseRegistration.model";

const router = Router();

router.post("/", checkAdmin, createCourseRegistration);
router.put("/:idCreditClass", checkAdmin, updateCourseRegistration);
router.delete("/:idCreditClass", checkAdmin, deleteCourseRegistration);
router.get("/", checkAdmin, getListCourseRegistration);
router.get("/:idCreditClass", checkAdmin, getCourseRegistration);

export default router;