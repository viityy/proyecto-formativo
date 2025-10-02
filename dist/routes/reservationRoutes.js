"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservationController_1 = require("../controllers/reservationController");
const router = (0, express_1.Router)();
router.post('/add', reservationController_1.addReservation);
router.delete('/:id', reservationController_1.deleteReservation);
router.patch('/:id', reservationController_1.editReservation);
exports.default = router;
