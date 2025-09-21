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

    // Preserve original document title to restore later
    this.originalTitle = document.title || 'MelodyHub';

        // Configuration
        this.repoOwner = 'toyfer';
        this.repoName = 'MelodyHub';
        this.baseUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/`;
        this.demoMode = false;

        // Audio extensions
        this.audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];

        // SVG Icons
        this.svgIcons = {
            'icon-play': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`,
            'icon-pause': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>`,
            'icon-volume': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/></svg>`,
            'icon-volume-muted': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.25.02-.01zm-6.5 0c0 .83.26 1.65.75 2.28l1.47-1.47c-.12-.37-.22-.77-.22-1.81 0-1.49 1.01-2.75 2.5-3.16v1.79c-.51.21-1 .67-1 1.37zm6.5-8.77c4.01.91 7 4.49 7 8.77 0 2.04-.61 3.93-1.66 5.51l1.46 1.46C21.87 17.28 23 14.76 23 12c0-4.28-2.99-7.86-7-8.77v2.06zm-7.2 14.02l1.47-1.47c-.49-.63-.75-1.45-.75-2.28 0-1.04.1-1.44.22-1.81l-1.47-1.47c-.49.63-.75 1.45-.75 2.28 0 1.04.1 1.44.22 1.81zM12 4L9.19 6.81 12 9.62V4zM4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4c.73 0 1.41-.21 2-.55v.28l9 9 1.27-1.27L4.27 3z" fill="currentColor"/></svg>`,
            'icon-share': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" fill="currentColor"/></svg>`,
            'icon-folder': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="currentColor"/></svg>`,
            'icon-list': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" fill="currentColor"/></svg>`,
            'icon-chevron-down': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="currentColor"/></svg>`,
            'icon-warning': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/></svg>`,
            'icon-check': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>`
        };

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
        this.replaceIcons();
        this.setupEventListeners();
        this.audio.volume = this.currentVolume;
        this.updatePlayPauseButton();
        this.updateVolumeButton();

        const albums = await this.fetchAlbumList();
        this.handleUrlParameters(albums);
    }

    /**
     * Replace icon spans with SVG elements
     */
    replaceIcons() {
        const iconElements = document.querySelectorAll('.icon');
        iconElements.forEach(element => {
            // Find the icon class (e.g., icon-play, icon-pause, etc.)
            const iconClass = Array.from(element.classList).find(cls => cls.startsWith('icon-'));
            if (iconClass && this.svgIcons[iconClass]) {
                // Create a temporary container to parse the SVG
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.svgIcons[iconClass];
                const svgElement = tempDiv.firstElementChild;

                // Copy classes and styles from the original element
                svgElement.className = element.className;
                svgElement.style.cssText = element.style.cssText;

                // Replace the span with the SVG
                element.parentNode.replaceChild(svgElement, element);
            }
        });
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
            const albums = data
                .filter(item => item.type === 'dir')
                .map(item => item.name)
                .filter(name => name !== 'css' && name !== 'js');
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
        // Update document title to indicate currently playing track
        try {
            document.title = `${cleanSongName} — ${this.originalTitle}`;
        } catch (err) {
            // ignore if document isn't available in the environment
        }
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
            // restore original title when playback is reset
            try { document.title = this.originalTitle; } catch (e) {}
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
                // restore original title when paused
                try { document.title = this.originalTitle; } catch (e) {}
            } else {
                await this.audio.play();
                this.isPlaying = true;
                this.hideNonPlayerSections();
                // set title when playback begins (if a track is selected)
                if (this.currentlyPlaying && this.currentlyPlaying.song) {
                    const cleanSongName = this.currentlyPlaying.song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
                    try { document.title = `${cleanSongName} — ${this.originalTitle}`; } catch (e) {}
                }
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
    // restore title when track ends
    try { document.title = this.originalTitle; } catch (e) {}
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