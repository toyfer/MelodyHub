/**
 * Event Handler Module
 * Manages event listeners and delegates to appropriate modules
 */

/**
 * Manages all user interaction events and delegates them to appropriate modules.
 * Centralizes event handling logic and maintains clean separation of concerns.
 */
class EventHandler {
    /**
     * Creates an instance of EventHandler.
     * @param {DOMManager} domManager - The DOM manager instance
     * @param {APIClient} apiClient - The API client instance
     * @param {AudioController} audioController - The audio controller instance
     * @param {UIUpdater} uiUpdater - The UI updater instance
     * @param {Object} appController - The app controller with shared functions
     */
    constructor(domManager, apiClient, audioController, uiUpdater, appController) {
        /** @type {DOMManager} DOM manager for element access */
        this.dom = domManager;
        /** @type {APIClient} API client for data fetching */
        this.api = apiClient;
        /** @type {AudioController} Audio controller for playback control */
        this.audio = audioController;
        /** @type {UIUpdater} UI updater for visual feedback */
        this.ui = uiUpdater;
        /** @type {Object} App controller with shared functions */
        this.controller = appController;
        /** @type {boolean} Whether currently processing an album change */
        this.isChangingAlbum = false;
        /** @type {Object<string, number>} Debounce timers */
        this.debounceTimers = {};

        this.setupEventListeners();
    }

