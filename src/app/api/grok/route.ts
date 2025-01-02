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

interface UserData {
  name: string;
  username: string;
  profile_image_url: string;
  description: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  profile_banner_url: string;
  verified: boolean;
  url: string;
  location: string;
  created_at: string;
  user_id: string;
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

    // Fetch user data and tweets
    const [userData, tweets] = await Promise.all([
      fetchUserData(username),
      fetchTweets(username)
    ]);

    if (!tweets.length) {
      return NextResponse.json(
        { error: 'No tweets found for this user' },
        { status: 404 }
      );
    }

    // Generate persona response
    const response = await generatePersonaResponse(tweets, message, userData);
    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function fetchUserData(username: string): Promise<UserData> {
  const response = await fetch(
    `https://twitter-api45.p.rapidapi.com/screenname.php?screenname=${username}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
        "x-rapidapi-key": rapidAPIKey || '',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch user data: ${response.statusText}`);
  }

  const jsonResponse = await response.json();

  return {
    name: jsonResponse.name || '',
    username: jsonResponse.profile || '',
    profile_image_url: jsonResponse.avatar || '', 
    description: jsonResponse.desc || '',
    followers_count: jsonResponse.sub_count || 0,
    following_count: jsonResponse.friends || 0,
    tweet_count: jsonResponse.statuses_count || 0,
    profile_banner_url: jsonResponse.header_image || '',
    verified: jsonResponse.blue_verified || false,
    url: jsonResponse.website || '',
    location: jsonResponse.location || '',
    created_at: jsonResponse.created_at || '',
    user_id: jsonResponse.id || '',
  };
}

async function fetchTweets(username: string): Promise<string[]> {
  const response = await fetch(
    `https://twitter-x.p.rapidapi.com/user/tweets?username=${encodeURIComponent(username)}&limit=100`,
    {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'twitter-x.p.rapidapi.com',
        'x-rapidapi-key': rapidAPIKey || '',
      },
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
}

async function generatePersonaResponse(
  tweets: string[],
  inputMessage: string,
  userData: UserData
): Promise<string> {
  try {
    // Sanitize tweets and create a safer prompt
    const sanitizedTweets = tweets
      .map(tweet => tweet.replace(/[^\w\s.,!?-]/g, ''))
      .join('\n')
      .slice(0, 5000); // Limit total content

    const safePrompt = `You are acting as ${userData.name} (@${userData.username}). Your task is to analyze their tweets and respond to a message in their authentic voice and style.

Context:
- Their recent tweets: ${sanitizedTweets}
- Their bio: ${userData.description}
- Their location: ${userData.location}
- Account created: ${userData.created_at}
- Follower count: ${userData.followers_count}
- Following count: ${userData.following_count}

Message to respond to: "${inputMessage}"

Response guidelines:
1. Keep response under 50 words
2. Match their vocabulary, tone, and typical response patterns
3. If the message asks about something not evident in their tweets or profile:
   - Provide a natural, generic response that aligns with their overall style
   - Stay in character while being non-committal about specifics
4. Maintain appropriate and professional content
5. Try giving sarcastic answer or funny answer
6. Make your responses more engaging
7. Focus on being conversational rather than formal
8. Use a conversational tone
9. use special characters if you think it is appropriate


Important: Provide ONLY the response message, with very less explanations and no meta-commentary.`;

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