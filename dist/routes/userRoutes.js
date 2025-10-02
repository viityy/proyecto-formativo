"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.post('/add', userController_1.addUser);
router.post('/login', userController_1.loginUser);
router.patch('/changepassword', userController_1.changePassword);
exports.default = router;
