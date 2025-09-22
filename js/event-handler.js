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
            { id: 'album-select-trigger', event: 'click', handler: this.handleAlbumSelectToggle.bind(this) },
            { id: 'album-search', event: 'input', handler: this.handleAlbumSearch.bind(this) },
            { id: 'album-options', event: 'click', handler: this.handleAlbumOptionClick.bind(this) },
            { id: 'play-pause-btn', event: 'click', handler: this.handlePlayPause.bind(this) },
            { id: 'volume-btn', event: 'click', handler: this.handleVolumeClick.bind(this) },
            { id: 'progress-bar', event: 'click', handler: this.handleProgressClick.bind(this) },
            { id: 'volume-slider', event: 'click', handler: this.handleVolumeSliderClick.bind(this) },
            { id: 'share-current-song', event: 'click', handler: this.handleShareCurrentSong.bind(this) },
            { id: 'back-to-album', event: 'click', handler: this.handleBack.bind(this) }
        ];

        this.eventListeners.forEach(({ id, event, handler }) => {
            const element = this.dom.getElement(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        });

        // Song list click handler
        const songItems = this.dom.getElement('song-items');
        if (songItems) {
            this.songListHandler = this.handleSongClick.bind(this);
            songItems.addEventListener('click', this.songListHandler);
            // Also handle share button clicks within song items
            songItems.addEventListener('click', this.handleSongShareClick.bind(this));
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
    handleAlbumSelectToggle() {
        const customSelect = this.dom.getElement('album-select-container');
        if (customSelect) {
            const isOpen = customSelect.classList.toggle('open');
            customSelect.setAttribute('aria-expanded', isOpen);
        }
    }

    handleAlbumSearch(e) {
        const searchTerm = e.target.value;
        this.ui.filterAlbumOptions(searchTerm);
    }

    async handleAlbumOptionClick(e) {
        if (e.target.classList.contains('custom-option')) {
            const selectedAlbum = e.target.dataset.value;
            const trigger = this.dom.getElement('album-select-trigger');
            if (trigger) {
                trigger.querySelector('span').textContent = e.target.textContent;
            }

            const customSelect = this.dom.getElement('album-select-container');
            if (customSelect) {
                customSelect.classList.remove('open');
            }

            if (this.isChangingAlbum) {
                return;
            }

            if (!selectedAlbum) {
                this.ui.showAllSections();
                return;
            }

            this.isChangingAlbum = true;
            const songList = this.dom.getElement('song-list');
            const spinner = this.dom.getElement('loading-spinner');
            if (songList) songList.classList.remove('d-none');
            if (spinner) spinner.classList.remove('d-none');

            try {
                const songs = await this.api.fetchSongList(selectedAlbum);
                this.ui.displaySongList(songs, selectedAlbum);
            } catch (error) {
                this.ui.showError('曲リストの取得に失敗しました');
                if (songList) songList.classList.add('d-none');
            } finally {
                this.isChangingAlbum = false;
                if (spinner) spinner.classList.add('d-none');
            }
        }
    }

    /**
     * Handles clicks on song list items.
     * Initiates playback of the clicked song.
     * @param {Event} e - The click event
     */
    _getSelectedAlbum() {
        const trigger = this.dom.getElement('album-select-trigger');
        return trigger ? trigger.querySelector('span').textContent : null;
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

        // Don't handle song clicks if it's a share button click
        if (e.target.closest('.song-share-button')) {
            return;
        }

        try {
            const li = e.target.closest('li');
            if (!li || li.classList.contains('empty-state')) return;

            const song = li.title;
            const album = this._getSelectedAlbum();

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
                    this.ui.hidePlayer();
                } else {
                    await this.audio.resume();
                    this.ui.hideNonPlayerSections();
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
        } catch (error) {
            this.ui.showError('音量調整に失敗しました: ' + error.message);
                try { if (window && window.debug && typeof window.debug.error === 'function') window.debug.error('handleVolumeSliderClick failed', error); } catch (e) {}
        }
    }

    /**
     * Handles share button clicks within song items.
     * @param {Event} e - The click event
     */
    handleSongShareClick(e) {
        if (!e.target.closest('.song-share-button')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const li = e.target.closest('li');
        if (!li) return;

        const song = li.title;
        const album = this._getSelectedAlbum();

        if (!album || !song) {
            this.ui.showError('アルバムまたは曲が選択されていません');
            return;
        }

        this.controller.shareLink(album, song, e.target.closest('.song-share-button'));
    }

    /**
     * Handles share button click for the currently playing song.
     * Copies a shareable URL to clipboard and shows UI feedback.
     */
    async handleShareCurrentSong(e) {
        try {
            const album = this._getSelectedAlbum();
            const song = this.audio && this.audio.currentlyPlaying ? this.audio.currentlyPlaying.song : null;
            if (!album || !song) {
                this.ui.showError('再生中の曲がありません');
                return;
            }
            await this.controller.shareLink(album, song, e && e.currentTarget ? e.currentTarget : null);
        } catch (err) {
            this.ui.showError('共有に失敗しました：' + (err && err.message ? err.message : String(err)));
            try { if (window && window.debug && typeof window.debug.error === 'function') window.debug.error('handleShareCurrentSong failed', err); } catch (e) {}
        }
    }

    /**
     * Handles back button click.
     * Shows album and song list, hides player, and pauses audio.
     */
    handleBack() {
        this.ui.showAllSections();
        this.ui.hidePlayer();
        this.audio.pause();
        this.ui.updatePlayPauseButton();
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
        this.debounceTimers[key] = setTimeout(() => {
            try { func(); } catch (err) { console.error('Debounced function threw:', err); }
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