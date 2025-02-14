// agent.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as path from 'path'
import dotenv from 'dotenv'
dotenv.config({path: path.resolve(__dirname, '../.env')})
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

async function gemini(prompt: string, other?:any): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Error calling Gemini API: ${error}`;
  }
}

export { gemini };
