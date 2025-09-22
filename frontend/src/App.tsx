import React, { useState, useRef, useEffect } from 'react';
import APIClient from './api/apiClient';
import AudioController from './audio/audioController';
import AlbumList from './components/AlbumList';
import SongList from './components/SongList';
import AudioPlayer from './components/AudioPlayer';

function App() {
  const apiClient = new APIClient('toyfer', 'MelodyHub');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [songs, setSongs] = useState<string[]>([]);
  const audioControllerRef = useRef<AudioController | null>(null);

  const handleSelectAlbum = (album: string, fetchedSongs: string[]) => {
    setSelectedAlbum(album);
    setSongs(fetchedSongs);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (audioControllerRef.current) {
          if (audioControllerRef.current.isPlaying) {
            audioControllerRef.current.pause();
          } else {
            audioControllerRef.current.resume();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
        <SongList album={selectedAlbum} songs={songs} audioController={audioControllerRef.current} />
      )}

      <AudioPlayer apiClient={apiClient} audioControllerRef={audioControllerRef} />
    </div>
  );
}

export default App;
