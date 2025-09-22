interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir";
  _links: {
    git: string;
    self: string;
    html: string;
  };
}

interface APIClientCache {
  albumList?: string[];
  [albumName: string]: string[] | undefined;
}

class APIClient {
  private baseUrl: string;
  private audioExtensions: string[];
  private cache: APIClientCache;

  constructor(repoOwner: string, repoName: string) {
    this.baseUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;
    this.audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    this.cache = {};
  }

  async fetchAlbumList(): Promise<string[]> {
    if (this.cache.albumList) {
      return this.cache.albumList;
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(this.baseUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

        const data: GitHubContentItem[] = await response.json();

        const albums = data
          .filter(item => item.type === 'dir')
          .map(item => item.name)
          .filter(name => name !== 'css' && name !== 'js');

        if (albums.length > 0) {
          this.cache.albumList = albums;
          return albums;
        }

        throw new Error('No albums found in repository');
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          // Handle abort error if needed
        } else {
          // Handle other errors
        }
        throw err; // Propagate the error if API call fails
      }
    }
    throw new Error('Failed to fetch album list after multiple retries');
  }

  async fetchSongList(album: string): Promise<string[]> {
    if (this.cache[album]) {
      return this.cache[album]!;
    }

    if (!album || typeof album !== 'string' || album.trim() === '') {
      throw new Error('Invalid album name provided');
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`${this.baseUrl}${album}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

        const data: GitHubContentItem[] = await response.json();

        const songs = data
          .filter(item => item.type === 'file' && this.isAudioFile(item.name))
          .map(item => item.name);

        if (songs.length > 0) {
          this.cache[album] = songs;
          return songs;
        }

        throw new Error(`No songs found in album ${album}`);
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          // Handle abort error if needed
        } else {
          // Handle other errors
        }
        throw err; // Propagate the error if API call fails
      }
    }
    throw new Error('Failed to fetch song list after multiple retries');
  }

  isAudioFile(filename: string): boolean {
    return this.audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }
}

export default APIClient;
