import React, { useEffect, useState } from 'react';
import APIClient from '../api/apiClient';

interface AlbumListProps {
  apiClient: APIClient;
  onSelectAlbum: (album: string, songs: string[]) => void;
}

const AlbumList: React.FC<AlbumListProps> = ({ apiClient, onSelectAlbum }) => {
  const [albums, setAlbums] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

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
    try {
      const fetchedSongs = await apiClient.fetchSongList(album);
      onSelectAlbum(album, fetchedSongs);
    } catch (err) {
      // エラーハンドリングは親コンポーネントで行うか、別途実装
      console.error('Failed to fetch songs:', err);
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
    </div>
  );
};

export default AlbumList;
