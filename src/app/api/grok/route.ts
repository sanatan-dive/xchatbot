import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// Export POST method handler
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const userMessage = body.message;

    // Create chat completion
    const completion = await openai.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        {
          role: "system",
          content: "You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // Return the response
    console.log(completion.choices[0].message.content);
    return NextResponse.json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

