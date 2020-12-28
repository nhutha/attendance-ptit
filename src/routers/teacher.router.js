import { Router } from "express";

import { createTeacher, deleteTeacher, getListTeacher, getTeacherById, updateTeacher, updateHistoryAttendance, updateBluetoothAddress, getHistoryAttendanceByClass, getTimeTable, getListClass, getListStudent, attendance } from "../models/teacher.model";
import upload from "../utils/uploadFile";
import { checkAdmin, checkTeacher } from "../middlewares/auth"

const router = Router();

router.post("/attendance", checkTeacher, attendance)
router.post("/", checkAdmin, upload.single("avatar"), createTeacher)
router.put("/history-attendance/:idCreditClass", checkTeacher, updateHistoryAttendance)
router.put("/bluetooth-address", checkTeacher, updateBluetoothAddress)
router.put("/:idTeacher", checkAdmin, upload.single("avatar"), updateTeacher);
router.delete("/:idTeacher", checkAdmin, deleteTeacher);
router.get("/", checkAdmin, getListTeacher);
router.get("/history-attendance/:idCreditClass", checkTeacher, getHistoryAttendanceByClass)
router.get("/time-table", checkTeacher, getTimeTable)
router.get("/list-class", checkTeacher, getListClass);
router.get("/list-student/:idCreditClass", checkTeacher, getListStudent)
router.get("/:idTeacher", checkAdmin, getTeacherById);


export default router;