import React, { useEffect, useState } from 'react';
import APIClient from '../api/apiClient';

interface AlbumListProps {
  apiClient: APIClient;
}

const AlbumList: React.FC<AlbumListProps> = ({ apiClient }) => {
  const [albums, setAlbums] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div className="text-center py-4">Loading albums...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {albums.map((album) => (
        <button
          key={album}
          className="btn btn-outline px-4 py-2 rounded-md shadow-sm hover:bg-gray-100"
        >
          {album.charAt(0).toUpperCase() + album.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default AlbumList;
