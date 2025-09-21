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
        this.setupEventListeners();
    }

    /**
     * Sets up all event listeners for UI elements.
     * Binds events to appropriate handler methods.
     * @private
     */
    setupEventListeners() {
        const elements = [
            { id: 'album-select', event: 'change', handler: this.handleAlbumChange.bind(this) },
            { id: 'play-pause-btn', event: 'click', handler: this.handlePlayPause.bind(this) },
            { id: 'volume-btn', event: 'click', handler: this.handleVolumeClick.bind(this) },
            { id: 'progress-bar', event: 'click', handler: this.handleProgressClick.bind(this) },
            { id: 'volume-slider', event: 'click', handler: this.handleVolumeSliderClick.bind(this) },
            { id: 'share-current-song', event: 'click', handler: this.handleShareCurrentSong.bind(this) }
        ];

        elements.forEach(({ id, event, handler }) => {
            const element = this.dom.getElement(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        });

        // Song list click handler
        const songItems = this.dom.getElement('song-items');
        if (songItems) {
            songItems.addEventListener('click', this.handleSongClick.bind(this));
        }
    }

    /**
     * Handles album selection changes.
     * Fetches and displays songs for the selected album.
     * @async
     */
    async handleAlbumChange() {
        const select = this.dom.getElement('album-select');
        const selectedAlbum = select ? select.value : '';
        if (!selectedAlbum) {
            this.ui.showAllSections();
            return;
        }

        const songItems = this.dom.getElement('song-items');
        if (songItems) {
            songItems.innerHTML = '<li class="loading">楽曲を読み込み中...</li>';
        }
        this.dom.setStyle(this.dom.getElement('song-list'), { display: 'block' });

        try {
            const songs = await this.api.fetchSongList(selectedAlbum);
            this.ui.displaySongList(songs, selectedAlbum);
        } catch (error) {
            this.ui.showError('曲リストの取得に失敗しました');
            this.dom.setStyle(this.dom.getElement('song-list'), { display: 'none' });
        }
    }

    /**
     * Handles clicks on song list items.
     * Initiates playback of the clicked song.
     * @param {Event} e - The click event
     */
    handleSongClick(e) {
        const li = e.target.closest('li');
        if (!li || li.classList.contains('empty-state')) return;

        const song = li.title;
        const album = this.dom.getElement('album-select').value;
        this.controller.playSong(album, song);
    }

    /**
     * Handles play/pause button clicks.
     * Toggles between play and pause states.
     * @async
     */
    async handlePlayPause() {
        try {
            if (this.audio.isPlaying) {
                this.audio.pause();
                this.ui.showAllSections();
            } else {
                await this.audio.resume();
                this.ui.hideNonPlayerSections();
            }
            this.ui.updatePlayPauseButton();
        } catch (error) {
            this.ui.showError(error.message || '音声の再生に失敗しました');
            this.audio.isPlaying = false;
            this.ui.updatePlayPauseButton();
        }
    }

    /**
     * Handles volume button clicks.
     * Toggles mute state of the audio.
     */
    handleVolumeClick() {
        this.audio.toggleMute();
        this.ui.updateVolumeButton();
    }

    /**
     * Handles clicks on the progress bar.
     * Seeks to the clicked position in the audio.
     * @param {MouseEvent} e - The click event
     */
    handleProgressClick(e) {
        const progressBar = this.dom.getElement('progress-bar');
        if (progressBar) {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const progress = clickX / rect.width;
            this.audio.seek(progress);
        }
    }

    /**
     * Handles clicks on the volume slider.
     * Adjusts volume to the clicked position.
     * @param {MouseEvent} e - The click event
     */
    handleVolumeSliderClick(e) {
        const volumeSlider = this.dom.getElement('volume-slider');
        if (volumeSlider) {
            const rect = volumeSlider.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const volume = Math.max(0, Math.min(1, clickX / rect.width));
            this.audio.setVolume(volume);
            this.ui.updateVolumeButton();
            this.ui.updateVolume();
        }
    }

    /**
     * Handles clicks on the share current song button.
     * Generates and copies a shareable link for the currently playing song.
     */
    handleShareCurrentSong() {
        if (this.audio.currentlyPlaying.album && this.audio.currentlyPlaying.song) {
            this.controller.shareLink(this.audio.currentlyPlaying.album, this.audio.currentlyPlaying.song);
        }
    }
}

export default EventHandler;