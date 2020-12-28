import { Router } from "express";

import { checkAdmin } from "../middlewares/auth"

import { createRole, updateRoleById, deleteRoleById, getListRole, getRoleById } from "../models/role.model";

const router = Router();

router.post("/", checkAdmin, createRole);
router.put("/:id", checkAdmin, updateRoleById);
router.delete("/:id", checkAdmin, deleteRoleById);
router.get("/", checkAdmin, getListRole);
router.get("/:id", checkAdmin, getRoleById);

export default router;