import React, { useRef, useEffect } from 'react';
import APIClient from './api/apiClient';
import AudioController from './audio/audioController';
import AlbumList from './components/AlbumList';

function App() {
  const apiClient = new APIClient('toyfer', 'MelodyHub');
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioControllerRef = useRef<AudioController | null>(null);

  useEffect(() => {
    if (audioRef.current && !audioControllerRef.current) {
      audioControllerRef.current = new AudioController(audioRef.current, apiClient);
    }
  }, [apiClient]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        MelodyHub
      </h1>
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Select Album</h2>
        <AlbumList apiClient={apiClient} audioController={audioControllerRef.current} />
      </div>
      <audio ref={audioRef} className="hidden"></audio>
    </div>
  );
}

export default App;
