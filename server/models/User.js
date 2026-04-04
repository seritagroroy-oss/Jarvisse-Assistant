import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    credits: { 
        type: Number, 
        default: 50 // Crédits offerts à l'inscription
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const User = mongoose.model("User", userSchema);
export default User;
