import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

import mongoose from "mongoose";
import User from "./models/User.js";

const SECRET = process.env.JWT_SECRET || "JARVIS_SECRET_2024_PREMIUM_HUD";
const MONGO_URI = process.env.MONGODB_URI;

// Connexion à MongoDB si l'URI est fournie
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log("✅ Connecté à MongoDB Cloud"))
        .catch(err => console.error("❌ Erreur MongoDB:", err));
} else {
    console.log("⚠️ ATTENTION : MONGODB_URI non définie, utilisation de la RAM temporaire (pas de sauvegarde).");
}

// Gestion résiliente (Uniquement utilisée si Mongo n'est pas connecté)
let memoryUsers = [
    { email: "demo@premium.ai", password: bcrypt.hashSync("password", 10), credits: 100 }
];

const authenticateToken = (req, res, next) => {
    // Mode Bypass (Développement) : On laisse tout passer sans vérification
    req.user = { id: "dev_user", email: "dev@jarvis.local" };
    next();
};

app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.toLowerCase().trim();
        // Utilisation de hashSync pour une fiabilité totale
        const hashedPassword = bcrypt.hashSync(password, 10);

        if (MONGO_URI) {
            const existing = await User.findOne({ email: cleanEmail });
            if (existing) return res.status(400).json({ error: "Utilisateur existe déjà" });
            const newUser = new User({ email: cleanEmail, password: hashedPassword, credits: 50 });
            await newUser.save();
        } else {
            if (memoryUsers.find(u => u.email === cleanEmail)) return res.status(400).json({ error: "Utilisateur existe déjà" });
            memoryUsers.push({ email: cleanEmail, password: hashedPassword, credits: 50 });
        }
        res.json({ message: "Succès" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.toLowerCase().trim();
        let foundUser;

        if (MONGO_URI) {
            foundUser = await User.findOne({ email: cleanEmail });
        } else {
            foundUser = memoryUsers.find(u => u.email === cleanEmail);
        }

        // --- DIAGNOSTIC TEMPORAIRE (VERSION 2.1) ---
        if (!foundUser) {
            return res.status(400).json({ error: "Utilisateur introuvable [V2.1]" });
        }

        const isMatch = bcrypt.compareSync(password, foundUser.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Mot de passe incorrect [V2.1]" });
        }
        // -----------------------------

        const userId = foundUser._id ? foundUser._id.toString() : foundUser.email;
        const token = jwt.sign({ id: userId, email: foundUser.email }, SECRET);
        res.json({ token, email: foundUser.email, credits: foundUser.credits });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/chat", authenticateToken, async (req, res) => {
    try {
        const { message, model = "multi" } = req.body;
        let foundUser;

        if (MONGO_URI) {
            foundUser = await User.findOne({ email: req.user.email });
        } else {
            foundUser = memoryUsers.find(u => u.email === req.user.email);
        }

        if (!foundUser || foundUser.credits <= 0) return res.status(403).json({ error: "Crédits épuisés" });

        if (model === "image") {
            const seed = Math.floor(Math.random() * 1000000);
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(message)}?width=1024&height=1024&nologo=true&seed=${seed}`;
            foundUser.credits -= 1;
            if (MONGO_URI) await foundUser.save();
            return res.json({ image: imageUrl, remainingCredits: foundUser.credits });
        }

        const results = {
            gpt: `Réponse Jarvis (GPT) pour: ${message}`,
            gemini: `Réponse Jarvis (Gemini) pour: ${message}`,
            claude: `Réponse Jarvis (Claude) pour: ${message}`,
            llama: `Réponse Jarvis (Llama) pour: ${message}`
        };

        foundUser.credits -= 1;
        if (MONGO_URI) await foundUser.save();
        res.json({ ...results, remainingCredits: foundUser.credits });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default app;
// Note: Vercel gère l'exécution, app.listen n'est pas nécessaire mais gardé en commentaire pour le local
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Serveur prêt`));
