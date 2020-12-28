import { Router } from "express";

import { checkAdmin } from "../middlewares/auth"

import { createSchedule, getListSchedule, getScheduleById, updateScheduleById, deleteScheduleById } from "../models/schedule.model";

const router = Router();

router.post("/", checkAdmin, createSchedule);
router.put("/:idSchedule", checkAdmin, updateScheduleById);
router.delete("/:idSchedule", checkAdmin, deleteScheduleById);
router.get("/", checkAdmin, getListSchedule);
router.get("/:idSchedule", checkAdmin, getScheduleById);

export default router;