import { Router } from "express";

import roleRouter from "./role.router";
import userRouter from "./user.router";
import classRouter from "./class.router";
import subjectRouter from "./subject.router";
import roomRouter from "./room.router";
import teacherRouter from "./teacher.router";
import studentRouter from "./student.router";
import creditClassRouter from "./creditClass.router";
import scheduleRouter from "./schedule.router";
import courseRegistrationRouter from "./courseRegistration.router";
import reportRouter from "./report.router";

const router = Router();

router.use("/role", roleRouter);
router.use("/class", classRouter);
router.use("/user", userRouter);
router.use("/subject", subjectRouter);
router.use("/room", roomRouter)
router.use("/teacher", teacherRouter);
router.use("/student", studentRouter);
router.use("/credit-class", creditClassRouter);
router.use("/schedule", scheduleRouter);
router.use("/report", reportRouter);
router.use("/course-registration", courseRegistrationRouter);
// router.get("/student/bluetooth-address", (req, res, next) => {
//     res.status(200).send({
//         result: '22:22:AD:D5:7F:45'
//     })
// })

export default router;