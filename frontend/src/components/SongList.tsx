import React from 'react';
import AudioController from '../audio/audioController';

interface SongListProps {
  album: string;
  songs: string[];
  audioController: AudioController | null;
}

const SongList: React.FC<SongListProps> = ({ album, songs, audioController }) => {
  const handleSongClick = (song: string) => {
    if (audioController) {
      audioController.playSong(album, song);
    }
  };

  return (
    <div className="mt-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Songs in {album.charAt(0).toUpperCase() + album.slice(1)}</h3>
      {songs.length === 0 ? (
        <div className="text-center text-gray-500">No songs found in this album.</div>
      ) : (
        <ul>
          {songs.map((song) => (
            <li
              key={song}
              className="py-1 px-2 hover:bg-gray-100 cursor-pointer rounded-md flex justify-between items-center"
              onClick={() => handleSongClick(song)}
            >
              <span>{song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '')}</span>
              {/* TODO: Add play icon or visual indicator */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SongList;
