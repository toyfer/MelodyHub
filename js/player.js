document.addEventListener('DOMContentLoaded', () => {
    const albumSelect = document.getElementById('album-select');
    const songList = document.getElementById('song-list');
    const songItems = document.getElementById('song-items');
    const audioPlayer = document.getElementById('audio-player');
    const audio = document.getElementById('audio');
    const nowPlaying = document.getElementById('now-playing');
    const errorMessage = document.getElementById('error-message');

    // GitHubリポジトリ情報（適宜変更）
    const repoOwner = 'toyfer'; // GitHubユーザー名
    const repoName = 'MelodyHub'; // リポジトリ名
    const baseUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;
    
    // Demo mode flag - set to true for offline demo
    const DEMO_MODE = false;

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

        try {
            const songs = await fetchSongList(selectedAlbum);
            displaySongList(songs, selectedAlbum);
        } catch (error) {
            showError('曲リストの取得に失敗しました');
        }
    });

    // 曲リストを表示
    function displaySongList(songs, album) {
        songItems.innerHTML = '';
        if (songs.length === 0) {
            songItems.innerHTML = '<li class="empty-state">📭 このアルバムには曲がありません</li>';
        } else {
            songs.forEach(song => {
                const li = document.createElement('li');
                // Clean up song name for display (remove file extension)
                const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
                li.textContent = cleanSongName;
                li.title = song; // Keep original filename in title for reference
                li.addEventListener('click', () => playSong(album, song));
                songItems.appendChild(li);
            });
        }
        songList.style.display = 'block';
    }

    // 曲を再生
    function playSong(album, song) {
        if (DEMO_MODE) {
            // In demo mode, just show the player interface without actual audio
            const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
            nowPlaying.innerHTML = `<strong>${album.charAt(0).toUpperCase() + album.slice(1)}</strong> - ${cleanSongName}`;
            
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
        nowPlaying.innerHTML = `<strong>${album}</strong> - ${cleanSongName}`;
        
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
            errorMessage.innerHTML = `<span class="icon">⚠️</span><span class="error-text">${message}</span>`;
        }
        errorMessage.style.display = 'flex';
    }

    // URLパラメータから初期再生曲を取得
    const urlParams = new URLSearchParams(window.location.search);
    const initialAlbum = urlParams.get('album');
    const initialSong = urlParams.get('song');

    // 初期化処理
    async function init() {
        const albums = await fetchAlbumList();
        
        if (initialAlbum && initialSong) {
            if (albums.includes(initialAlbum)) {
                albumSelect.value = initialAlbum;
                const songs = await fetchSongList(initialAlbum);
                if (songs.includes(initialSong)) {
                    displaySongList(songs, initialAlbum);
                    playSong(initialAlbum, initialSong);
                } else {
                    showError('指定された曲が存在しません');
                }
            } else {
                showError('指定されたアルバムが存在しません');
            }
        }
    }

    init();
});