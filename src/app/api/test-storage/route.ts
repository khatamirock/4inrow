import { NextResponse } from "next/server";

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    storage: {
      kv: {
        enabled: !!process.env.KV_REST_API_URL,
        url: process.env.KV_REST_API_URL ? 'configured' : 'not configured',
      },
      edgeConfig: {
        enabled: !!process.env.EDGE_CONFIG,
        id: process.env.EDGE_CONFIG || 'not configured',
        token: process.env.EDGE_CONFIG_ACCESS_TOKEN ? 'configured' : 'not configured',
      },
    },
    recommendations: [] as string[],
  };

  // Add recommendations based on what's missing
  if (!results.storage.kv.enabled) {
    results.recommendations.push("KV database not configured. Go to Vercel dashboard → Storage → Create KV database");
  }

  if (!results.storage.edgeConfig.enabled) {
    results.recommendations.push("Edge Config not configured. Go to Vercel dashboard → Storage → Create Edge Config");
  }

  if (!results.storage.edgeConfig.token) {
    results.recommendations.push("Edge Config access token not configured. Add EDGE_CONFIG_ACCESS_TOKEN to environment variables");
  }

  if (results.recommendations.length === 0) {
    results.recommendations.push("All storage services appear to be configured correctly!");
  }

  return NextResponse.json(results);
}