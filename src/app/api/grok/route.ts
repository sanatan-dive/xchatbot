import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const rapidAPIKey = process.env.RAPIDAPI_KEY;

// Types for better type safety
interface Tweet {
  content?: {
    itemContent?: {
      tweet_results?: {
        result?: {
          legacy?: {
            full_text?: string;
          };
        };
      };
    };
  };
}

interface TwitterResponse {
  data?: {
    user?: {
      result?: {
        timeline_v2?: {
          timeline?: {
            instructions?: any[];
          };
        };
      };
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, message } = body;

    if (!username || !message) {
      return NextResponse.json(
        { error: 'Username and message are required' },
        { status: 400 }
      );
    }

    // Fetch tweets with error handling
    const tweets = await fetchTweets(username);
    if (!tweets.length) {
      return NextResponse.json(
        { error: 'No tweets found for this user' },
        { status: 404 }
      );
    }

    // Generate persona response
    const response = await generatePersonaResponse(tweets, message);
    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function fetchTweets(username: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://twitter-x.p.rapidapi.com/user/tweets?username=${encodeURIComponent(username)}&limit=100`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'twitter-x.p.rapidapi.com',
          'x-rapidapi-key': rapidAPIKey || '',
        } as HeadersInit,
      }
    );

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.statusText}`);
    }

    const data = (await response.json()) as TwitterResponse;
    const instructions =
      data?.data?.user?.result?.timeline_v2?.timeline?.instructions || [];
    const entries =
      instructions.find(
        (inst: any) => inst.type === 'TimelineAddEntries'
      )?.entries || [];

    return entries
      .map(
        (entry: Tweet) =>
          entry?.content?.itemContent?.tweet_results?.result?.legacy?.full_text
      )
      .filter((text: string | undefined): text is string => typeof text === 'string');
  } catch (error) {
    console.error('Error in fetchTweets:', error);
    throw new Error('Failed to fetch tweets');
  }
}

async function generatePersonaResponse(
  tweets: string[],
  inputMessage: string
): Promise<string> {
  try {
    // Sanitize tweets and create a safer prompt
    const sanitizedTweets = tweets
      .map(tweet => tweet.replace(/[^\w\s.,!?-]/g, ''))
      .join('\n')
      .slice(0, 5000); // Limit total content

    const safePrompt = `
Analyze these tweets and create a response to the following message that matches the writing style:
Tweets for analysis: ${sanitizedTweets}

Message to respond to: "${inputMessage}"

Guidelines:
- Keep response under 50 words
- Match the general tone and vocabulary
- Focus on natural, conversational language
- Avoid sensitive topics
- Maintain appropriate and professional content

Please provide only the response message.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const chat = model.startChat({
      generationConfig: {
        maxOutputTokens: 100, // Short responses
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
      ]
    });

    const result = await chat.sendMessage(safePrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in generatePersonaResponse:', error);
    throw new Error('Failed to generate persona response');
  }
}