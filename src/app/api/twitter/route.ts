import { NextRequest, NextResponse } from "next/server";

// Track API key usage and errors
interface KeyMetrics {
  usageCount: number;
  errorCount: number;
  lastUsed: number;
  isRateLimited: boolean;
}

const keyMetrics: { [key: string]: KeyMetrics } = {};
const RATE_LIMIT_RESET_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// Helper function to get the next available API key
function getNextViableKey(keys: string[]): string | null {
  const now = Date.now();
  
  // Reset metrics for keys that have passed the rate limit window
  keys.forEach(key => {
    if (keyMetrics[key]?.isRateLimited && 
        now - keyMetrics[key].lastUsed >= RATE_LIMIT_RESET_TIME) {
      keyMetrics[key].isRateLimited = false;
      keyMetrics[key].errorCount = 0;
      keyMetrics[key].usageCount = 0;
    }
  });

  // Find the first non-rate-limited key
  return keys.find(key => !keyMetrics[key]?.isRateLimited) || null;
}

// Initialize or update key metrics
function initializeKeyMetrics(key: string) {
  if (!keyMetrics[key]) {
    keyMetrics[key] = {
      usageCount: 0,
      errorCount: 0,
      lastUsed: Date.now(),
      isRateLimited: false
    };
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");

  if (!username) {
    return new NextResponse("Username is required", { status: 400 });
  }

  try {
    // Collect all RapidAPI keys from environment variables
    const rapidApiKeys = [
      process.env.RAPIDAPI_KEY_1,
      process.env.RAPIDAPI_KEY_2,
      process.env.RAPIDAPI_KEY_3,
    ].filter((key): key is string => Boolean(key));

    if (rapidApiKeys.length === 0) {
      return new NextResponse("No valid RapidAPI keys found", { status: 500 });
    }

    let lastError: any = null;
    let attempts = 0;
    const maxAttempts = rapidApiKeys.length * 2; // Allow each key to be tried twice

    while (attempts < maxAttempts) {
      const currentKey = getNextViableKey(rapidApiKeys);
      
      if (!currentKey) {
        if (lastError?.status === 429) {
          return new NextResponse("All API keys are rate limited. Please try again later.", 
            { status: 429 });
        }
        break;
      }

      try {
        initializeKeyMetrics(currentKey);
        keyMetrics[currentKey].usageCount++;
        keyMetrics[currentKey].lastUsed = Date.now();

        const response = await fetch(
          `https://twitter-api45.p.rapidapi.com/screenname.php?screenname=${username}`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
              "x-rapidapi-key": currentKey,
            } as HeadersInit,
          }
        );

        // Handle rate limiting
        if (response.status === 429) {
          keyMetrics[currentKey].isRateLimited = true;
          keyMetrics[currentKey].errorCount++;
          lastError = { status: 429, message: "Rate limited" };
          attempts++;
          continue;
        }

        // Handle successful response
        if (response.ok) {
          const jsonResponse = await response.json();
          
          if (jsonResponse.status !== "active") {
            return new NextResponse("User not found or inactive", { status: 404 });
          }

          const userImage = jsonResponse.avatar.replace("_normal", "_200x200");
          const userData = {
            name: jsonResponse.name,
            username: jsonResponse.profile,
            profile_image_url: userImage,
            description: jsonResponse.desc,
            followers_count: jsonResponse.sub_count,
            following_count: jsonResponse.friends,
            tweet_count: jsonResponse.statuses_count,
            profile_banner_url: jsonResponse.header_image,
            verified: jsonResponse.blue_verified || false,
            url: jsonResponse.website,
            location: jsonResponse.location,
            created_at: jsonResponse.created_at,
            user_id: jsonResponse.id,
          };

          return new NextResponse(JSON.stringify(userData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } else {
          keyMetrics[currentKey].errorCount++;
          lastError = `Error fetching Twitter data: ${response.statusText}`;
          console.error(`Key ${currentKey} failed: Status ${response.status}`);
        }
      } catch (error: any) {
        keyMetrics[currentKey].errorCount++;
        console.error(`Error with key ${currentKey}:`, error.message || error);
        lastError = error;
      }

      attempts++;
    }

    // If all attempts fail, return the last error
    return new NextResponse(
      lastError?.message || lastError || "Error fetching Twitter data", 
      { status: lastError?.status || 500 }
    );

  } catch (error: any) {
    console.error("Unexpected error occurred:", error.message || error);
    return new NextResponse("Error fetching Twitter data", { status: 500 });
  }
}