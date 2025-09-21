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
    }

    /**
     * Fetches the list of available albums.
     * Always tries GitHub API first, falls back to demo data if needed.
     * @async
     * @returns {Promise<string[]>} Array of album names
     */
    async fetchAlbumList() {
        try {
            console.log('Fetching albums from GitHub API:', this.baseUrl);
            const response = await fetch(this.baseUrl);
            if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

            const data = await response.json();
            console.log('GitHub API response:', data);

            const albums = data
                .filter(item => item.type === 'dir')
                .map(item => item.name)
                .filter(name => name !== 'css' && name !== 'js');

            // アルバムが見つかった場合はGitHubデータを返す
            if (albums.length > 0) {
                console.log('Using GitHub albums:', albums);
                return albums;
            }

            throw new Error('No albums found in repository');
        } catch (err) {
            console.warn('GitHub API failed, using demo data:', err.message);
            // APIが失敗したらデモデータを使用
            return ['monsterhunter', 'classical', 'jazz', 'electronic'];
        }
    }

    /**
     * Fetches the list of songs in a specific album.
     * Always tries GitHub API first, falls back to demo data if needed.
     * @async
     * @param {string} album - The album name to fetch songs from
     * @returns {Promise<string[]>} Array of song filenames
     */
    async fetchSongList(album) {
        try {
            console.log(`Fetching songs for album: ${album} from GitHub API`);
            const response = await fetch(`${this.baseUrl}${album}`);
            if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

            const data = await response.json();
            console.log(`GitHub API response for ${album}:`, data);

            const songs = data
                .filter(item => item.type === 'file' && this.isAudioFile(item.name))
                .map(item => item.name);

            // 曲が見つかった場合はGitHubデータを返す
            if (songs.length > 0) {
                console.log(`Using GitHub songs for ${album}:`, songs);
                return songs;
            }

            throw new Error(`No songs found in album ${album}`);
        } catch (err) {
            console.warn(`GitHub API failed for ${album}, using demo data:`, err.message);

            // APIが失敗したらデモデータを使用
            const demoSongs = {
                'monsterhunter': ['もうひとつの楽しみ.mp3', '大敵への挑戦.mp3'],
                'classical': ['Beethoven - Symphony No. 9.mp3', 'Mozart - Piano Sonata K331.mp3', 'Bach - Brandenburg Concerto No. 3.mp3'],
                'jazz': ['Miles Davis - Kind of Blue.mp3', 'John Coltrane - Giant Steps.mp3', 'Bill Evans - Waltz for Debby.mp3'],
                'electronic': ['Ambient Journey.mp3', 'Digital Dreams.mp3', 'Synthwave Nights.mp3']
            };
            return demoSongs[album] || [];
        }
    }

    /**
     * Checks if a filename represents an audio file based on its extension.
     * @param {string} filename - The filename to check
     * @returns {boolean} True if the file is an audio file, false otherwise
     */
    isAudioFile(filename) {
        return this.audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }
}

export default APIClient;