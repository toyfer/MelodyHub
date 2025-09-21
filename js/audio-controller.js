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
        /** @type {AudioContext} Web Audio API context */
        this.audioContext = null;
        /** @type {AudioBufferSourceNode} Current audio source */
        this.source = null;
        /** @type {GainNode} Volume control */
        this.gainNode = null;
        /** @type {number} Start time of current playback */
        this.startTime = 0;
        /** @type {number} Pause time offset */
        this.pauseTime = 0;
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
        // Web Audio API doesn't use audio element events directly
        // Time updates will be handled via requestAnimationFrame
    }

    /**
     * Removes event listeners from the audio element.
     * Should be called when the controller is destroyed.
     */
    removeEventListeners() {
        // Web Audio API doesn't require explicit event listener removal
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
        if (this.isLoading) {
            return false;
        }

        this.isLoading = true;
        this.currentlyPlaying = { album, song };
        if (window && window.debug) window.debug.info('playSong called', { album, song, demoMode });

        if (demoMode) {
            this.isLoading = false;
            return true; // Demo mode handled elsewhere
        }

        this.reset();

        // Initialize AudioContext on first user interaction
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.currentVolume;
        }

        try {
            const localPath = `${album}/${song}`;
            const response = await fetch(localPath);
            if (!response.ok) throw new Error('Local fetch failed');
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.playBuffer(audioBuffer);
            this.isLoading = false;
            return true;
        } catch (err) {
            try {
                const encodedRemotePath = `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/main/${encodeURIComponent(album)}/${encodeURIComponent(song)}`;
                const response = await fetch(encodedRemotePath);
                if (!response.ok) throw new Error('Remote fetch failed');
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.playBuffer(audioBuffer);
                this.isLoading = false;
                return true;
            } catch (remoteErr) {
                this.isLoading = false;
                throw remoteErr;
            }
        }
    }

    /**
     * Plays an AudioBuffer using Web Audio API.
     * @param {AudioBuffer} buffer - The audio buffer to play
     */
    playBuffer(buffer) {
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = buffer;
        this.source.connect(this.gainNode);
        this.startTime = this.audioContext.currentTime - this.pauseTime;
        this.source.start(0, this.pauseTime);
        this.isPlaying = true;
        this.source.onended = () => this.onEnded();
        this.onLoadedMetadata();
        this.updateTime();
    }

    /**
     * Updates the time display and progress bar.
     */
    updateTime() {
        if (this.isPlaying) {
            this.onTimeUpdate();
            requestAnimationFrame(() => this.updateTime());
        }
    }

    /**
     * Pauses audio playback.
     */
    pause() {
        if (this.source && this.isPlaying) {
            this.source.stop();
            this.pauseTime = this.audioContext.currentTime - this.startTime;
            this.isPlaying = false;
        }
    }

    /**
     * Resumes audio playback.
     * @async
     * @returns {Promise<void>}
     */
    async resume() {
        if (!this.isLoading && this.source && !this.isPlaying) {
            this.playBuffer(this.source.buffer);
        }
    }

    /**
     * Resets audio to initial state.
     * Pauses playback, resets time to 0, and restores original title.
     */
    reset() {
        if (this.source && this.isPlaying) {
            this.source.stop();
        }
        this.pauseTime = 0;
        this.startTime = 0;
        this.isPlaying = false;
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
        if (this.gainNode) {
            this.gainNode.gain.value = this.currentVolume;
        }
    }

    /**
     * Toggles mute state of the audio.
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.gainNode) {
            this.gainNode.gain.value = this.isMuted ? 0 : this.currentVolume;
        }
    }

    /**
     * Seeks to a specific position in the audio.
     * @param {number} progress - Progress value between 0 and 1
     */
    seek(progress) {
        if (this.source && this.source.buffer) {
            const seekTime = progress * this.source.buffer.duration;
            if (this.isPlaying) {
                this.source.stop();
                this.pauseTime = seekTime;
                this.playBuffer(this.source.buffer);
            } else {
                this.pauseTime = seekTime;
            }
        }
    }

    /**
     * Gets the current playback time in seconds.
     * @returns {number} Current time in seconds
     */
    getCurrentTime() {
        if (!this.audioContext || !this.source) return 0;
        if (this.isPlaying) {
            return this.audioContext.currentTime - this.startTime;
        } else {
            return this.pauseTime;
        }
    }

    /**
     * Gets the total duration of the current audio in seconds.
     * @returns {number} Duration in seconds
     */
    getDuration() {
        return this.source && this.source.buffer ? this.source.buffer.duration : 0;
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
        }
    }

    /**
     * Handles audio element errors.
     * Logs error details for debugging.
     * @private
     */
    onError() {
        if (this.audio && this.audio.error) {
            const errorCode = this.audio.error.code;
            const errorMessage = this.audio.error.message || 'Unknown audio error';
            console.error('Audio error:', { code: errorCode, message: errorMessage });
            
            // Reset playing state on error
            this.isPlaying = false;
            this.isLoading = false;
        }
    }
}

export default AudioController;