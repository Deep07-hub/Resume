import { NextResponse } from "next/server";

export async function GET() {
  console.log("Testing DeepSeek API connection...");
  
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || "sk-02f34bd0ea4849e8a4232bc656e28727";
    const apiUrl = "https://api.deepseek.com/v1/chat/completions";
    
    // Simple test
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a simple test system.",
          },
          {
            role: "user",
            content: "Say hello",
          },
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepSeek API error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json({ 
        success: false, 
        error: `API Error ${response.status}: ${response.statusText}`,
        details: errorText
      }, { status: 500 });
    }
    
    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      message: "DeepSeek API is working correctly",
      response: data.choices?.[0]?.message?.content || "No content"
    });
  } catch (error) {
    console.error("Error testing DeepSeek API:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to test DeepSeek API",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 