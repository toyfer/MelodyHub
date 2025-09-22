import DOMManager from './dom-manager.js';
import APIClient from './api-client.js';
import AudioController from './audio-controller.js';
import UIUpdater from './ui-updater.js';
import EventHandler from './event-handler.js';

class AppController {
    constructor() {
        this.dom = new DOMManager();
        // Replace with your GitHub repo details
        this.api = new APIClient('toyfer', 'MelodyHub'); 
        this.audio = new AudioController(this.dom);
        this.ui = new UIUpdater(this.dom, this.audio);
        this.eventHandler = new EventHandler(this.dom, this.api, this.audio, this.ui, this);

        // Initial setup
        this.ui.replaceIcons();
        this.ui.hidePlayer();
        this.ui.resetProgress();
    }

    async init() {
        try {
            const albums = await this.api.fetchAlbumList();
            this.ui.populateAlbumSelect(albums);
        } catch (error) {
            this.ui.showError('アルバムリストの取得に失敗しました: ' + error.message);
        }
    }

    // Shared functions that might be called by event handlers
    async playSong(album, song) {
        this.ui.showPlayer();
        this.ui.hideNonPlayerSections();
        this.ui.resetProgress();
        this.ui.updateNowPlaying(song);
        this.ui.updatePlayingVisual(song);
        try {
            await this.audio.playSong(album, song);
            this.ui.updatePlayPauseButton();
            this.ui.setDuration();
        } catch (error) {
            this.ui.showError('曲の再生に失敗しました: ' + error.message);
            this.ui.showAllSections();
            this.ui.hidePlayer();
        }
    }

    async shareLink(album, song, element) {
        const url = new URL(window.location.href);
        url.searchParams.set('album', album);
        url.searchParams.set('song', song);
        try {
            await navigator.clipboard.writeText(url.href);
            this.ui.showSuccess('リンクをクリップボードにコピーしました！');
        } catch (err) {
            this.ui.showError('リンクのコピーに失敗しました。');
        }
    }
}

const app = new AppController();
app.init();
