import React, { useRef, useEffect, useState, useCallback } from 'react';
import AudioController from '../audio/audioController';
import APIClient from '../api/apiClient';
import { UIUpdater } from '../types/ui';

interface AudioPlayerProps {
  apiClient: APIClient;
  audioControllerRef: React.MutableRefObject<AudioController | null>;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ apiClient, audioControllerRef }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDurationState] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UIUpdaterの実装
  const uiUpdater: UIUpdater = {
    setDuration: useCallback(() => {
      if (audioControllerRef.current) {
        setDurationState(audioControllerRef.current.getDuration());
        setCurrentTime(audioControllerRef.current.getCurrentTime());
      }
    }, [audioControllerRef]),
    updateProgress: useCallback(() => {
      if (audioControllerRef.current) {
        setCurrentTime(audioControllerRef.current.getCurrentTime());
      }
    }, [audioControllerRef]),
    updatePlayPauseButton: useCallback(() => {
      if (audioControllerRef.current) {
        setIsPlaying(audioControllerRef.current.isPlaying);
      }
    }, [audioControllerRef]),
    updateVolumeButton: useCallback(() => {
      if (audioControllerRef.current) {
        setIsMuted(audioControllerRef.current.isMuted);
        setVolume(audioControllerRef.current.currentVolume);
      }
    }, [audioControllerRef]),
    updateVolume: useCallback(() => {
      if (audioControllerRef.current) {
        setVolume(audioControllerRef.current.currentVolume);
      }
    }, [audioControllerRef]),
    updateNowPlaying: useCallback((song: string) => {
      setNowPlaying(song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, ''));
    }, []),
    updatePlayingVisual: useCallback((song: string) => {
      // TODO: SongListコンポーネントで実装
    }, []),
    showError: useCallback((message: string) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }, []),
    showSuccess: useCallback((message: string) => {
      // TODO: Successメッセージ表示の実装
      alert(message); // 一時的にalertで表示
    }, []),
    showPlayer: useCallback(() => {
      // TODO: プレイヤー表示ロジック
    }, []),
    hidePlayer: useCallback(() => {
      // TODO: プレイヤー非表示ロジック
    }, []),
    hideNonPlayerSections: useCallback(() => {
      // TODO: 非プレイヤーセクション非表示ロジック
    }, []),
    showAllSections: useCallback(() => {
      // TODO: 全セクション表示ロジック
    }, []),
    resetProgress: useCallback(() => {
      setCurrentTime(0);
      setDurationState(0);
    }, []),
  };

  useEffect(() => {
    if (audioRef.current && !audioControllerRef.current) {
      audioControllerRef.current = new AudioController(audioRef.current, apiClient, uiUpdater);
    }
  }, [apiClient, uiUpdater]);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioControllerRef.current) return;
    if (isPlaying) {
      audioControllerRef.current.pause();
    } else {
      audioControllerRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioControllerRef.current) return;
    const newVolume = parseFloat(e.target.value);
    audioControllerRef.current.setVolume(newVolume);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioControllerRef.current || !audioRef.current) return;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const progress = clickX / width;
    audioControllerRef.current.seek(progress);
  };

  const handleShareLink = async () => {
    if (!audioControllerRef.current || !audioControllerRef.current.currentlyPlaying.album || !audioControllerRef.current.currentlyPlaying.song) {
      uiUpdater.showError('再生中の曲がありません');
      return;
    }
    const album = audioControllerRef.current.currentlyPlaying.album;
    const song = audioControllerRef.current.currentlyPlaying.song;

    const url = new URL(window.location.href);
    url.searchParams.set('album', album);
    url.searchParams.set('song', song);

    try {
      await navigator.clipboard.writeText(url.href);
      uiUpdater.showSuccess('リンクをクリップボードにコピーしました！');
    } catch (err) {
      uiUpdater.showError('リンクのコピーに失敗しました。');
    }
  };

  return (
    <div className="audio-player-container mt-4 p-4 border rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Now Playing: {nowPlaying || 'None'}</h3>
      <div className="flex items-center space-x-4">
        <button onClick={handlePlayPause} className="p-2 rounded-full bg-blue-500 text-white">
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div
            className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Vol:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24"
          />
        </div>
        <button onClick={handleShareLink} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.49 9 12c0-.49-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.632l6.632-3.316m0 0a3 3 0 110-2.684 3 3 0 010 2.684z" />
          </svg>
        </button>
      </div>
      {error && <div className="text-red-500 mt-2">Error: {error}</div>}
      <audio ref={audioRef} className="hidden"></audio>
    </div>
  );
};

export default AudioPlayer;
