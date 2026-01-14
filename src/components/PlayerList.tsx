"use client";

import { GameRoom } from "@/types/game";

interface PlayerListProps {
  room: GameRoom;
  playerId: string;
}

export default function PlayerList({ room, playerId }: PlayerListProps) {
  const isHost = room.host === playerId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Players */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>Active Players</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {room.players.map((player) => (
            <div
              key={player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: '8px',
                backgroundImage: player.playerNumber === room.currentPlayer
                  ? 'linear-gradient(90deg, #ca8a04 0%, #ea580c 100%)'
                  : player.playerNumber === 1
                  ? undefined
                  : player.playerNumber === 2
                  ? undefined
                  : undefined,
                backgroundColor: !player.playerNumber || player.playerNumber === room.currentPlayer 
                  ? undefined 
                  : player.playerNumber === 1
                  ? '#7f1d1d'
                  : player.playerNumber === 2
                  ? '#713f12'
                  : '#14532d'
              }}
            >
              <div>
                <p style={{ fontWeight: '600', color: 'white' }}>{player.name}</p>
                <p style={{ fontSize: '12px', color: '#e5e7eb' }}>
                  Player {player.playerNumber}
                  {isHost && player.id === room.host && " 👑"}
                  {player.id === playerId && " (You)"}
                </p>
              </div>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid white' }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Spectators */}
      {room.spectators.length > 0 && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
            Spectators ({room.spectators.length})
          </h3>
          <div style={{ background: '#374151', padding: '8px', borderRadius: '8px', fontSize: '12px', color: '#d1d5db' }}>
            {room.spectators.length} watching
          </div>
        </div>
      )}

      {/* Room Key */}
      <div style={{ background: '#374151', padding: '12px', borderRadius: '8px' }}>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Room Key</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: 'Courier New, monospace', fontSize: '18px', fontWeight: 'bold', color: '#22d3ee' }}>{room.roomKey}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(room.roomKey);
            }}
            style={{ fontSize: '12px', padding: '4px 8px', background: '#2563eb', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#1d4ed8')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#2563eb')}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
