/**
 * Audio Controller Module
 * Handles audio playback, volume, and progress control
 */

/**
 * Manages audio playback, volume control, and progress tracking.
 * Provides methods for playing, pausing, seeking, and volume management.
 */
class AudioController {
    /**
     * Creates an instance of AudioController.
     * @param {HTMLAudioElement} audioElement - The audio element to control
     * @param {string} [repoOwner='toyfer'] - GitHub repository owner
     * @param {string} [repoName='MelodyHub'] - GitHub repository name
     * @param {UIUpdater} [uiUpdater] - UI updater instance
     */
    constructor(audioElement, repoOwner = 'toyfer', repoName = 'MelodyHub', uiUpdater = null) {
        if (!audioElement || !(audioElement instanceof HTMLAudioElement)) {
            throw new Error('Invalid audio element provided');
        }

        /** @type {HTMLAudioElement} The audio element being controlled */
        this.audio = audioElement;
        /** @type {boolean} Whether audio is currently playing */
        this.isPlaying = false;
        /** @type {boolean} Whether audio is muted */
        this.isMuted = false;
        /** @type {number} Current volume level (0-1) */
        this.currentVolume = 0.7;
        /** @type {Object} Currently playing track information */
        this.currentlyPlaying = { album: null, song: null };
        /** @type {string} Original document title for restoration */
        this.originalTitle = document.title || 'MelodyHub';
        /** @type {string} GitHub repository owner */
        this.repoOwner = repoOwner;
        /** @type {string} GitHub repository name */
        this.repoName = repoName;
        /** @type {UIUpdater} UI updater instance */
        this.ui = uiUpdater;
        /** @type {boolean} Whether currently loading/playing */
        this.isLoading = false;

        this.bindEvents();
    }

    /**
     * Binds event listeners to the audio element.
     * @private
     */
    bindEvents() {
        if (this.audio) {
            this.audio.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
            this.audio.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
            this.audio.addEventListener('ended', this.onEnded.bind(this));
        }
    }

    /**
     * Removes event listeners from the audio element.
     * Should be called when the controller is destroyed.
     */
    removeEventListeners() {
        if (this.audio) {
            this.audio.removeEventListener('loadedmetadata', this.onLoadedMetadata);
            this.audio.removeEventListener('timeupdate', this.onTimeUpdate);
            this.audio.removeEventListener('ended', this.onEnded);
        }
    }

    /**
     * Plays a song from the specified album.
     * Attempts local path first, then falls back to remote path.
     * @async
     * @param {string} album - The album name
     * @param {string} song - The song filename
     * @param {boolean} [demoMode=false] - Whether running in demo mode
     * @returns {Promise<boolean>} True if playback started successfully
     * @throws {Error} If both local and remote paths fail to load
     */
    async playSong(album, song, demoMode = false) {
        if (!this.audio) return false;
        if (this.isLoading) {
            console.warn('Already loading a song, skipping');
            return false;
        }

        this.isLoading = true;
        this.currentlyPlaying = { album, song };

        if (demoMode) {
            this.isLoading = false;
            return true; // Demo mode handled elsewhere
        }

        this.reset();

        try {
            const localPath = `${album}/${song}`;
            this.audio.src = localPath;
            await this.audio.play();
            this.isPlaying = true;
            this.isLoading = false;
            return true;
        } catch (err) {
            try {
                const encodedRemotePath = `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/main/${encodeURIComponent(album)}/${encodeURIComponent(song)}`;
                this.audio.src = encodedRemotePath;
                await this.audio.play();
                this.isPlaying = true;
                this.isLoading = false;
                return true;
            } catch (remoteErr) {
                this.isLoading = false;
                throw remoteErr;
            }
        }
    }

    /**
     * Pauses audio playback.
     */
    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
        }
    }

    /**
     * Resumes audio playback.
     * @async
     * @returns {Promise<void>}
     */
    async resume() {
        if (this.audio && !this.isLoading) {
            await this.audio.play();
            this.isPlaying = true;
        }
    }

    /**
     * Resets audio to initial state.
     * Pauses playback, resets time to 0, and restores original title.
     */
    reset() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isPlaying = false;
        }
        try {
            document.title = this.originalTitle;
        } catch (e) {}
    }

    /**
     * Sets the audio volume.
     * @param {number} volume - Volume level between 0 and 1
     */
    setVolume(volume) {
        this.currentVolume = Math.max(0, Math.min(1, volume));
        this.isMuted = false;
        if (this.audio) {
            this.audio.volume = this.currentVolume;
            this.audio.muted = false;
        }
    }

    /**
     * Toggles mute state of the audio.
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.audio) {
            this.audio.muted = this.isMuted;
        }
    }

    /**
     * Seeks to a specific position in the audio.
     * @param {number} progress - Progress value between 0 and 1
     */
    seek(progress) {
        if (this.audio && this.audio.duration) {
            this.audio.currentTime = progress * this.audio.duration;
        }
    }

    /**
     * Gets the current playback time in seconds.
     * @returns {number} Current time in seconds
     */
    getCurrentTime() {
        return this.audio ? this.audio.currentTime : 0;
    }

    /**
     * Gets the total duration of the current audio in seconds.
     * @returns {number} Duration in seconds
     */
    getDuration() {
        return this.audio ? this.audio.duration : 0;
    }

    /**
     * Formats time in seconds to MM:SS format.
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Handles loadedmetadata event.
     * Updates the UI with duration information.
     * @private
     */
    onLoadedMetadata() {
        if (this.ui && typeof this.ui.setDuration === 'function') {
            this.ui.setDuration();
        }
    }

    /**
     * Handles timeupdate event.
     * Updates the progress bar and time display.
     * @private
     */
    onTimeUpdate() {
        if (this.ui && typeof this.ui.updateProgress === 'function') {
            this.ui.updateProgress();
        }
    }

    /**
     * Handles ended event.
     * Resets playing state and restores original title.
     * @private
     */
    onEnded() {
        this.isPlaying = false;
        try {
            document.title = this.originalTitle;
        } catch (err) {
            console.error('Error restoring document title:', err);
        }
    }
}

export default AudioController;