/**
 * UI Updater Module
 * Handles UI updates for buttons, lists, messages, and progress
 */

/**
 * Manages all UI updates including buttons, lists, progress bars, and messages.
 * Handles icon replacement, album/song display, and visual feedback.
 */
class UIUpdater {
    /**
     * Creates an instance of UIUpdater.
     * @param {DOMManager} domManager - The DOM manager instance
     * @param {AudioController} audioController - The audio controller instance
     */
    constructor(domManager, audioController) {
        /** @type {DOMManager} DOM manager for element access */
        this.dom = domManager;
        /** @type {AudioController} Audio controller for state information */
        this.audio = audioController;
    }

    /**
     * Replaces CSS icon classes with FontAwesome classes.
     * Improves visual consistency and reduces custom SVG dependencies.
     */
    replaceIcons() {
        const iconElements = this.dom.querySelectorAll('.icon');
        iconElements.forEach(element => {
            const iconClass = Array.from(element.classList).find(cls => cls.startsWith('icon-'));
            if (iconClass) {
                const faClass = {
                    'icon-play': 'fas fa-play',
                    'icon-pause': 'fas fa-pause',
                    'icon-volume': 'fas fa-volume-up',
                    'icon-volume-muted': 'fas fa-volume-mute',
                    'icon-share': 'fas fa-link',
                    'icon-folder': 'fas fa-folder',
                    'icon-list': 'fas fa-list',
                    'icon-chevron-down': 'fas fa-chevron-down',
                    'icon-warning': 'fas fa-exclamation-triangle',
                    'icon-check': 'fas fa-check'
                }[iconClass];
                if (faClass) {
                    element.className = faClass;
                    // Ensure it's an <i> element for FontAwesome
                    if (element.tagName.toLowerCase() !== 'i') {
                        const i = document.createElement('i');
                        i.className = faClass;
                        element.parentNode.replaceChild(i, element);
                    }
                }
            }
        });
    }

    /**
     * Populates the album selection dropdown with available albums.
     * @param {string[]} albums - Array of album names to display
     */
    populateAlbumSelect(albums) {
        const select = this.dom.getElement('album-select');
        if (!select) return;
        select.innerHTML = '';
        const defaultOption = this.dom.createElement('option', {
            value: '',
            textContent: '-- アルバムを選択してください --'
        });
        select.appendChild(defaultOption);
        albums.forEach(album => {
            const option = this.dom.createElement('option', {
                value: album,
                textContent: album.charAt(0).toUpperCase() + album.slice(1)
            });
            select.appendChild(option);
        });
    }

