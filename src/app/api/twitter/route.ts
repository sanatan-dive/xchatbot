import { NextRequest, NextResponse } from "next/server";

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
    ].filter((key): key is string => Boolean(key)); // Ensure no undefined or empty keys

    if (rapidApiKeys.length === 0) {
      return new NextResponse("No valid RapidAPI keys found", { status: 500 });
    }

    let lastError: any = null;

    for (const rapidApiKey of rapidApiKeys) {
      try {
        // Fetch user data from the RapidAPI endpoint
        const response = await fetch(
          `https://twitter-api45.p.rapidapi.com/screenname.php?screenname=${username}`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
              "x-rapidapi-key": rapidApiKey, // Valid string ensured by filter
            } as HeadersInit, // Explicitly cast to HeadersInit
          }
        );

        if (response.ok) {
          // Parse the JSON response from RapidAPI
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
          console.error(`Key failed: ${rapidApiKey}, Status: ${response.status}`);
          lastError = `Error fetching Twitter data: ${response.statusText}`;
        }
      } catch (error: any) {
        console.error(`Error with key ${rapidApiKey}:`, error.message || error);
        lastError = error;
      }
    }

    // If all keys fail, return the last error
    return new NextResponse(lastError || "Error fetching Twitter data", { status: 500 });
  } catch (error: any) {
    console.error("Unexpected error occurred:", error.message || error);
    return new NextResponse("Error fetching Twitter data", { status: 500 });
  }
}
