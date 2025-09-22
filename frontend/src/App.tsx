import React, { useState } from 'react';
import APIClient from './api/apiClient';
import AlbumList from './components/AlbumList';
import AudioPlayer from './components/AudioPlayer';

function App() {
  const apiClient = new APIClient('toyfer', 'MelodyHub');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [songs, setSongs] = useState<string[]>([]);

  const handleSelectAlbum = (album: string, fetchedSongs: string[]) => {
    setSelectedAlbum(album);
    setSongs(fetchedSongs);
    console.log('Selected Album in App.tsx:', album);
    console.log('Fetched Songs in App.tsx:', fetchedSongs);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        MelodyHub
      </h1>
      <div className="bg-white shadow-md rounded-lg p-4 mb-4">
        <h2 className="text-xl font-semibold mb-4">Select Album</h2>
        <AlbumList apiClient={apiClient} onSelectAlbum={handleSelectAlbum} />
      </div>

      {selectedAlbum && songs.length > 0 && (
        <div className="mt-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Songs in {selectedAlbum.charAt(0).toUpperCase() + selectedAlbum.slice(1)}</h3>
          <ul>
            {songs.map((song) => (
              <li key={song} className="py-1">
                {song}
              </li>
            ))}
          </ul>
        </div>
      )}

      <AudioPlayer apiClient={apiClient} />
    </div>
  );
}

export default App;
