/**
 * MelodyHub Music Player
 * A web-based music player for GitHub-hosted audio files
 */

class MelodyPlayer {
    constructor() {
        // DOM Elements
        this.albumSelect = document.getElementById('album-select');
        this.songList = document.getElementById('song-list');
        this.songItems = document.getElementById('song-items');
        this.audioPlayer = document.getElementById('audio-player');
        this.audio = document.getElementById('audio');
        this.nowPlaying = document.getElementById('now-playing');
        this.errorMessage = document.getElementById('error-message');
        this.shareCurrentSongBtn = document.getElementById('share-current-song');

        // Player Controls
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.currentTimeDisplay = document.getElementById('current-time');
        this.durationDisplay = document.getElementById('duration');
        this.progressBar = document.getElementById('progress-bar');
        this.progressFill = document.getElementById('progress-fill');
        this.progressHandle = document.getElementById('progress-handle');
        this.volumeBtn = document.getElementById('volume-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeFill = document.getElementById('volume-fill');
        this.volumeHandle = document.getElementById('volume-handle');

        // State
        this.isPlaying = false;
        this.isMuted = false;
        this.currentVolume = 0.7;
        this.currentlyPlaying = { album: null, song: null };

        // Configuration
        this.repoOwner = 'toyfer';
        this.repoName = 'MelodyHub';
        this.baseUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/`;
        this.demoMode = false;

        // Audio extensions
        this.audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];

        // Bind methods
        this.init = this.init.bind(this);
        this.handleAlbumChange = this.handleAlbumChange.bind(this);
        this.handleSongClick = this.handleSongClick.bind(this);
        this.handlePlayPause = this.handlePlayPause.bind(this);
        this.handleVolumeClick = this.handleVolumeClick.bind(this);
        this.handleProgressClick = this.handleProgressClick.bind(this);
        this.handleVolumeSliderClick = this.handleVolumeSliderClick.bind(this);
        this.handleShareCurrentSong = this.handleShareCurrentSong.bind(this);
        this.handleAudioLoadedMetadata = this.handleAudioLoadedMetadata.bind(this);
        this.handleAudioTimeUpdate = this.handleAudioTimeUpdate.bind(this);
        this.handleAudioEnded = this.handleAudioEnded.bind(this);
    }

    /**
     * Initialize the player
     */
    async init() {
        this.setupEventListeners();
        this.audio.volume = this.currentVolume;
        this.updatePlayPauseButton();
        this.updateVolumeButton();

        const albums = await this.fetchAlbumList();
        this.handleUrlParameters(albums);
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        this.albumSelect.addEventListener('change', this.handleAlbumChange);
        this.playPauseBtn.addEventListener('click', this.handlePlayPause);
        this.volumeBtn.addEventListener('click', this.handleVolumeClick);
        this.progressBar.addEventListener('click', this.handleProgressClick);
        this.volumeSlider.addEventListener('click', this.handleVolumeSliderClick);
        this.shareCurrentSongBtn.addEventListener('click', this.handleShareCurrentSong);

        this.audio.addEventListener('loadedmetadata', this.handleAudioLoadedMetadata);
        this.audio.addEventListener('timeupdate', this.handleAudioTimeUpdate);
        this.audio.addEventListener('ended', this.handleAudioEnded);
    }

    /**
     * Fetch album list from GitHub API
     */
    async fetchAlbumList() {
        if (this.demoMode) {
            const demoAlbums = ['monsterhunter', 'classical', 'jazz', 'electronic'];
            this.populateAlbumSelect(demoAlbums);
            return demoAlbums;
        }

        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                const localAlbums = ['monsterhunter'];
                this.populateAlbumSelect(localAlbums);
                return localAlbums;
            }

            const data = await response.json();
            const albums = data.filter(item => item.type === 'dir').map(item => item.name);
            this.populateAlbumSelect(albums);
            return albums;
        } catch (error) {
            const localAlbums = ['monsterhunter'];
            this.populateAlbumSelect(localAlbums);
            return localAlbums;
        }
    }

    /**
     * Populate album select dropdown
     */
    populateAlbumSelect(albums) {
        albums.forEach(album => {
            const option = document.createElement('option');
            option.value = album;
            option.textContent = album.charAt(0).toUpperCase() + album.slice(1);
            this.albumSelect.appendChild(option);
        });
    }

    /**
     * Fetch song list for an album
     */
    async fetchSongList(album) {
        if (this.demoMode) {
            const demoSongs = {
                'monsterhunter': ['もうひとつの楽しみ.mp3', '大敵への挑戦.mp3'],
                'classical': ['Beethoven - Symphony No. 9.mp3', 'Mozart - Piano Sonata K331.mp3', 'Bach - Brandenburg Concerto No. 3.mp3'],
                'jazz': ['Miles Davis - Kind of Blue.mp3', 'John Coltrane - Giant Steps.mp3', 'Bill Evans - Waltz for Debby.mp3'],
                'electronic': ['Ambient Journey.mp3', 'Digital Dreams.mp3', 'Synthwave Nights.mp3']
            };
            return demoSongs[album] || [];
        }

        try {
            const response = await fetch(`${this.baseUrl}${album}`);
            if (!response.ok) {
                if (album === 'monsterhunter') {
                    return ['もうひとつの楽しみ.mp3', '大敵への挑戦.mp3'];
                }
                throw new Error('曲リストの取得に失敗しました');
            }

            const data = await response.json();
            const songs = data
                .filter(item => item.type === 'file' && this.isAudioFile(item.name))
                .map(item => item.name);
            return songs;
        } catch (error) {
            if (album === 'monsterhunter') {
                return ['もうひとつの楽しみ.mp3', '大敵への挑戦.mp3'];
            }
            this.showError('曲リストの取得に失敗しました');
            return [];
        }
    }

    /**
     * Check if file is an audio file
     */
    isAudioFile(filename) {
        return this.audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }

    /**
     * Handle album selection change
     */
    async handleAlbumChange() {
        const selectedAlbum = this.albumSelect.value;
        if (!selectedAlbum) {
            this.songList.style.display = 'none';
            this.audioPlayer.style.display = 'none';
            return;
        }

        this.songItems.innerHTML = '<li class="loading">楽曲を読み込み中...</li>';
        this.songList.style.display = 'block';

        try {
            const songs = await this.fetchSongList(selectedAlbum);
            this.displaySongList(songs, selectedAlbum);
        } catch (error) {
            this.showError('曲リストの取得に失敗しました');
            this.songList.style.display = 'none';
        }
    }

    /**
     * Display song list
     */
    displaySongList(songs, album) {
        this.songItems.innerHTML = '';
        if (songs.length === 0) {
            this.songItems.innerHTML = '<li class="empty-state"><span class="icon icon-folder" style="margin-right: 0.5rem;"></span>このアルバムには曲がありません</li>';
        } else {
            songs.forEach(song => {
                const li = document.createElement('li');
                const songTitle = document.createElement('span');
                const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
                songTitle.textContent = cleanSongName;
                songTitle.style.flex = '1';

                const shareBtn = document.createElement('button');
                shareBtn.className = 'song-share-button';
                shareBtn.innerHTML = '<span class="icon icon-share"></span>';
                shareBtn.title = 'この曲のリンクをコピー';
                shareBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.shareLink(album, song, shareBtn);
                });

                li.appendChild(songTitle);
                li.appendChild(shareBtn);
                li.title = song;
                li.addEventListener('click', () => this.handleSongClick(album, song));
                this.songItems.appendChild(li);
            });
        }
        this.songList.style.display = 'block';
    }

    /**
     * Handle song click
     */
    handleSongClick(album, song) {
        this.playSong(album, song);
    }

    /**
     * Play a song
     */
    playSong(album, song) {
        if (!this.audio) {
            this.showError('オーディオプレイヤーが初期化されていません。ページを再読み込みしてください');
            return;
        }

        if (!album || !song) {
            this.showError('アルバム名または曲名が指定されていません');
            return;
        }

        this.currentlyPlaying = { album, song };

        if (this.demoMode) {
            const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
            this.nowPlaying.innerHTML = cleanSongName;
            this.audioPlayer.style.display = 'block';
            this.errorMessage.style.display = 'none';

            this.updatePlayingVisual(song);
            setTimeout(() => {
                this.showError('デモモードです。実際の音楽ファイルがあれば再生されます。');
            }, 1000);
            return;
        }

        const songPath = `${encodeURIComponent(album)}/${encodeURIComponent(song)}`;
        console.log('Loading audio from:', songPath);

        this.resetAudioState();

        const handleLoadError = () => {
            const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
            this.showError(`音楽ファイルが見つかりません: ${cleanSongName}`);
        };

        const handlePlayError = (error) => {
            let errorMessage = '音楽の再生に失敗しました';
            if (error.name === 'NotSupportedError') {
                errorMessage = '音楽ファイルの形式がサポートされていません。MP3、WAV、OGG形式をお試しください';
            } else if (error.name === 'NotAllowedError') {
                errorMessage = 'ブラウザによって再生がブロックされました。ページをクリックしてから再試行してください';
            } else if (error.name === 'AbortError') {
                errorMessage = '音楽の読み込みが中断されました。再度お試しください';
            } else if (error.name === 'NetworkError') {
                errorMessage = 'ネットワークエラーが発生しました。接続を確認してください';
            } else if (error.message && error.message.includes('404')) {
                errorMessage = '音楽ファイルが見つかりません。ファイルが存在するか確認してください';
            } else if (error.message) {
                errorMessage += `: ${error.message}`;
            }
            this.showError(errorMessage);
        };

        this.audio.addEventListener('error', handleLoadError, { once: true });

        try {
            this.audio.src = songPath;
            this.audio.load();

            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.errorMessage.style.display = 'none';
                        const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
                        this.showSuccess(`再生開始: ${cleanSongName}`);
                    })
                    .catch(handlePlayError);
            }
        } catch (error) {
            handlePlayError(error);
            return;
        }

        const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
        this.nowPlaying.innerHTML = cleanSongName;
        this.audioPlayer.style.display = 'block';
        this.hideNonPlayerSections();
        this.updatePlayingVisual(song);
    }

    /**
     * Reset audio state
     */
    resetAudioState() {
        try {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isPlaying = false;
            this.updatePlayPauseButton();
        } catch (resetError) {
            console.warn('Error resetting audio state:', resetError);
        }
    }

    /**
     * Update visual feedback for currently playing song
     */
    updatePlayingVisual(song) {
        document.querySelectorAll('#song-items li').forEach(li => {
            li.classList.remove('playing');
        });

        const playingLi = Array.from(document.querySelectorAll('#song-items li')).find(li =>
            li.title === song
        );
        if (playingLi) {
            playingLi.classList.add('playing');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorText = this.errorMessage.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        } else {
            this.errorMessage.innerHTML = `<span class="icon icon-warning"></span><span class="error-text">${message}</span>`;
        }
        this.errorMessage.style.display = 'flex';
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const errorText = this.errorMessage.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        } else {
            this.errorMessage.innerHTML = `<span class="icon icon-check"></span><span class="error-text">${message}</span>`;
        }
        this.errorMessage.className = 'error-message success-message';
        this.errorMessage.style.display = 'flex';

        setTimeout(() => {
            this.errorMessage.style.display = 'none';
            this.errorMessage.className = 'error-message';
        }, 3000);
    }

    /**
     * Generate shareable URL
     */
    generateShareableUrl(album, song) {
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.set('album', album);
        currentUrl.searchParams.set('song', song);
        return currentUrl.toString();
    }

    /**
     * Share link
     */
    async shareLink(album, song, buttonElement = null) {
        const shareUrl = this.generateShareableUrl(album, song);

        try {
            await navigator.clipboard.writeText(shareUrl);
            this.showSuccess(`リンクをコピーしました: ${song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '')}`);

            if (buttonElement) {
                const originalText = buttonElement.innerHTML;
                buttonElement.innerHTML = '<span class="icon icon-check"></span>';
                buttonElement.classList.add('copied');

                setTimeout(() => {
                    buttonElement.innerHTML = originalText;
                    buttonElement.classList.remove('copied');
                }, 2000);
            }
        } catch (err) {
            this.showError('クリップボードへのアクセスができません。URLを手動でコピーしてください: ' + shareUrl);
        }
    }

    /**
     * Handle URL parameters
     */
    async handleUrlParameters(albums) {
        const urlParams = new URLSearchParams(window.location.search);
        const initialAlbum = urlParams.get('album');
        const initialSong = urlParams.get('song');

        if (initialAlbum && initialSong) {
            const errors = this.validateUrlParameters(initialAlbum, initialSong, albums);
            if (errors.length > 0) {
                this.showError(errors.join(' / '));
                return;
            }

            if (albums.includes(initialAlbum)) {
                this.albumSelect.value = initialAlbum;
                const songs = await this.fetchSongList(initialAlbum);

                if (songs.includes(initialSong)) {
                    this.displaySongList(songs, initialAlbum);
                    this.playSong(initialAlbum, initialSong);
                } else {
                    this.displaySongList(songs, initialAlbum);
                    this.showError(`指定された曲がアルバムに存在しません: ${initialSong}`);
                }
            } else {
                this.showError(`指定されたアルバムが存在しません: ${initialAlbum}`);
            }
        }
    }

    /**
     * Validate URL parameters
     */
    validateUrlParameters(album, song, availableAlbums) {
        const errors = [];

        if (!album) {
            errors.push('アルバムが指定されていません');
        } else if (!availableAlbums.includes(album)) {
            errors.push(`指定されたアルバムが存在しません: ${album}`);
        }

        if (!song) {
            errors.push('曲が指定されていません');
        }

        return errors;
    }

    /**
     * Hide non-player sections
     */
    hideNonPlayerSections() {
        document.getElementById('album-selector').style.display = 'none';
        document.getElementById('song-list').style.display = 'none';
    }

    /**
     * Show all sections
     */
    showAllSections() {
        document.getElementById('album-selector').style.display = 'block';
        document.getElementById('song-list').style.display = 'block';
    }

    /**
     * Handle play/pause button click
     */
    async handlePlayPause() {
        if (!this.audio) {
            this.showError('オーディオプレイヤーが初期化されていません');
            return;
        }

        try {
            if (this.isPlaying) {
                this.audio.pause();
                this.isPlaying = false;
                this.showAllSections();
            } else {
                await this.audio.play();
                this.isPlaying = true;
                this.hideNonPlayerSections();
            }
            this.updatePlayPauseButton();
        } catch (error) {
            console.error('Audio playback failed:', error);
            this.showError(error.message || '音声の再生に失敗しました');
            this.isPlaying = false;
            this.updatePlayPauseButton();
        }
    }

    /**
     * Handle volume button click
     */
    handleVolumeClick() {
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
        this.updateVolumeButton();
    }

    /**
     * Handle progress bar click
     */
    handleProgressClick(e) {
        if (this.audio.duration) {
            const rect = this.progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const progress = clickX / rect.width;
            this.audio.currentTime = progress * this.audio.duration;
        }
    }

    /**
     * Handle volume slider click
     */
    handleVolumeSliderClick(e) {
        const rect = this.volumeSlider.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        this.currentVolume = Math.max(0, Math.min(1, clickX / rect.width));
        this.isMuted = false;
        this.audio.muted = false;
        this.updateVolume();
        this.updateVolumeButton();
    }

    /**
     * Handle share current song button click
     */
    handleShareCurrentSong() {
        if (this.currentlyPlaying.album && this.currentlyPlaying.song) {
            this.shareLink(this.currentlyPlaying.album, this.currentlyPlaying.song, this.shareCurrentSongBtn);
        }
    }

    /**
     * Handle audio loaded metadata
     */
    handleAudioLoadedMetadata() {
        this.durationDisplay.textContent = this.formatTime(this.audio.duration);
        this.currentTimeDisplay.textContent = this.formatTime(0);
        this.updateVolume();
    }

    /**
     * Handle audio time update
     */
    handleAudioTimeUpdate() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = `${progress}%`;
            this.progressHandle.style.left = `${progress}%`;
            this.currentTimeDisplay.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    /**
     * Handle audio ended
     */
    handleAudioEnded() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
        this.progressFill.style.width = '0%';
        this.progressHandle.style.left = '0%';
        this.currentTimeDisplay.textContent = this.formatTime(0);
        this.showAllSections();
    }

    /**
     * Format time in seconds to MM:SS
     */
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Update play/pause button
     */
    updatePlayPauseButton() {
        const icon = this.playPauseBtn.querySelector('.icon');
        if (this.isPlaying) {
            icon.className = 'icon icon-pause';
        } else {
            icon.className = 'icon icon-play';
        }
    }

    /**
     * Update volume button
     */
    updateVolumeButton() {
        const icon = this.volumeBtn.querySelector('.icon');
        if (this.isMuted || this.currentVolume === 0) {
            icon.className = 'icon icon-volume-muted';
        } else {
            icon.className = 'icon icon-volume';
        }
    }

    /**
     * Update volume display
     */
    updateVolume() {
        const volumePercent = this.currentVolume * 100;
        this.volumeFill.style.width = `${volumePercent}%`;
        this.volumeHandle.style.left = `${volumePercent}%`;
        this.audio.volume = this.currentVolume;
    }
}

// Initialize the player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const player = new MelodyPlayer();
    player.init();
});