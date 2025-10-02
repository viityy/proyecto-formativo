"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roomController_1 = require("../controllers/roomController");
const router = (0, express_1.Router)();
router.post('/add', roomController_1.addRoom);
exports.default = router;
