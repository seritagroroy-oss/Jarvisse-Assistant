import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const SECRET = "JARVIS_SECRET_2024_PREMIUM_HUD";
const usersFile = path.join(__dirname, "users.json");

const loadUsers = () => {
    if (!fs.existsSync(usersFile)) {
        fs.writeFileSync(usersFile, JSON.stringify([{ id: 1, email: "demo@premium.ai", password: bcrypt.hashSync("password", 10), credits: 100 }]));
    }
    return JSON.parse(fs.readFileSync(usersFile));
};

const saveUsers = (users) => fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Non autorisé" });
    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token invalide" });
        req.user = user;
        next();
    });
};

// API Routes
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    let users = loadUsers();
    if (users.find(u => u.email === email)) return res.status(400).json({ error: "Utilisateur existe déjà" });
    const hashedPassword = await bcrypt.hashSync(password, 10);
    const newUser = { id: Date.now(), email, password: hashedPassword, credits: 50 };
    users.push(newUser);
    saveUsers(users);
    res.json({ message: "Succès" });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    let users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: "Identifiants incorrects" });
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET);
    res.json({ token, email: user.email, credits: user.credits });
});

const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });

app.post("/chat", authenticateToken, async (req, res) => {
    try {
        const { message, model = "multi" } = req.body;
        console.log("\n--- [DEBUG SERVER] Nouvelle requête ---");
        console.log("Modèle:", model);
        console.log("Message:", message);

        let users = loadUsers();
        const user = users.find(u => u.id === req.user.id);

        if (!user || user.credits <= 0) {
            return res.status(403).json({ error: "Crédits épuisés" });
        }

        // Logic image
        if (model === "image") {
            const seed = Math.floor(Math.random() * 1000000);
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(message)}?width=1024&height=1024&nologo=true&seed=${seed}`;
            console.log("LOG: Image générée ->", imageUrl);
            user.credits -= 1;
            saveUsers(users);
            return res.json({ image: imageUrl, remainingCredits: user.credits });
        }

        // AI Logic placeholders
        const results = {
            gpt: "Réponse GPT Placeholder",
            gemini: "Réponse Gemini Placeholder",
            claude: "Réponse Claude Placeholder",
            llama: "Réponse Llama Placeholder",
            openrouter: "Réponse OpenRouter Placeholder"
        };
        
        // Simuler des appels si besoin (ici on reste simple pour le test image)
        if (model !== "multi") {
            results[model] = `Réponse de ${model} pour: ${message}`;
        }

        user.credits -= 1;
        saveUsers(users);
        console.log("LOG: Réponse texte envoyée, crédits restants:", user.credits);
        res.json({ ...results, remainingCredits: user.credits });

    } catch (err) {
        console.error("ERREUR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

export default app;
app.listen(3000, () => console.log("\n--- Serveur Jarvis Opérationnel sur http://localhost:3000 ---\n"));
