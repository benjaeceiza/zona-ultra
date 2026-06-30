
import express from "express"

import { addRace, deleteRace, getMedalleroByUser, updateRace } from '../controllers/raceController.js';
import { authMiddleware } from '../middleware/auth.js';

export const router = express.Router();

// Ruta base: /api/races
router.post('/',authMiddleware, addRace);

// Ruta específica por usuario: /api/races/user/:idUsuario
router.get('/user/:idUsuario', authMiddleware,getMedalleroByUser);

// Ruta para actualizar una carrera
router.put('/:id', updateRace);    

// Ruta para eliminar una carrera
router.delete('/:id', deleteRace);

