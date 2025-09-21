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
        /** @type {number|null} Timeout ID for success message auto-hide */
        this.successTimeoutId = null;
        /** @type {Object<string, string>} SVG icon definitions */
        this.svgIcons = {
            'icon-play': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
            'icon-pause': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>',
            'icon-volume': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/></svg>',
            'icon-volume-muted': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.25.02-.01z" fill="currentColor"/></svg>',
            'icon-share': '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81" fill="currentColor"/></svg>'
        };
    }

    /**
     * Replaces CSS icon classes with inline SVG icons.
     * Improves visual consistency and reduces external dependencies.
     */
    replaceIcons() {
        const iconElements = this.dom.querySelectorAll('.icon');
        iconElements.forEach(element => {
            const iconClass = Array.from(element.classList).find(cls => cls.startsWith('icon-'));
            if (iconClass && this.svgIcons[iconClass]) {
                try {
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(this.svgIcons[iconClass], 'image/svg+xml');
                    const svgElement = svgDoc.documentElement;
                    if (svgElement.tagName.toLowerCase() === 'svg') {
                        // Copy class from original element to new SVG safely
                        try {
                            // Prefer the attribute string to avoid setter-only properties
                            const originalClass = element.getAttribute && element.getAttribute('class') ? element.getAttribute('class') : (element.className || '');
                            if (originalClass) svgElement.setAttribute('class', originalClass);
                        } catch (classErr) {
                            console.warn('Could not copy class to SVG element', classErr);
                        }
                        if (element.parentNode) {
                            element.parentNode.replaceChild(svgElement, element);
                        }
                    } else {
                        console.error('Invalid SVG content for icon:', iconClass);
                        if (window && window.debug) window.debug.error('Invalid SVG icon content', { iconClass });
                    }
                } catch (error) {
                    console.error('Error parsing SVG for icon:', iconClass, error);
                    if (window && window.debug) window.debug.error('Error parsing SVG', { iconClass, error: String(error) });
                }
            }
        });
        if (window && window.debug) window.debug.log('replaceIcons executed');
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
        if (window && window.debug) window.debug.log('populateAlbumSelect', albums);
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
            const li = this.dom.createElement('li', { className: 'empty-state' });
            const iconSpan = this.dom.createElement('span', { class: 'icon icon-folder', style: 'margin-right: 0.5rem;' });
            li.appendChild(iconSpan);
            li.appendChild(document.createTextNode('このアルバムには曲がありません'));
            songItems.appendChild(li);
        } else {
            songs.forEach(song => {
                const li = this.dom.createElement('li');
                const songTitle = this.dom.createElement('span', {
                    textContent: song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '')
                });
                songTitle.style.flex = '1';

                const shareBtn = this.dom.createElement('button', {
                    className: 'song-share-button',
                    title: 'この曲のリンクをコピー'
                });
                const shareIcon = this.dom.createElement('span', { class: 'icon icon-share' });
                shareBtn.appendChild(shareIcon);

                li.appendChild(songTitle);
                li.appendChild(shareBtn);
                li.title = song;
                songItems.appendChild(li);
            });
        }
        this.dom.setStyle(songList, { display: 'block' });
        if (window && window.debug) window.debug.log('displaySongList', { album, count: songs.length });
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
            const icon = btn.querySelector('.icon');
            if (icon) {
                icon.setAttribute('class', this.audio.isPlaying ? 'icon icon-pause' : 'icon icon-play');
            }
        }
    }

    /**
     * Updates the volume button icon based on mute state and volume level.
     */
    updateVolumeButton() {
        const btn = this.dom.getElement('volume-btn');
        if (btn) {
            const icon = btn.querySelector('.icon');
            if (icon) {
                icon.setAttribute('class', (this.audio.isMuted || this.audio.currentVolume === 0) ? 'icon icon-volume-muted' : 'icon icon-volume');
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
                const iconSpan = this.dom.createElement('span', { class: 'icon icon-warning' });
                const textSpan = this.dom.createElement('span', { class: 'error-text' });
                textSpan.textContent = message;
                errorMessage.appendChild(iconSpan);
                errorMessage.appendChild(textSpan);
            }
            this.dom.setStyle(errorMessage, { display: 'flex' });
            if (window && window.debug) window.debug.error('UI error', { message });
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
                const iconSpan = this.dom.createElement('span', { class: 'icon icon-check' });
                const textSpan = this.dom.createElement('span', { class: 'error-text' });
                textSpan.textContent = message;
                errorMessage.appendChild(iconSpan);
                errorMessage.appendChild(textSpan);
            }
            errorMessage.className = 'error-message success-message';
            this.dom.setStyle(errorMessage, { display: 'flex' });
            this.successTimeoutId = setTimeout(() => {
                this.dom.setStyle(errorMessage, { display: 'none' });
                errorMessage.className = 'error-message';
                this.successTimeoutId = null;
            }, 3000);
            if (window && window.debug) window.debug.log('UI success', { message });
        }
    }

    /**
     * Hides the album selector and song list sections.
     */
    hideNonPlayerSections() {
        const albumSelector = this.dom.getElement('album-selector');
        const songList = this.dom.getElement('song-list');
        if (albumSelector) albumSelector.style.display = 'none';
        if (songList) songList.style.display = 'none';
    }

    /**
     * Shows all sections (album selector and song list).
     */
    showAllSections() {
        const albumSelector = this.dom.getElement('album-selector');
        const songList = this.dom.getElement('song-list');
        if (albumSelector) albumSelector.style.display = 'block';
        if (songList) songList.style.display = 'block';
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
}

export default UIUpdater;