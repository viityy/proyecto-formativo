"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seatController_1 = require("../controllers/seatController");
const router = (0, express_1.Router)();
router.get('/showtime/:showtime_id', seatController_1.getShowtimeSeats);
exports.default = router;
