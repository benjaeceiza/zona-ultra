import express from "express";
import { createShoe, deleteShoe, getUserShoes } from "../controllers/shoeController.js";
import { authMiddleware } from "../middleware/auth.js";


export const router = express.Router();

router.post('/', authMiddleware, createShoe);


// Misma ruta base '/', pero con método GET
router.get('/', authMiddleware,getUserShoes);

// Asegurate de que :sid coincida con lo que pusiste en el controller (const { sid } = req.params)
router.delete('/:sid', authMiddleware, deleteShoe);
