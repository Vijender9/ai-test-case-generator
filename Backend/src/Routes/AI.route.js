import express from "express"
import { generateTestCode, generateTestSummary } from "../controllers/AI.controller.js";
const router= express.Router();
router.post('/generate-test-summary',generateTestSummary);
router.post('/generate-test-code',generateTestCode)
export { router}