    /**
     * Sets up all event listeners for UI elements.
     * Binds events to appropriate handler methods.
     * @private
     */
    setupEventListeners() {
        this.eventListeners = [
            { id: 'album-select', event: 'change', handler: this.handleAlbumChange.bind(this) },
            { id: 'play-pause-btn', event: 'click', handler: this.handlePlayPause.bind(this) },
            { id: 'volume-btn', event: 'click', handler: this.handleVolumeClick.bind(this) },
            { id: 'progress-bar', event: 'click', handler: this.handleProgressClick.bind(this) },
            { id: 'volume-slider', event: 'click', handler: this.handleVolumeSliderClick.bind(this) },
            { id: 'share-current-song', event: 'click', handler: this.handleShareCurrentSong ? this.handleShareCurrentSong.bind(this) : (()=>{}) }
        ];

        this.eventListeners.forEach(({ id, event, handler }) => {
            const element = this.dom.getElement(id);
            if (element) {
                element.addEventListener(event, handler);
                    try {
                        if (window && window.debug && typeof window.debug.info === 'function') {
                            window.debug.info(`Listener added: ${id} ${event}`);
                        }
                    } catch (e) {
                        console.warn('Debug logging failed during setupEventListeners', e);
                    }
            }
        });

        // Song list click handler
        const songItems = this.dom.getElement('song-items');
        if (songItems) {
            this.songListHandler = this.handleSongClick.bind(this);
            songItems.addEventListener('click', this.songListHandler);
            try {
                if (window && window.debug && typeof window.debug.info === 'function') {
                    window.debug.info('Listener added: song-items click');
                }
            } catch (e) {
                console.warn('Debug logging failed during song list listener setup', e);
            }
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * Removes all event listeners.
     * Should be called when the handler is destroyed.
     */
    removeEventListeners() {
        this.eventListeners.forEach(({ id, event, handler }) => {
            const element = this.dom.getElement(id);
            if (element) {
                element.removeEventListener(event, handler);
                    try {
                        if (window && window.debug && typeof window.debug.info === 'function') {
                            window.debug.info(`Listener removed: ${id} ${event}`);
                        }
                    } catch (e) {
                        console.warn('Debug logging failed during removeEventListeners', e);
                    }
            }
        });

        const songItems = this.dom.getElement('song-items');
        if (songItems && this.songListHandler) {
            songItems.removeEventListener('click', this.songListHandler);
        }

        // Clear debounce timers
        Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
        this.debounceTimers = {};
    }

    /**
     * Handles album selection changes.
     * Fetches and displays songs for the selected album.
     * @async
     */
    async handleAlbumChange() {
        if (this.isChangingAlbum) {
            console.warn('Already changing album, skipping');
                try { if (window && window.debug && typeof window.debug.warn === 'function') window.debug.warn('Album change skipped: already changing'); } catch (e) {}
            return;
        }

        const select = this.dom.getElement('album-select');
        const selectedAlbum = select ? select.value : '';
        if (!selectedAlbum) {
            this.ui.showAllSections();
            return;
        }

        this.isChangingAlbum = true;
        try { if (window && window.debug && typeof window.debug.info === 'function') window.debug.info(`Album change started: ${selectedAlbum}`); } catch (e) {}
        const songItems = this.dom.getElement('song-items');
        if (songItems) {
            songItems.innerHTML = '<li class="loading">楽曲を読み込み中...</li>';
        }
        this.dom.setStyle(this.dom.getElement('song-list'), { display: 'block' });

        try {
            const songs = await this.api.fetchSongList(selectedAlbum);
                try { if (window && window.debug && typeof window.debug.log === 'function') window.debug.log(`Fetched ${Array.isArray(songs) ? songs.length : 0} songs for ${selectedAlbum}`); } catch (e) {}
            this.ui.displaySongList(songs, selectedAlbum);
        } catch (error) {
            this.ui.showError('曲リストの取得に失敗しました');
                try { if (window && window.debug && typeof window.debug.error === 'function') window.debug.error('fetchSongList failed', error); } catch (e) {}
            this.dom.setStyle(this.dom.getElement('song-list'), { display: 'none' });
        } finally {
            this.isChangingAlbum = false;
                try { if (window && window.debug && typeof window.debug.info === 'function') window.debug.info(`Album change completed: ${selectedAlbum}`); } catch (e) {}
        }
    }

    /**
     * Handles clicks on song list items.
     * Initiates playback of the clicked song.
     * @param {Event} e - The click event
     */
    handleSongClick(e) {
        if (!e || !e.target || !(e.target instanceof Element)) {
            console.error('Invalid event or target');
            return;
        }

        try {
            const li = e.target.closest('li');
            if (!li || li.classList.contains('empty-state')) return;

            const song = li.title;
            const album = this.dom.getElement('album-select').value;
            try { if (window && window.debug && typeof window.debug.log === 'function') window.debug.log('Song clicked', { album, song }); } catch (e) {}
            if (!album) {
                this.ui.showError('アルバムが選択されていません');
                return;
            }
            this.controller.playSong(album, song);
        } catch (error) {
            this.ui.showError('曲の選択に失敗しました: ' + error.message);
        }
    }

    /**
     * Handles play/pause button clicks.
     * Toggles between play and pause states.
     * @async
     */
    async handlePlayPause() {
        this.debounce('playPause', async () => {
            try {
                if (this.audio.isPlaying) {
                    this.audio.pause();
                    this.ui.showAllSections();
                        try { if (window && window.debug && typeof window.debug.log === 'function') window.debug.log('Play -> Pause'); } catch (e) {}
                } else {
                    await this.audio.resume();
                    this.ui.hideNonPlayerSections();
                        try { if (window && window.debug && typeof window.debug.log === 'function') window.debug.log('Pause -> Resume'); } catch (e) {}
                }
                this.ui.updatePlayPauseButton();
            } catch (error) {
                this.ui.showError(error.message || '音声の再生に失敗しました');
                this.audio.isPlaying = false;
                this.ui.updatePlayPauseButton();
                    try { if (window && window.debug && typeof window.debug.error === 'function') window.debug.error('handlePlayPause failed', error); } catch (e) {}
            }
        });
    }

    /**
     * Handles volume button clicks.
     * Toggles mute state of the audio.
     */
    handleVolumeClick() {
        this.debounce('volumeClick', () => {
            try {
                this.audio.toggleMute();
                this.ui.updateVolumeButton();
                    try { if (window && window.debug && typeof window.debug.log === 'function') window.debug.log('Volume toggled', { muted: this.audio.isMuted }); } catch (e) {}
            } catch (error) {
                this.ui.showError('音量設定に失敗しました: ' + error.message);
                    try { if (window && window.debug && typeof window.debug.error === 'function') window.debug.error('handleVolumeClick failed', error); } catch (e) {}
            }
        });
    }

    /**
     * Handles clicks on the progress bar.
     * Seeks to the clicked position in the audio.
     * @param {MouseEvent} e - The click event
     */
    handleProgressClick(e) {
        try {
            const progressBar = this.dom.getElement('progress-bar');
            if (!progressBar) return;

            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            if (width <= 0) return;

            const progress = clickX / width;
            const clampedProgress = Math.max(0, Math.min(1, progress));
            this.audio.seek(clampedProgress);
                try { if (window && window.debug && typeof window.debug.log === 'function') window.debug.log('Progress clicked', { progress: clampedProgress }); } catch (e) {}
        } catch (error) {
            this.ui.showError('シークに失敗しました: ' + error.message);
                try { if (window && window.debug && typeof window.debug.error === 'function') window.debug.error('handleProgressClick failed', error); } catch (e) {}
        }
    }

    /**
     * Handles clicks on the volume slider.
     * Adjusts volume to the clicked position.
     * @param {MouseEvent} e - The click event
     */
    handleVolumeSliderClick(e) {
        try {
            const volumeSlider = this.dom.getElement('volume-slider');
            if (!volumeSlider) return;

            const rect = volumeSlider.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            if (width <= 0) return;

            const volume = clickX / width;
            const clampedVolume = Math.max(0, Math.min(1, volume));
            this.audio.setVolume(clampedVolume);
            this.ui.updateVolumeButton();
            this.ui.updateVolume();
                try { if (window && window.debug && typeof window.debug.log === 'function') window.debug.log('Volume slider set', { volume: clampedVolume }); } catch (e) {}
        } catch (error) {
            this.ui.showError('音量調整に失敗しました: ' + error.message);
                try { if (window && window.debug && typeof window.debug.error === 'function') window.debug.error('handleVolumeSliderClick failed', error); } catch (e) {}
        }
    }

    /**
     * Handles share button click for the currently playing song.
     * Copies a shareable URL to clipboard and shows UI feedback.
     */
    async handleShareCurrentSong(e) {
        try {
            const album = this.dom.getElement('album-select') ? this.dom.getElement('album-select').value : null;
            const song = this.audio && this.audio.currentlyPlaying ? this.audio.currentlyPlaying.song : null;
            if (!album || !song) {
                this.ui.showError('再生中の曲がありません');
                return;
            }
            if (window && window.debug && typeof window.debug.log === 'function') window.debug.log('Sharing song', { album, song });
            await this.controller.shareLink(album, song, e && e.currentTarget ? e.currentTarget : null);
        } catch (err) {
            this.ui.showError('共有に失敗しました：' + (err && err.message ? err.message : String(err)));
            try { if (window && window.debug && typeof window.debug.error === 'function') window.debug.error('handleShareCurrentSong failed', err); } catch (e) {}
        }
    }

    /**
     * Debounces a function call.
     * @param {string} key - Unique key for the debounce timer
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     */
    debounce(key, func, delay = 300) {
        if (this.debounceTimers[key]) {
            clearTimeout(this.debounceTimers[key]);
        }
        try { if (window && window.debug && typeof window.debug.info === 'function') window.debug.info(`Debounce scheduled: ${key} (${delay}ms)`); } catch (e) {}
        this.debounceTimers[key] = setTimeout(() => {
            try { if (window && window.debug && typeof window.debug.info === 'function') window.debug.info(`Debounce executed: ${key}`); } catch (e) {}
            try { func(); } catch (err) { console.error('Debounced function threw:', err); if (window && window.debug && typeof window.debug.error === 'function') window.debug.error('debounced func error', err); }
            delete this.debounceTimers[key];
        }, delay);
    }

    /**
     * Handles keyboard shortcuts for better UX.
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        // Ignore if user is typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.handlePlayPause();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.navigateSongList(-1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.navigateSongList(1);
                break;
            case 'Enter':
                event.preventDefault();
                this.playSelectedSong();
                break;
            case 'KeyM':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleVolumeClick();
                }
                break;
        }
    }

    /**
     * Navigates the song list with arrow keys.
     * @param {number} direction - Direction to navigate (-1 for up, 1 for down)
     */
    navigateSongList(direction) {
        const songItems = this.dom.querySelectorAll('#song-items .song-item');
        if (songItems.length === 0) return;

        let currentIndex = -1;
        songItems.forEach((item, index) => {
            if (item.classList.contains('playing')) {
                currentIndex = index;
            }
        });

        if (currentIndex === -1) {
            // No song playing, select first
            currentIndex = 0;
        } else {
            currentIndex += direction;
            if (currentIndex < 0) currentIndex = songItems.length - 1;
            if (currentIndex >= songItems.length) currentIndex = 0;
        }

        // Update visual selection
        songItems.forEach((item, index) => {
            item.classList.toggle('selected', index === currentIndex);
        });

        // Scroll into view
        songItems[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Plays the currently selected song.
     */
    playSelectedSong() {
        const selectedSong = this.dom.querySelector('#song-items .song-item.selected');
        if (selectedSong) {
            const songTitle = selectedSong.title;
            const albumSelect = this.dom.getElement('album-select');
            const album = albumSelect ? albumSelect.value : '';
            if (album && songTitle) {
                this.controller.playSong(album, songTitle);
            }
        }
    }
}

export default EventHandler;