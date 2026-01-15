import { put, del, list, head } from '@vercel/blob';

const USE_BLOB = process.env.BLOB_READ_WRITE_TOKEN ? true : false;
console.log(`BlobStorage: Blob enabled: ${USE_BLOB}`);

export class BlobStorage {
  /**
   * Upload data to Vercel Blob storage
   * @param key - Unique key for the blob (e.g., 'game-logs/room_123.json')
   * @param data - Data to store (string, Buffer, or Blob)
   * @param options - Additional options for the upload
   * @returns Promise with the blob URL
   */
  static async upload(
    key: string,
    data: string | Buffer | Blob,
    options: { contentType?: string; addRandomSuffix?: boolean } = {}
  ): Promise<{ url: string; key: string } | null> {
    if (!USE_BLOB) {
      console.warn('Blob storage not configured');
      return null;
    }

    try {
      const { contentType = 'application/json', addRandomSuffix = false } = options;

      const blob = await put(key, data, {
        access: 'public',
        contentType,
        addRandomSuffix,
      });

      console.log(`Blob uploaded successfully: ${blob.url}`);
      return { url: blob.url, key: blob.pathname };
    } catch (error) {
      console.error('Failed to upload to Blob storage:', error);
      return null;
    }
  }

  /**
   * Delete a blob from storage
   * @param url - The blob URL to delete
   * @returns Promise<boolean> - true if deleted successfully
   */
  static async delete(url: string): Promise<boolean> {
    if (!USE_BLOB) {
      console.warn('Blob storage not configured');
      return false;
    }

    try {
      await del(url);
      console.log(`Blob deleted successfully: ${url}`);
      return true;
    } catch (error) {
      console.error('Failed to delete from Blob storage:', error);
      return false;
    }
  }

  /**
   * List blobs with a specific prefix
   * @param prefix - Prefix to filter blobs (e.g., 'game-logs/')
   * @returns Promise with array of blob info
   */
  static async list(prefix?: string): Promise<any[]> {
    if (!USE_BLOB) {
      console.warn('Blob storage not configured');
      return [];
    }

    try {
      const { blobs } = await list({ prefix });
      return blobs;
    } catch (error) {
      console.error('Failed to list blobs:', error);
      return [];
    }
  }

  /**
   * Get blob metadata without downloading
   * @param url - The blob URL
   * @returns Promise with blob metadata
   */
  static async getMetadata(url: string): Promise<any | null> {
    if (!USE_BLOB) {
      console.warn('Blob storage not configured');
      return null;
    }

    try {
      const metadata = await head(url);
      return metadata;
    } catch (error) {
      console.error('Failed to get blob metadata:', error);
      return null;
    }
  }

  /**
   * Store game log data as JSON
   * @param roomId - Room ID
   * @param logData - Game log data
   * @returns Promise with blob info
   */
  static async storeGameLog(roomId: string, logData: any): Promise<{ url: string; key: string } | null> {
    const key = `game-logs/${roomId}/${Date.now()}.json`;
    const jsonData = JSON.stringify(logData, null, 2);
    return this.upload(key, jsonData, { contentType: 'application/json' });
  }

  /**
   * Store game state backup
   * @param roomId - Room ID
   * @param gameState - Game state object
   * @returns Promise with blob info
   */
  static async storeGameBackup(roomId: string, gameState: any): Promise<{ url: string; key: string } | null> {
    const key = `game-backups/${roomId}/${Date.now()}.json`;
    const jsonData = JSON.stringify(gameState, null, 2);
    return this.upload(key, jsonData, { contentType: 'application/json' });
  }

  /**
   * Get all game logs for a room
   * @param roomId - Room ID
   * @returns Promise with array of log blobs
   */
  static async getGameLogs(roomId: string): Promise<any[]> {
    const prefix = `game-logs/${roomId}/`;
    return this.list(prefix);
  }

  /**
   * Get all game backups for a room
   * @param roomId - Room ID
   * @returns Promise with array of backup blobs
   */
  static async getGameBackups(roomId: string): Promise<any[]> {
    const prefix = `game-backups/${roomId}/`;
    return this.list(prefix);
  }
}
