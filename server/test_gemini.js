import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const key = "AIzaSyDDC03_hBeNIGR6ucT_LnX9WLLA4CAA1Uk";

async function testGemini() {
    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            contents: [{ parts: [{ text: "Hi" }] }]
        });
        console.log("Success!", response.data.candidates[0].content.parts[0].text);
    } catch (e) {
        console.error("Error:", e.response?.data || e.message);
    }
}

testGemini();
