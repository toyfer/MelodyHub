/**
 * API Client Module
 * Handles communication with GitHub API and local file fetching
 */

/**
 * Handles API communication with GitHub and provides fallback data for demo mode.
 * Manages album and song list fetching with robust error handling.
 */
class APIClient {
    /**
     * Creates an instance of APIClient.
     * @param {string} repoOwner - The GitHub repository owner
     * @param {string} repoName - The GitHub repository name
     */
    constructor(repoOwner, repoName) {
        /** @type {string} GitHub repository owner */
        this.repoOwner = repoOwner;
        /** @type {string} GitHub repository name */
        this.repoName = repoName;
        /** @type {string} Base URL for GitHub API calls */
        this.baseUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;
        /** @type {string[]} Supported audio file extensions */
        this.audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
        /** @type {Object} Cache for API responses */
        this.cache = {};
    }

    /**
     * Fetches the list of available albums.
     * Always tries GitHub API first, falls back to demo data if needed.
     * @async
     * @returns {Promise<string[]>} Array of album names
     */
    async fetchAlbumList() {
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

                const data = await response.json();

                const albums = data
                    .filter(item => item.type === 'dir')
                    .map(item => item.name)
                    .filter(name => name !== 'css' && name !== 'js');

                // アルバムが見つかった場合はGitHubデータを返す
                if (albums.length > 0) {
                    this.cache.albumList = albums;
                    return albums;
                }

                throw new Error('No albums found in repository');
            } catch (err) {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') {
                } else {
                }
                throw err; // Propagate the error if API call fails
            }
        }
    }

    /**
     * Fetches the list of songs in a specific album.
     * Always tries GitHub API first.
     * @async
     * @param {string} album - The album name to fetch songs from
     * @returns {Promise<string[]>} Array of song filenames
     */
    async fetchSongList(album) {
        if (this.cache[album]) {
            return this.cache[album];
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

                const data = await response.json();

                const songs = data
                    .filter(item => item.type === 'file' && this.isAudioFile(item.name))
                    .map(item => item.name);

                // 曲が見つかった場合はGitHubデータを返す
                if (songs.length > 0) {
                    this.cache[album] = songs;
                    return songs;
                }

                throw new Error(`No songs found in album ${album}`);
            } catch (err) {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') {
                } else {
                }
                throw err; // Propagate the error if API call fails
            }
        }
    }    /**
     * Checks if a filename represents an audio file based on its extension.
     * @param {string} filename - The filename to check
     * @returns {boolean} True if the file is an audio file, false otherwise
     */
    isAudioFile(filename) {
        return this.audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }
}

export default APIClient;