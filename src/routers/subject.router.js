import { Router } from "express";

import { checkAdmin } from "../middlewares/auth"

import { createSubject, updateSubjectById, deleteSubjectById, getListSubject, getSubjectById } from "../models/subject.model";

const router = Router();

router.post("/", checkAdmin, createSubject);
router.put("/:id", checkAdmin, updateSubjectById);
router.delete("/:id", checkAdmin, deleteSubjectById);
router.get("/", checkAdmin, getListSubject);
router.get("/:id", checkAdmin, getSubjectById);

export default router;