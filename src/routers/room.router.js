import { Router } from "express";

import { checkAdmin } from "../middlewares/auth"

import { createRoom, getListRoom, getRoomById, updateRoomById, deleteRoomById } from "../models/room.model";

const router = Router();

router.post("/", checkAdmin, createRoom);
router.put("/:id", checkAdmin, updateRoomById);
router.delete("/:id", checkAdmin, deleteRoomById);
router.get("/", checkAdmin, getListRoom);
router.get("/:id", checkAdmin, getRoomById);

export default router;