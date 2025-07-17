import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { AppDataSource } from "./config/data-source";
import { initializeFirebase } from "./config/firebase";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API do CMS esta funcionando!");
});

AppDataSource.initialize()
  .then(() => {
    console.log("Banco de dados SQLite conectado com sucesso!");
    initializeFirebase();
    console.log("Firebase Admin SDK inicializado com sucesso!");
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log("Error ao conectar ao banco de dados:", error));
