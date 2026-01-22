import { NextApiRequest, NextApiResponse } from 'next';

// In-memory storage for rooms (temporary until player joins)
// This will work because rooms are only needed during initial join
const rooms = new Map();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { code } = req.query;

    if (req.method === 'GET') {
        const room = rooms.get(code);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        return res.status(200).json(room);
    }

    if (req.method === 'POST') {
        const room = req.body;
        rooms.set(code, room);

        // Clean up old rooms after 1 hour
        setTimeout(() => {
            rooms.delete(code);
        }, 3600000);

        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
