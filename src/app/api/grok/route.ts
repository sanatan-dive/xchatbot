import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';


// Initialize API key rotation
const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY_1 || '',
  process.env.GEMINI_API_KEY_2 || '',
  process.env.GEMINI_API_KEY_3 || '',
  process.env.GEMINI_API_KEY_4 || '',
].filter(key => key !== '');

const RAPIDAPI_KEYS = [
  process.env.RAPIDAPI_KEY_1 || '',
  process.env.RAPIDAPI_KEY_2 || '',
  process.env.RAPIDAPI_KEY_3 || '', 
]

let rapidKeyIndex = 0
let currentKeyIndex = 0;
const keyUsageCount: { [key: string]: number } = {};
const rapidKeyUsageCount: { [key: string]: number } = {};
const keyErrorCount: { [key: string]: number } = {};
const rapidKeyErrorCount: { [key: string]: number } = {};

const MAX_REQUESTS_PER_KEY = 1000;
const MAX_ERRORS_BEFORE_ROTATION = 1;
async function getNextApiKey(): Promise<string> {
  const startingIndex = currentKeyIndex;
  let attempts = 0;

  while (attempts < GEMINI_API_KEYS.length) {
    const currentKey = GEMINI_API_KEYS[currentKeyIndex];
    
    // Check if key has too many errors or exceeded usage
    if (
      (keyErrorCount[currentKey] || 0) >= MAX_ERRORS_BEFORE_ROTATION ||
      (keyUsageCount[currentKey] || 0) >= MAX_REQUESTS_PER_KEY
    ) {
      // Rotate to next key
      currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
      if (currentKeyIndex === startingIndex) {
        throw new Error('All API keys are exhausted or erroring');
      }
      attempts++;
      continue;
    }

    // Initialize counters if needed
    if (!keyUsageCount[currentKey]) keyUsageCount[currentKey] = 0;
    if (!keyErrorCount[currentKey]) keyErrorCount[currentKey] = 0;

    keyUsageCount[currentKey]++;
    return currentKey;
  }

  throw new Error('No valid API keys available');
}

async function getNextRapidKey(): Promise<string> {
  const startingIndex = rapidKeyIndex;
  let attempts = 0;

  while (attempts < RAPIDAPI_KEYS.length) {
    const currentKey = RAPIDAPI_KEYS[rapidKeyIndex];
    
    if (
      (rapidKeyErrorCount[currentKey] || 0) >= MAX_ERRORS_BEFORE_ROTATION ||
      (rapidKeyUsageCount[currentKey] || 0) >= MAX_REQUESTS_PER_KEY
    ) {
      rapidKeyIndex = (rapidKeyIndex + 1) % RAPIDAPI_KEYS.length;
      if (rapidKeyIndex === startingIndex) {
        throw new Error('All RapidAPI keys are exhausted or erroring');
      }
      attempts++;
      continue;
    }

    if (!rapidKeyUsageCount[currentKey]) rapidKeyUsageCount[currentKey] = 0;
    if (!rapidKeyErrorCount[currentKey]) rapidKeyErrorCount[currentKey] = 0;

    rapidKeyUsageCount[currentKey]++;
    return currentKey;
  }

  throw new Error('No valid RapidAPI keys available');
}

async function fetchWithKeyRotation(url: string, options: RequestInit, isRapidApi: boolean = false): Promise<Response> {
  let response: Response;
  let currentAttempt = 0;
  const maxAttempts = isRapidApi ? RAPIDAPI_KEYS.length : GEMINI_API_KEYS.length;

  while (currentAttempt < maxAttempts) {
    try {
      const key = isRapidApi ? await getNextRapidKey() : await getNextApiKey();
      
      // Update headers with new key
      const headers = new Headers(options.headers);
      if (isRapidApi) {
        headers.set('x-rapidapi-key', key);
      } else {
        // Update for Gemini API if needed
      }

      response = await fetch(url, { ...options, headers });

      // Handle rate limiting
      if (response.status === 429) {
        if (isRapidApi) {
          rapidKeyErrorCount[key] = (rapidKeyErrorCount[key] || 0) + 1;
        } else {
          keyErrorCount[key] = (keyErrorCount[key] || 0) + 1;
        }
        currentAttempt++;
        continue;
      }

      return response;
    } catch (error) {
      currentAttempt++;
      if (currentAttempt === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error('All API keys exhausted');
}

// Initialize Gemini client
const apiKey = await getNextApiKey();
const genAI = new GoogleGenerativeAI(apiKey);




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
        "x-rapidapi-key": await getNextRapidKey(),
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
  const response = await fetchWithKeyRotation(
    `https://twitter-x.p.rapidapi.com/user/tweets?username=${encodeURIComponent(username)}&limit=100`,
    {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'twitter-x.p.rapidapi.com',
        'x-rapidapi-key': await getNextRapidKey(),
      },
    },
    true
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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
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
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
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