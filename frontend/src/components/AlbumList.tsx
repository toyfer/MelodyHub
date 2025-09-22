import React, { useEffect, useState } from 'react';
import APIClient from '../api/apiClient';
import AudioController from '../audio/audioController';

interface AlbumListProps {
  apiClient: APIClient;
  audioController: AudioController | null;
}

const AlbumList: React.FC<AlbumListProps> = ({ apiClient, audioController }) => {
  const [albums, setAlbums] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [songs, setSongs] = useState<string[]>([]);
  const [songsLoading, setSongsLoading] = useState<boolean>(false);
  const [songsError, setSongsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        const fetchedAlbums = await apiClient.fetchAlbumList();
        setAlbums(fetchedAlbums);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch albums');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [apiClient]);

  const handleAlbumClick = async (album: string) => {
    setSelectedAlbum(album);
    setSongsLoading(true);
    setSongsError(null);
    try {
      const fetchedSongs = await apiClient.fetchSongList(album);
      setSongs(fetchedSongs);
      console.log(`Songs for ${album}:`, fetchedSongs); // 一時的にコンソールに出力
    } catch (err) {
      setSongsError(err instanceof Error ? err.message : 'Failed to fetch songs');
    } finally {
      setSongsLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading albums...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {albums.map((album) => (
          <button
            key={album}
            className={`px-4 py-2 rounded-md shadow-sm ${selectedAlbum === album ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => handleAlbumClick(album)}
          >
            {album.charAt(0).toUpperCase() + album.slice(1)}
          </button>
        ))}
      </div>

      {selectedAlbum && (
        <div className="mt-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Songs in {selectedAlbum.charAt(0).toUpperCase() + selectedAlbum.slice(1)}</h3>
          {songsLoading && <div className="text-center">Loading songs...</div>}
          {songsError && <div className="text-center text-red-500">Error: {songsError}</div>}
          {!songsLoading && !songsError && songs.length === 0 && (
            <div className="text-center text-gray-500">No songs found in this album.</div>
          )}
          {!songsLoading && !songsError && songs.length > 0 && (
            <ul>
              {songs.map((song) => (
                <li key={song} className="py-1">
                  {song}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AlbumList;
