import { Router } from "express";

import { checkAdmin } from "../middlewares/auth"

import { createCreditClass, deleteCreditClass, getCreditClass, getListCreditClass, updateCreditClass } from "../models/creditClass.model";

const router = Router();

router.post("/", checkAdmin, createCreditClass);
router.put("/:idCreditClass", checkAdmin, updateCreditClass);
router.delete("/:idCreditClass", checkAdmin, deleteCreditClass);
router.get("/", checkAdmin, getListCreditClass);
router.get("/:idCreditClass", checkAdmin, getCreditClass);

export default router;