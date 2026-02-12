import Groq from "groq-sdk";

// Singleton Groq client
let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error(
                "GROQ_API_KEY is not set. Add it to your .env.local file."
            );
        }
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

// Free Groq models
export const MODELS = {
    // Fast, good for most tasks
    FAST: "llama-3.3-70b-versatile",
    // Ultra-fast, good for simple tasks
    INSTANT: "llama-3.1-8b-instant",
    // For complex reasoning
    ADVANCED: "llama-3.3-70b-versatile",
} as const;

export type ModelType = keyof typeof MODELS;

export interface AIGenerationOptions {
    model?: ModelType;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

export async function generateText(
    prompt: string,
    options: AIGenerationOptions = {}
): Promise<string> {
    const client = getGroqClient();
    const {
        model = "FAST",
        temperature = 0.7,
        maxTokens = 2048,
        systemPrompt,
    } = options;

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await client.chat.completions.create({
        model: MODELS[model],
        messages,
        temperature,
        max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || "";
}

export async function generateJSON<T>(
    prompt: string,
    options: AIGenerationOptions = {}
): Promise<T> {
    const client = getGroqClient();
    const {
        model = "FAST",
        temperature = 0.4,
        maxTokens = 2048,
        systemPrompt,
    } = options;

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await client.chat.completions.create({
        model: MODELS[model],
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(content) as T;
}
