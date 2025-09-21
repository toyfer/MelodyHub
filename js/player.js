document.addEventListener('DOMContentLoaded', () => {
    const albumSelect = document.getElementById('album-select');
    const songList = document.getElementById('song-list');
    const songItems = document.getElementById('song-items');
    const audioPlayer = document.getElementById('audio-player');
    const audio = document.getElementById('audio');
    const nowPlaying = document.getElementById('now-playing');
    const errorMessage = document.getElementById('error-message');
    const shareCurrentSongBtn = document.getElementById('share-current-song');

    // GitHubリポジトリ情報（適宜変更）
    const repoOwner = 'toyfer'; // GitHubユーザー名
    const repoName = 'MelodyHub'; // リポジトリ名
    const baseUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;
    
    // Demo mode flag - set to true for offline demo
    const DEMO_MODE = false;

    // Store currently playing song info for sharing
    let currentlyPlaying = { album: null, song: null };

    // アルバムリストをGitHub APIから取得
    async function fetchAlbumList() {
        if (DEMO_MODE) {
            // Demo data for testing UI
            const demoAlbums = ['monsterhunter', 'classical', 'jazz', 'electronic'];
            demoAlbums.forEach(album => {
                const option = document.createElement('option');
                option.value = album;
                option.textContent = album.charAt(0).toUpperCase() + album.slice(1);
                albumSelect.appendChild(option);
            });
            return demoAlbums;
        }
        
        try {
            const response = await fetch(baseUrl);
            if (!response.ok) throw new Error('アルバム一覧の取得に失敗しました');
            
            const data = await response.json();
            // ディレクトリのみをフィルタリング
            const albums = data.filter(item => item.type === 'dir').map(item => item.name);
            
            // アルバム選択メニューを生成
            albums.forEach(album => {
                const option = document.createElement('option');
                option.value = album;
                option.textContent = album;
                albumSelect.appendChild(option);
            });
            
            return albums;
        } catch (error) {
            showError('アルバム一覧の取得に失敗しました');
            return [];
        }
    }

    // アルバム内の曲リストを取得
    async function fetchSongList(album) {
        if (DEMO_MODE) {
            // Demo data for different albums
            const demoSongs = {
                'monsterhunter': [
                    '【#モンハン】もうひとつのお楽しみ きゅっきゅっきゅっニャー【 #MHP2G #shorts #vtuber】 (Cover).mp3',
                    'Battle Theme - Rathalos.mp3',
                    'Village Theme - Peaceful Days.mp3'
                ],
                'classical': [
                    'Beethoven - Symphony No. 9.mp3',
                    'Mozart - Piano Sonata K331.mp3',
                    'Bach - Brandenburg Concerto No. 3.mp3'
                ],
                'jazz': [
                    'Miles Davis - Kind of Blue.mp3',
                    'John Coltrane - Giant Steps.mp3',
                    'Bill Evans - Waltz for Debby.mp3'
                ],
                'electronic': [
                    'Ambient Journey.mp3',
                    'Digital Dreams.mp3',
                    'Synthwave Nights.mp3'
                ]
            };
            return demoSongs[album] || [];
        }
        
        try {
            const response = await fetch(`${baseUrl}${album}`);
            if (!response.ok) throw new Error('曲リストの取得に失敗しました');
            
            const data = await response.json();
            // オーディオファイルのみをフィルタリング（.mp3, .wav, .oggなど）
            const songs = data
                .filter(item => item.type === 'file' && isAudioFile(item.name))
                .map(item => item.name);
            
            return songs;
        } catch (error) {
            showError('曲リストの取得に失敗しました');
            return [];
        }
    }

    // オーディオファイルかどうかを判定
    function isAudioFile(filename) {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
        return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }

    // アルバム選択時の処理
    albumSelect.addEventListener('change', async () => {
        const selectedAlbum = albumSelect.value;
        if (!selectedAlbum) {
            songList.style.display = 'none';
            audioPlayer.style.display = 'none';
            return;
        }

        // Show loading state
        songItems.innerHTML = '<li class="loading">楽曲を読み込み中...</li>';
        songList.style.display = 'block';

        try {
            const songs = await fetchSongList(selectedAlbum);
            displaySongList(songs, selectedAlbum);
        } catch (error) {
            showError('曲リストの取得に失敗しました');
            songList.style.display = 'none';
        }
    });

    // 曲リストを表示
    function displaySongList(songs, album) {
        songItems.innerHTML = '';
        if (songs.length === 0) {
            songItems.innerHTML = '<li class="empty-state"><span class="icon icon-folder" style="margin-right: 0.5rem;"></span>このアルバムには曲がありません</li>';
        } else {
            songs.forEach(song => {
                const li = document.createElement('li');
                
                // Create song title span
                const songTitle = document.createElement('span');
                const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
                songTitle.textContent = cleanSongName;
                songTitle.style.flex = '1';
                
                // Create share button for individual songs
                const shareBtn = document.createElement('button');
                shareBtn.className = 'song-share-button';
                shareBtn.innerHTML = '<span class="icon icon-share"></span>';
                shareBtn.title = 'この曲のリンクをコピー';
                shareBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent song from playing
                    shareLink(album, song, shareBtn);
                });
                
                li.appendChild(songTitle);
                li.appendChild(shareBtn);
                li.title = song; // Keep original filename in title for reference
                li.addEventListener('click', () => playSong(album, song));
                songItems.appendChild(li);
            });
        }
        songList.style.display = 'block';
    }

    // 曲を再生
    function playSong(album, song) {
        // Update currently playing info
        currentlyPlaying = { album, song };
        
        if (DEMO_MODE) {
            // In demo mode, just show the player interface without actual audio
            const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
            nowPlaying.innerHTML = cleanSongName;
            
            audioPlayer.style.display = 'block';
            errorMessage.style.display = 'none';
            
            // Add visual feedback for currently playing song
            document.querySelectorAll('#song-items li').forEach(li => {
                li.classList.remove('playing');
            });
            
            const playingLi = Array.from(document.querySelectorAll('#song-items li')).find(li => 
                li.title === song
            );
            if (playingLi) {
                playingLi.classList.add('playing');
            }
            
            // Show demo message
            setTimeout(() => {
                showError('デモモードです。実際の音楽ファイルがあれば再生されます。');
            }, 1000);
            
            return;
        }
        
        const songPath = `${album}/${song}`;
        audio.src = songPath;
        audio.load();
        audio.play();
        
        // Clean up song name for display
        const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
        nowPlaying.innerHTML = cleanSongName;
        
        audioPlayer.style.display = 'block';
        errorMessage.style.display = 'none';
        
        // Add visual feedback for currently playing song
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

    // エラーメッセージ表示
    function showError(message) {
        const errorText = errorMessage.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        } else {
            errorMessage.innerHTML = `<span class="icon icon-warning"></span><span class="error-text">${message}</span>`;
        }
        errorMessage.style.display = 'flex';
    }

    // 成功メッセージ表示
    function showSuccess(message) {
        const errorText = errorMessage.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        } else {
            errorMessage.innerHTML = `<span class="icon icon-check"></span><span class="error-text">${message}</span>`;
        }
        errorMessage.className = 'error-message success-message';
        errorMessage.style.display = 'flex';
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
            errorMessage.className = 'error-message';
        }, 3000);
    }

    // Generate shareable URL
    function generateShareableUrl(album, song) {
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.set('album', album);
        currentUrl.searchParams.set('song', song);
        return currentUrl.toString();
    }

    // Copy to clipboard and show feedback
    async function shareLink(album, song, buttonElement = null) {
        const shareUrl = generateShareableUrl(album, song);
        
        try {
            await navigator.clipboard.writeText(shareUrl);
            showSuccess(`リンクをコピーしました: ${song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '')}`);
            
            // Visual feedback on button
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
            // Fallback for browsers that don't support clipboard API
            showError('クリップボードへのアクセスができません。URLを手動でコピーしてください: ' + shareUrl);
        }
    }

    // Validate URL parameters
    function validateUrlParameters(album, song, availableAlbums) {
        const errors = [];
        
        if (!album) {
            errors.push('アルバムが指定されていません');
        } else if (!availableAlbums.includes(album)) {
            errors.push(`指定されたアルバム「${album}」が存在しません`);
        }
        
        if (!song) {
            errors.push('曲が指定されていません');
        }
        
        return errors;
    }

    // URLパラメータから初期再生曲を取得
    const urlParams = new URLSearchParams(window.location.search);
    const initialAlbum = urlParams.get('album');
    const initialSong = urlParams.get('song');

    // 初期化処理
    async function init() {
        const albums = await fetchAlbumList();
        
        if (initialAlbum && initialSong) {
            // Validate URL parameters
            const errors = validateUrlParameters(initialAlbum, initialSong, albums);
            
            if (errors.length > 0) {
                showError(errors.join(' / '));
                return;
            }
            
            // Check if album exists
            if (albums.includes(initialAlbum)) {
                albumSelect.value = initialAlbum;
                const songs = await fetchSongList(initialAlbum);
                
                // Check if song exists in the album
                if (songs.includes(initialSong)) {
                    displaySongList(songs, initialAlbum);
                    playSong(initialAlbum, initialSong);
                } else {
                    displaySongList(songs, initialAlbum);
                    showError(`指定された曲「${initialSong.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '')}」がアルバム「${initialAlbum}」に存在しません`);
                }
            } else {
                showError(`指定されたアルバム「${initialAlbum}」が存在しません`);
            }
        }
    }

    // Share current song button event listener
    shareCurrentSongBtn.addEventListener('click', () => {
        if (currentlyPlaying.album && currentlyPlaying.song) {
            shareLink(currentlyPlaying.album, currentlyPlaying.song, shareCurrentSongBtn);
        }
    });

    init();
});