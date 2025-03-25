import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize single API keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Types for better type safety
interface Tweet {
  content?: {
    __typename?: string;
    tweetResult?: {
      result?: {
        __typename?: string;
        legacy?: {
          full_text?: string;
        };
        retweeted_status_result?: {
          result?: {
            __typename?: string;
            legacy?: {
              full_text?: string;
            };
          };
        };
      };
    };
    // For TimelineTimelineModule
    items?: {
      item?: {
        content?: {
          tweetResult?: {
            result?: {
              __typename?: string;
              legacy?: {
                full_text?: string;
              };
            };
          };
        };
      };
    }[];
  };
}

interface TwitterResponse {
  data?: {
    user_result?: {
      result?: {
        timeline_response?: {
          timeline?: {
            instructions: {
              __typename: string;
              entry?: any;
              entries?: any[];
            }[];
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
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch user data: ${response.statusText}`);
  }

  const jsonResponse = await response.json();
  // console.log("JSON Response:", jsonResponse);

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
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Data:", data);

  const instructions = data?.data?.user_result?.result?.timeline_response?.timeline?.instructions || [];
  console.log("Instructions:", instructions);

  // Extract entries from both TimelinePinEntry and TimelineAddEntries
  const entries = instructions.flatMap((inst: any) => {
    if (inst.__typename === 'TimelinePinEntry') {
      return [inst.entry];
    } else if (inst.__typename === 'TimelineAddEntries') {
      return inst.entries || [];
    }
    return [];
  });
  console.log("Entries:", entries);

  // Extract tweet text from entries
  const tweets = entries
    .map((entry: any) => {
      // Skip cursor entries
      if (entry.content?.__typename === 'TimelineTimelineCursor') {
        return undefined;
      }

      // Handle regular tweets under TimelineTimelineItem
      const tweetResult = entry.content?.tweetResult?.result;
      if (tweetResult?.__typename === 'Tweet') {
        return tweetResult.legacy?.full_text;
      }

      // Handle retweets
      if (tweetResult?.retweeted_status_result?.result?.__typename === 'Tweet') {
        return tweetResult.retweeted_status_result.result.legacy?.full_text;
      }

      // Handle conversation modules (TimelineTimelineModule) - extract first tweet if needed
      if (entry.content?.__typename === 'TimelineTimelineModule') {
        const firstTweet = entry.content.items?.[0]?.item?.content?.tweetResult?.result;
        if (firstTweet?.__typename === 'Tweet') {
          return firstTweet.legacy?.full_text;
        }
      }

      return undefined;
    })
    .filter((text: string | undefined): text is string => typeof text === 'string');

  console.log("Tweets:", tweets);
  return tweets;
}

async function generatePersonaResponse(
  tweets: string[],
  inputMessage: string,
  userData: UserData
): Promise<string> {
  try {
    const sanitizedTweets = tweets
      .map(tweet => tweet.replace(/[^\w\s.,!?-]/g, ''))
      .join('\n')
      .slice(0, 5000);

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
9. use special characters if you think it is appropriate`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const chat = model.startChat({
      generationConfig: {
        maxOutputTokens: 100,
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