"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Endpoint para añadir un usuario
router.post('/add', userController_1.addUser);
// Endpoint para el login
router.post('/login', userController_1.loginUser);
exports.default = router;
