import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { router as userRouter } from "./routes/user.router.js";
import { router as authRouter } from "./routes/auth.router.js";
import { router as planAdminRouter } from "./routes/plan.admin.router.js";
import { router as shoeRouter } from "./routes/shoe.router.js";
import { router as planRouter} from "./routes/plan.router.js";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const PORT = process.env.PORT;

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/plans/admin", planAdminRouter);
app.use("/api/plans", planRouter);
app.use("/api/shoes", shoeRouter);


mongoose.connect(process.env.MONGO_URI, { dbName: "app_run" })
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch(err => console.error("❌ Error al conectar MongoDB:", err));

app.listen(PORT, () => {
    console.log(`✅ Servidor escuchado en el puerto ${PORT}`);
});