    /**
     * Displays the list of songs for a selected album.
     * @param {string[]} songs - Array of song filenames
     * @param {string} album - The album name
     */
    displaySongList(songs, album) {
        const songItems = this.dom.getElement('song-items');
        const songList = this.dom.getElement('song-list');
        if (!songItems || !songList) return;

        songItems.innerHTML = '';
        if (songs.length === 0) {
            const li = this.dom.createElement('li', { className: 'song-item empty-state' });
            const iconSpan = this.dom.createElement('span', { class: 'icon icon-folder', style: 'margin-right: 0.5rem;' });
            li.appendChild(iconSpan);
            li.appendChild(document.createTextNode('このアルバムには曲がありません'));
            songItems.appendChild(li);
        } else {
            songs.forEach(song => {
                const li = this.dom.createElement('li', { className: 'song-item' });
                const songTitle = this.dom.createElement('span', {
                    textContent: song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '')
                });
                songTitle.style.flex = '1';

                const shareBtn = this.dom.createElement('button', {
                    className: 'song-share-button',
                    title: 'この曲のリンクをコピー'
                });
                const shareIcon = this.dom.createElement('i', { class: 'fas fa-link' });
                shareBtn.appendChild(shareIcon);

                li.appendChild(songTitle);
                li.appendChild(shareBtn);
                li.title = song;
                songItems.appendChild(li);
            });
        }
        songList.classList.remove('d-none');
    }

    /**
     * Updates the now playing display with the current song.
     * @param {string} song - The song filename
     */
    updateNowPlaying(song) {
        const nowPlaying = this.dom.getElement('now-playing');
        if (nowPlaying) {
            const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
            nowPlaying.textContent = cleanSongName;
            try {
                document.title = `${cleanSongName} — ${this.audio.originalTitle}`;
            } catch (err) {
                console.error('Error updating document title:', err);
            }
        }
    }

    /**
     * Updates the visual indication of which song is currently playing.
     * @param {string} song - The song filename
     */
    updatePlayingVisual(song) {
        const lis = this.dom.querySelectorAll('#song-items li');
        lis.forEach(li => li.classList.remove('playing'));
        const playingLi = Array.from(lis).find(li => li.title === song);
        if (playingLi) {
            playingLi.classList.add('playing');
        }
    }

    /**
     * Updates the play/pause button icon based on current playback state.
     */
    updatePlayPauseButton() {
        const btn = this.dom.getElement('play-pause-btn');
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = this.audio.isPlaying ? 'fas fa-pause fa-lg' : 'fas fa-play fa-lg';
            }
        }
    }

    /**
     * Updates the volume button icon based on mute state and volume level.
     */
    updateVolumeButton() {
        const btn = this.dom.getElement('volume-btn');
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = (this.audio.isMuted || this.audio.currentVolume === 0) ? 'fas fa-volume-mute' : 'fas fa-volume-up';
            }
        }
    }

    /**
     * Updates the progress bar and time display based on current playback position.
     */
    updateProgress() {
        const duration = this.audio.getDuration();
        const currentTime = this.audio.getCurrentTime();
        if (duration) {
            const progress = (currentTime / duration) * 100;
            const progressFill = this.dom.getElement('progress-fill');
            const progressHandle = this.dom.getElement('progress-handle');
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressHandle) progressHandle.style.left = `${progress}%`;

            const currentTimeDisplay = this.dom.getElement('current-time');
            if (currentTimeDisplay) currentTimeDisplay.textContent = this.audio.formatTime(currentTime);
        }
    }

    /**
     * Updates the volume slider visual representation.
     */
    updateVolume() {
        const volumePercent = this.audio.currentVolume * 100;
        const volumeFill = this.dom.getElement('volume-fill');
        const volumeHandle = this.dom.getElement('volume-handle');
        if (volumeFill) volumeFill.style.width = `${volumePercent}%`;
        if (volumeHandle) volumeHandle.style.left = `${volumePercent}%`;
    }

    /**
     * Sets the duration display and resets progress indicators.
     */
    setDuration() {
        const durationDisplay = this.dom.getElement('duration');
        if (durationDisplay) {
            durationDisplay.textContent = this.audio.formatTime(this.audio.getDuration());
        }
        const currentTimeDisplay = this.dom.getElement('current-time');
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = this.audio.formatTime(0);
        }
        this.updateVolume();
    }

    /**
     * Displays an error message to the user.
     * @param {string} message - The error message to display
     */
    showError(message) {
        if (!message || typeof message !== 'string') {
            console.error('Invalid message provided to showError');
            return;
        }
        const errorMessage = this.dom.getElement('error-message');
        if (errorMessage) {
            const errorText = errorMessage.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            } else {
                // Create safe elements
                errorMessage.innerHTML = '';
                const iconSpan = this.dom.createElement('i', { class: 'fas fa-exclamation-triangle' });
                const textSpan = this.dom.createElement('span', { class: 'error-text' });
                textSpan.textContent = message;
                errorMessage.appendChild(iconSpan);
                errorMessage.appendChild(textSpan);
            }
            errorMessage.classList.remove('d-none');
        }
    }

    /**
     * Displays a success message to the user.
     * Auto-hides after 3 seconds.
     * @param {string} message - The success message to display
     */
    showSuccess(message) {
        if (!message || typeof message !== 'string') {
            console.error('Invalid message provided to showSuccess');
            return;
        }
        const errorMessage = this.dom.getElement('error-message');
        if (errorMessage) {
            // Clear any existing timeout
            if (this.successTimeoutId) {
                clearTimeout(this.successTimeoutId);
            }

            const errorText = errorMessage.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            } else {
                // Create safe elements
                errorMessage.innerHTML = '';
                const iconSpan = this.dom.createElement('i', { class: 'fas fa-check' });
                const textSpan = this.dom.createElement('span', { class: 'error-text' });
                textSpan.textContent = message;
                errorMessage.appendChild(iconSpan);
                errorMessage.appendChild(textSpan);
            }
            // Change to success colors
            errorMessage.classList.remove('flash-error');
            errorMessage.classList.add('flash-success');
            errorMessage.classList.remove('d-none');
            this.successTimeoutId = setTimeout(() => {
                errorMessage.classList.add('d-none');
                errorMessage.classList.remove('flash-success');
                errorMessage.classList.add('flash-error');
                this.successTimeoutId = null;
            }, 3000);
        }
    }

    /**
     * Hides the album selector and song list sections.
     */
    hideNonPlayerSections() {
        const albumSelector = this.dom.getElement('album-select');
        const songList = this.dom.getElement('song-list');
        if (albumSelector) albumSelector.classList.add('d-none');
        if (songList) songList.classList.add('d-none');
    }

    /**
     * Shows all sections (album selector and song list).
     */
    showAllSections() {
        const albumSelector = this.dom.getElement('album-select');
        const songList = this.dom.getElement('song-list');
        if (albumSelector) {
            albumSelector.classList.remove('d-none');
            albumSelector.style.display = 'block';
        }
        if (songList) {
            songList.classList.remove('d-none');
            songList.style.display = 'block';
        }
    }

    /**
     * Resets the progress bar and time display to initial state.
     */
    resetProgress() {
        const progressFill = this.dom.getElement('progress-fill');
        const progressHandle = this.dom.getElement('progress-handle');
        const currentTimeDisplay = this.dom.getElement('current-time');
        if (progressFill) progressFill.style.width = '0%';
        if (progressHandle) progressHandle.style.left = '0%';
        if (currentTimeDisplay) currentTimeDisplay.textContent = this.audio.formatTime(0);
    }

    /**
     * Hides the audio player section.
     */
    hidePlayer() {
        const audioPlayer = this.dom.getElement('audio-player');
        if (audioPlayer) {
            audioPlayer.classList.add('d-none');
            audioPlayer.style.display = 'none';
        }
    }

    /**
     * Shows the audio player section.
     */
    showPlayer() {
        const audioPlayer = this.dom.getElement('audio-player');
        if (audioPlayer) {
            audioPlayer.classList.remove('d-none');
            audioPlayer.style.display = 'block';
        }
    }
}

export default UIUpdater;