import Shoe from "../models/shoe.model.js";

// 1. Crear una nueva zapatilla
export const createShoe = async (req, res) => {
  try {
    const { brand, model, maxKm, currentKm, image } = req.body;

    // Asumimos que tienes el ID del usuario en req.user.id (por el JWT)
    const newShoe = new Shoe({
      user: req.user.id,
      brand,
      model,
      maxKm: maxKm || 600,
      currentKm: currentKm || 0, // Por si carga una usada
      image
    });

    const savedShoe = await newShoe.save();
    res.status(201).json(savedShoe);
  } catch (error) {
    res.status(500).json({ message: "Error al crear zapatilla", error });
  }
};

// 2. Obtener TODAS las zapatillas del usuario logueado
export const getUserShoes = async (req, res) => {
  try {
    // Buscamos donde el campo 'user' coincida con el ID del token
    const shoes = await Shoe.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.json(shoes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener zapatillas", error });
  }
};

// 3. (IMPORTANTE) Sumar kilómetros a una zapatilla
// Esto lo llamarías cuando el usuario guarda un entrenamiento
export const addMileage = async (req, res) => {
  const { shoeId, distance } = req.body; // distance en km

  try {
    const shoe = await Shoe.findById(shoeId);

    if (!shoe) return res.status(404).json({ message: "Zapatilla no encontrada" });

    // Sumamos
    shoe.currentKm += parseFloat(distance);

    // Opcional: Si pasa el límite, podrías mandar una alerta, pero por ahora solo guardamos
    await shoe.save();

    res.json(shoe);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar kilometraje", error });
  }
};


export const deleteShoe = async (req, res) => {
  const { sid } = req.params; // El ID de la zapatilla viene por la URL
  const userId = req.user.id; // El ID del usuario viene del token (AuthMiddleware)

  try {
    // Buscamos y borramos SOLO si pertenece al usuario logueado
    const deletedShoe = await Shoe.findOneAndDelete({ _id: sid, user: userId });

    if (!deletedShoe) {
      return res.status(404).json({ message: "Zapatilla no encontrada o no tienes permiso" });
    }

    return res.status(200).json({
      message: "Zapatilla eliminada con éxito",
      id: deletedShoe._id
    });

  } catch (error) {
    console.error("Error eliminando zapatilla:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};