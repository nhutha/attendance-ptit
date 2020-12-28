import { Router } from "express";

import { createStudent, getListStudent, getStudentById, updateStudent, deleteStudent, getBluetoothAddressOfTeacher, getTimeTable } from "../models/student.model";
import upload from "../utils/uploadFile";
import { checkAdmin, checkStudent, checkTeacher } from "../middlewares/auth"

const router = Router();

router.post("/", checkAdmin, upload.single("avatar"), createStudent)
router.put("/:idStudent", checkAdmin, upload.single("avatar"), updateStudent);
router.delete("/:idStudent", checkAdmin, deleteStudent);
router.get("/", checkAdmin, getListStudent);
router.get("/time-table", checkStudent, getTimeTable)
router.get("/bluetooth-address", checkStudent, getBluetoothAddressOfTeacher)
router.get("/:idStudent", checkAdmin, getStudentById);
export default router;