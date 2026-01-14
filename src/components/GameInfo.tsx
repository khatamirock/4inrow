"use client";

import { GameRoom } from "@/types/game";

interface GameInfoProps {
  room: GameRoom;
  currentPlayerObj: any;
  isCurrentPlayer: boolean;
  onReset: () => void;
}

export default function GameInfo({
  room,
  currentPlayerObj,
  isCurrentPlayer,
  onReset,
}: GameInfoProps) {
  return (
    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {room.status === "finished" && (
        <div style={{ backgroundImage: 'linear-gradient(90deg, #ca8a04 0%, #ea580c 100%)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
            {room.winner === 0
              ? "🤝 It's a Draw!"
              : `🎉 Player ${room.winner} Wins!`}
          </p>
          {room.winner !== 0 && room.players.find((p) => p.playerNumber === room.winner) && (
            <p style={{ color: 'white' }}>
              Congratulations {room.players.find((p) => p.playerNumber === room.winner)?.name}!
            </p>
          )}
          <button
            onClick={onReset}
            style={{ marginTop: '12px', padding: '8px 16px', background: 'white', color: '#ea580c', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
          >
            Play Again
          </button>
        </div>
      )}

      {room.status === "playing" && (
        <div style={{ background: '#2563eb', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#dbeafe' }}>Current Turn</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{currentPlayerObj?.name}</p>
          {isCurrentPlayer && <p style={{ color: '#fcd34d', fontSize: '14px', marginTop: '4px' }}>👉 Your turn!</p>}
        </div>
      )}

      {room.status === "waiting" && (
        <div style={{ background: '#9333ea', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: 'white', fontWeight: '600' }}>
            Waiting for {3 - room.players.length} more player{3 - room.players.length !== 1 ? "s" : ""}...
          </p>
          <p style={{ fontSize: '14px', color: '#e9d5ff', marginTop: '4px' }}>Share room key: {room.roomKey}</p>
        </div>
      )}
    </div>
  );
}
