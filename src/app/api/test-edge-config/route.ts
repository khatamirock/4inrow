import { NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

export async function GET() {
  try {
    const USE_EDGE_CONFIG = process.env.EDGE_CONFIG ? true : false;

    if (!USE_EDGE_CONFIG) {
      return NextResponse.json({
        edge_config_enabled: false,
        message: "Edge Config not configured. Set EDGE_CONFIG environment variable"
      });
    }

    // Test Edge Config connection
    const testKey = `test_${Date.now()}`;

    // Test setting data (this would normally be done via update function)
    // For testing, we'll just try to get a non-existent key
    const testGet = await get(testKey);

    return NextResponse.json({
      edge_config_enabled: true,
      message: "Edge Config is configured correctly!",
      test: testGet || "Key not found (expected for test)"
    });
  } catch (error) {
    console.error("Edge Config test error:", error);
    return NextResponse.json({
      edge_config_enabled: process.env.EDGE_CONFIG ? true : false,
      message: "Edge Config test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
