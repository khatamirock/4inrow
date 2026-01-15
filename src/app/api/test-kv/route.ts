import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  try {
    const USE_KV = process.env.KV_REST_API_URL ? true : false;

    if (!USE_KV) {
      return NextResponse.json({
        kv_enabled: false,
        message: "KV not configured. Go to Vercel dashboard → Storage → Create KV database"
      });
    }

    // Test KV connection
    const testKey = `test_${Date.now()}`;
    const testValue = { message: "KV is working!", timestamp: new Date().toISOString() };

    await kv.set(testKey, JSON.stringify(testValue));
    const retrieved = await kv.get(testKey);
    await kv.del(testKey); // Clean up

    if (retrieved) {
      return NextResponse.json({
        kv_enabled: true,
        message: "KV is working correctly!",
        test: JSON.parse(retrieved as string)
      });
    } else {
      return NextResponse.json({
        kv_enabled: true,
        message: "KV configured but test failed",
        error: "Could not retrieve test data"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("KV test error:", error);
    return NextResponse.json({
      kv_enabled: process.env.KV_REST_API_URL ? true : false,
      message: "KV test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
