import { NextRequest, NextResponse } from "next/server";
import { BlobStorage } from "@/lib/blobStorage";

export async function GET() {
  try {
    const USE_BLOB = process.env.BLOB_READ_WRITE_TOKEN ? true : false;

    if (!USE_BLOB) {
      return NextResponse.json({
        blob_enabled: false,
        message: "Blob storage not configured. Add BLOB_READ_WRITE_TOKEN to your environment variables"
      });
    }

    // Test Blob connection by uploading and retrieving a test file
    const testKey = `test_${Date.now()}.json`;
    const testData = {
      message: "Blob storage is working!",
      timestamp: new Date().toISOString(),
      test: true
    };

    // Upload test data
    const uploadResult = await BlobStorage.upload(testKey, JSON.stringify(testData, null, 2));
    if (!uploadResult) {
      return NextResponse.json({
        blob_enabled: true,
        message: "Blob configured but upload test failed",
        error: "Could not upload test data"
      }, { status: 500 });
    }

    // List blobs to verify upload
    const blobs = await BlobStorage.list('test_');
    const testBlob = blobs.find(blob => blob.pathname === testKey);

    // Clean up test file
    await BlobStorage.delete(uploadResult.url);

    if (testBlob) {
      return NextResponse.json({
        blob_enabled: true,
        message: "Blob storage is working correctly!",
        test: {
          uploaded: uploadResult,
          found: testBlob.pathname,
          cleaned_up: true
        }
      });
    } else {
      return NextResponse.json({
        blob_enabled: true,
        message: "Blob configured but verification failed",
        error: "Test file not found after upload"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Blob test error:", error);
    return NextResponse.json({
      blob_enabled: process.env.BLOB_READ_WRITE_TOKEN ? true : false,
      message: "Blob test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, roomId, data } = await request.json();

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        success: false,
        message: "Blob storage not configured"
      }, { status: 400 });
    }

    switch (action) {
      case 'store_game_log': {
        if (!roomId || !data) {
          return NextResponse.json({
            success: false,
            message: "Missing roomId or data"
          }, { status: 400 });
        }

        const result = await BlobStorage.storeGameLog(roomId, data);
        return NextResponse.json({
          success: !!result,
          result
        });
      }

      case 'store_game_backup': {
        if (!roomId || !data) {
          return NextResponse.json({
            success: false,
            message: "Missing roomId or data"
          }, { status: 400 });
        }

        const result = await BlobStorage.storeGameBackup(roomId, data);
        return NextResponse.json({
          success: !!result,
          result
        });
      }

      case 'get_game_logs': {
        if (!roomId) {
          return NextResponse.json({
            success: false,
            message: "Missing roomId"
          }, { status: 400 });
        }

        const logs = await BlobStorage.getGameLogs(roomId);
        return NextResponse.json({
          success: true,
          logs
        });
      }

      case 'get_game_backups': {
        if (!roomId) {
          return NextResponse.json({
            success: false,
            message: "Missing roomId"
          }, { status: 400 });
        }

        const backups = await BlobStorage.getGameBackups(roomId);
        return NextResponse.json({
          success: true,
          backups
        });
      }

      default:
        return NextResponse.json({
          success: false,
          message: "Invalid action"
        }, { status: 400 });
    }

  } catch (error) {
    console.error("Blob API error:", error);
    return NextResponse.json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
