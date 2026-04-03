import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const SECRET = "JARVIS_SECRET_2024_PREMIUM_HUD";
const usersFile = path.join(__dirname, "users.json");

// Gestion flexible des utilisateurs (Mémoire vive si Vercel bloque l'écriture)
let memoryUsers = [
    { id: 1, email: "demo@premium.ai", password: bcrypt.hashSync("password", 10), credits: 100 }
];

const loadUsers = () => {
    try {
        if (fs.existsSync(usersFile)) {
            const data = fs.readFileSync(usersFile);
            return JSON.parse(data);
        }
    } catch (e) {
        console.log("INFO: Utilisation du stockage en mémoire vive (Vercel detecté)");
    }
    return memoryUsers;
};

const saveUsers = (users) => {
    memoryUsers = users; // Toujours mettre à jour la mémoire
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (e) {
        console.log("NOTE: Impossible d'écrire sur disque (Vercel), données sauvegardées en mémoire vive uniquement.");
    }
};

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

app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        let users = loadUsers();
        if (users.find(u => u.email === email)) return res.status(400).json({ error: "Utilisateur existe déjà" });
        const hashedPassword = await bcrypt.hashSync(password, 10);
        const newUser = { id: Date.now(), email, password: hashedPassword, credits: 50 };
        users.push(newUser);
        saveUsers(users);
        res.json({ message: "Succès" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        let users = loadUsers();
        const user = users.find(u => u.email === email);
        if (!user || !bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: "Identifiants incorrects" });
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET);
        res.json({ token, email: user.email, credits: user.credits });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/chat", authenticateToken, async (req, res) => {
    try {
        const { message, model = "multi" } = req.body;
        let users = loadUsers();
        const user = users.find(u => u.id === req.user.id);
        if (!user || user.credits <= 0) return res.status(403).json({ error: "Crédits épuisés" });

        if (model === "image") {
            const seed = Math.floor(Math.random() * 1000000);
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(message)}?width=1024&height=1024&nologo=true&seed=${seed}`;
            user.credits -= 1;
            saveUsers(users);
            return res.json({ image: imageUrl, remainingCredits: user.credits });
        }

        const results = {
            gpt: `Réponse simulée GPT pour: ${message}`,
            gemini: `Réponse simulée Gemini pour: ${message}`,
            claude: `Réponse simulée Claude pour: ${message}`,
            llama: `Réponse simulée Llama pour: ${message}`
        };

        user.credits -= 1;
        saveUsers(users);
        res.json({ ...results, remainingCredits: user.credits });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default app;
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
