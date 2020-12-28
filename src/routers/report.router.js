import { Router } from "express";

import { checkAdmin } from "../middlewares/auth"
import upload from "../utils/uploadExcel";

import { getListStudentAttendance, getNumberOfStudent, importDataFromExcel, getListStudentOutOfSchool, getListStudentOutOfSchoolByWeek } from "../models/report.model";

const router = Router();

router.get("/list-attendance/:idCreditClass", getListStudentAttendance);
router.get('/number-student', getNumberOfStudent)
router.get("/list-student-out-of-school", getListStudentOutOfSchool)
router.get("/list-student-out-of-school-by-week", getListStudentOutOfSchoolByWeek);
router.post("/import-data", checkAdmin, upload.single("data"), importDataFromExcel)

export default router;