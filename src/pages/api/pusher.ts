import Pusher from 'pusher';
import { NextApiRequest, NextApiResponse } from 'next';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { channel, event, data } = req.body;

    try {
        await pusher.trigger(channel, event, data);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Pusher error:', error);
        res.status(500).json({ error: 'Failed to trigger event' });
    }
}
