
import { GoogleGenAI, Chat } from "@google/genai";
import type { ScriptGenerationResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateScriptAndVisuals(topic: string, language: string, numScenes: number, questions?: string): Promise<ScriptGenerationResult> {
  try {
    let prompt = `
      You are a professional YouTube scriptwriter and visual director. Create a complete and engaging script for a video about "${topic}".
      The script's language must be ${language}.
    `;

    if (questions && questions.trim().length > 0) {
      prompt += `
      The script MUST be based *solely* on the answers to the following questions. Use Google Search to find accurate, up-to-date information to answer them. Structure the video script to answer these questions in a logical and engaging order, with a clear beginning, middle, and end.

      Here are the questions:
      ${questions}
      `;
    } else {
      prompt += `
      The script should have a clear narrative structure with a distinct beginning (introduction), middle (elaboration of the main points), and a clear end (conclusion). It must be informative and entertaining for a general audience. Use Google Search to gather fresh and accurate information on the topic.
      `;
    }

    prompt += `
      Provide exactly ${numScenes} scenes, including an introduction and a conclusion.
      For each scene, provide:
      1. A short, engaging question as a title for the scene.
      2. The narrator's script, which should be well-developed and consist of at least 3-5 substantial sentences.
      3. A detailed, creative visual prompt for an AI image generator.

      IMPORTANT: Your response MUST be a valid JSON object that follows this structure:
      {
        "title": "A catchy and SEO-friendly title for the YouTube video.",
        "scenes": [
          {
            "title": "A short, engaging question that this scene will answer.",
            "script": "The narrator's lines for this scene. This should be engaging, informative, and well-developed, consisting of at least 3-5 substantial sentences that elaborate on the scene's topic.",
            "visual_prompt": "A concise, descriptive prompt for generating a visually stunning image to accompany this part of the script. Focus on cinematic and engaging imagery."
          }
        ]
      }
      Do not include any text, markdown formatting, or code blocks outside of the main JSON object.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let jsonText = response.text;
    
    // Clean potential markdown formatting
    const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1];
    } else {
        const startIndex = jsonText.indexOf('{');
        const endIndex = jsonText.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            jsonText = jsonText.substring(startIndex, endIndex + 1);
        }
    }

    const scriptData = JSON.parse(jsonText);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { scriptData, groundingChunks };
  } catch (error) {
    console.error("Error generating script:", error);
     if (error instanceof SyntaxError) {
        console.error("Failed to parse JSON response from API");
        throw new Error("The model returned an invalid script format. Please try again.");
    }
    throw new Error("Failed to generate script. Please check your prompt and API key.");
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image.");
  }
}

let chat: Chat | null = null;

function getChatInstance(): Chat {
  if (!chat) {
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are a helpful assistant for a YouTube content creator. Answer their questions concisely and helpfully.',
      },
    });
  }
  return chat;
}

export async function sendMessageToChat(message: string): Promise<string> {
  try {
    const chatInstance = getChatInstance();
    const response = await chatInstance.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error in chat:", error);
    throw new Error("Failed to get a response from the chatbot.");
  }
}
