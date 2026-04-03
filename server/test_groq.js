import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GROQ_API_KEY;
console.log('Testing key:', key.substring(0, 7) + '...' + key.substring(key.length - 4));

try {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Hi" }]
    }, { 
        headers: { Authorization: `Bearer ${key}` }
    });
    console.log('Success!', response.data.choices[0].message.content);
} catch (e) {
    console.log('Fail!', e.response?.data || e.message);
}
