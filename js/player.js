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
            if (!response.ok) {
                // Fallback to local albums if API fails
                const localAlbums = ['monsterhunter'];
                localAlbums.forEach(album => {
                    const option = document.createElement('option');
                    option.value = album;
                    option.textContent = album.charAt(0).toUpperCase() + album.slice(1);
                    albumSelect.appendChild(option);
                });
                return localAlbums;
            }
            
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
            // Fallback to local albums if API fails
            const localAlbums = ['monsterhunter'];
            localAlbums.forEach(album => {
                const option = document.createElement('option');
                option.value = album;
                option.textContent = album.charAt(0).toUpperCase() + album.slice(1);
                albumSelect.appendChild(option);
            });
            return localAlbums;
        }
    }

    // アルバム内の曲リストを取得
    async function fetchSongList(album) {
        if (DEMO_MODE) {
            // Demo data for different albums
            const demoSongs = {
                'monsterhunter': [
                    'Another Treat.mp3',
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
            if (!response.ok) {
                // Fallback to local songs if API fails
                if (album === 'monsterhunter') {
                    return ['Another Treat.mp3']; // Known local file
                }
                throw new Error('曲リストの取得に失敗しました');
            }
            
            const data = await response.json();
            // オーディオファイルのみをフィルタリング（.mp3, .wav, .oggなど）
            const songs = data
                .filter(item => item.type === 'file' && isAudioFile(item.name))
                .map(item => item.name);
            
            return songs;
        } catch (error) {
            // Fallback to local songs if API fails
            if (album === 'monsterhunter') {
                return ['Another Treat.mp3']; // Known local file
            }
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
        // Validate audio element exists
        if (!audio) {
            showError('オーディオプレイヤーが初期化されていません');
            return;
        }

        if (DEMO_MODE) {
            // In demo mode, show the player interface without actual audio
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
        
        // Validate inputs
        if (!album || !song) {
            showError('アルバム名と曲名が必要です');
            return;
        }
        
        // Construct proper audio source URL
        const songPath = `${album}/${song}`;
        console.log('Loading audio from:', songPath);
        
        // Set up error handlers before loading
        const handleLoadError = () => {
            showError(`音楽ファイルが見つかりません: ${song}`);
        };
        
        const handlePlayError = (error) => {
            console.error('Audio playback failed:', error);
            let errorMessage = '音楽の再生に失敗しました';
            
            // Provide specific error messages based on error type
            if (error.name === 'NotSupportedError') {
                errorMessage = '音楽ファイルの形式がサポートされていません';
            } else if (error.name === 'NotAllowedError') {
                errorMessage = 'ブラウザによって再生がブロックされました。ユーザー操作後に再試行してください';
            } else if (error.name === 'AbortError') {
                errorMessage = '音楽の読み込みが中断されました';
            } else if (error.message) {
                errorMessage += `: ${error.message}`;
            }
            
            showError(errorMessage);
        };
        
        // Reset audio state
        audio.pause();
        audio.currentTime = 0;
        
        // Remove previous error handlers to avoid duplicate listeners
        audio.removeEventListener('error', handleLoadError);
        
        // Add error handler for loading failures
        audio.addEventListener('error', handleLoadError, { once: true });
        
        try {
            // Set source and load audio
            audio.src = songPath;
            audio.load();
            
            // Attempt to play with proper error handling
            const playPromise = audio.play();
            
            // Handle the Promise returned by play()
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Playback started successfully
                        console.log('Audio playback started successfully');
                        errorMessage.style.display = 'none';
                    })
                    .catch(handlePlayError);
            }
            
        } catch (error) {
            // Handle synchronous errors
            handlePlayError(error);
            return;
        }
        
        // Update UI elements
        const cleanSongName = song.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
        nowPlaying.innerHTML = cleanSongName;
        
        audioPlayer.style.display = 'block';
        
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