import { Router } from "express";

import { checkToken, checkAdmin } from "../middlewares/auth"
import { createClass, getClassByTeacher, getClassById, getListClass, updateClassById, deleteClassById } from "../models/class.model";

const router = Router();

router.get("/:id", checkAdmin, getClassById)
router.get("/by-id/:id", checkAdmin, getClassById);
router.get("/by-teacher", checkAdmin, getClassByTeacher);
router.post("/", checkAdmin, createClass);
router.put("/:id", checkAdmin, updateClassById);
router.delete("/:id", checkAdmin, deleteClassById);
router.get("/", checkAdmin, getListClass);




export default router;