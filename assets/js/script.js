// グローバル変数
let allSongs = [];
let filteredSongs = [];
let sortMode = 'name';
let filters = {
  genre: '',
  atmosphere: '',
  emotional: ''
};

// 文字種判定とソート順定義
const getCharacterType = (char) => {
  const code = char.charCodeAt(0);
  
  // ひらがな
  if (code >= 0x3041 && code <= 0x3096) return 1;
  // カタカナ
  if (code >= 0x30A1 && code <= 0x30F6) return 2;
  // 漢字
  if (code >= 0x4E00 && code <= 0x9FAF) return 3;
  // アルファベット
  if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A)) return 4;
  // 数字
  if (code >= 0x0030 && code <= 0x0039) return 5;
  // その他
  return 6;
};

// 濁点・半濁点・拗音かどうかを判定
const hasSpecialChar = (str) => {
  const specialChars = /[がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポャュョッヴ]/;
  return specialChars.test(str);
};

const customSort = (a, b) => {
  const aName = a.name;
  const bName = b.name;
  
  for (let i = 0; i < Math.min(aName.length, bName.length); i++) {
    const aType = getCharacterType(aName[i]);
    const bType = getCharacterType(bName[i]);
    
    if (aType !== bType) {
      return aType - bType;
    }
    
    const aChar = aName[i];
    const bChar = bName[i];
    
    if (aType === 1 || aType === 2) {
      const aHasSpecial = hasSpecialChar(aChar);
      const bHasSpecial = hasSpecialChar(bChar);
      
      if (aHasSpecial !== bHasSpecial) {
        return aHasSpecial ? 1 : -1;
      }
      
      if (aChar !== bChar) {
        return aChar.localeCompare(bChar, 'ja');
      }
    } else {
      if (aChar !== bChar) {
        return aChar.charCodeAt(0) - bChar.charCodeAt(0);
      }
    }
  }
  
  return aName.length - bName.length;
};

// テーマ管理
const initializeTheme = () => {
  const savedTheme = 'dark';
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-mode');
    document.getElementById('themeIcon').textContent = '🌞';
  } else {
    document.body.classList.add('dark-mode');
    document.getElementById('themeIcon').textContent = '🌙';
  }
};

const toggleTheme = () => {
  if (document.body.classList.contains('dark-mode')) {
    document.body.classList.remove('dark-mode');
    document.getElementById('themeIcon').textContent = '🌞';
  } else {
    document.body.classList.add('dark-mode');
    document.getElementById('themeIcon').textContent = '🌙';
  }
};

// データ読み込み
const loadMusicData = async () => {
  try {
    const response = await fetch('assets/json/data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    allSongs = data.songs;
    filteredSongs = [...allSongs].sort(customSort);
    
    renderTable();
    updateStats();
  } catch (error) {
    console.error('データの読み込みに失敗しました:', error);
    showError('データの読み込みに失敗しました。data.jsonファイルが存在することを確認してください。');
  }
};

// エラー表示
const showError = (message) => {
  const tbody = document.getElementById('musicTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="error">${message}</td>
    </tr>
  `;
};

// テーブル描画
const renderTable = () => {
  const tbody = document.getElementById('musicTableBody');
  
  if (filteredSongs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.7);">
          検索条件に一致する楽曲が見つかりませんでした
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredSongs.map((song, index) => `
    <tr>
      <td class="song-name" data-index="${index}">${escapeHtml(song.name)}</td>
      <td class="pc-only">${escapeHtml(song.genre || '-')}</td>
      <td class="pc-only">${escapeHtml(song.atmosphere || '-')}</td>
      <td class="pc-only">${song.emotional ? 'エモい' : '普通'}</td>
    </tr>
  `).join('');
  
  if (window.innerWidth <= 768) {
    document.querySelectorAll('.song-name').forEach(element => {
      element.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        showModal(filteredSongs[index]);
      });
    });
  }
};

// モーダル表示
const showModal = (song) => {
  document.getElementById('modalTitle').textContent = song.name;
  document.getElementById('modalGenre').textContent = song.genre || '-';
  document.getElementById('modalAtmosphere').textContent = song.atmosphere || '-';
  document.getElementById('modalEmotional').textContent = song.emotional ? 'エモい' : '普通';
  
  const modal = document.getElementById('modal');
  modal.style.display = 'block';
  
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
};

// モーダル閉じる
const closeModal = () => {
  const modal = document.getElementById('modal');
  modal.classList.remove('show');
  
  setTimeout(() => {
    modal.style.display = 'none';
  }, 150);
};

// HTMLエスケープ
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// 統計情報更新
const updateStats = () => {
  document.getElementById('displayCount').textContent = filteredSongs.length;
  document.getElementById('totalCount').textContent = allSongs.length;
};

// フィルタリング
const applyFilters = () => {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  filteredSongs = allSongs.filter(song => {
    const matchesSearch = song.name.toLowerCase().includes(searchTerm);
    const matchesGenre = !filters.genre || song.genre === filters.genre;
    const matchesAtmosphere = !filters.atmosphere || song.atmosphere === filters.atmosphere;
    const matchesEmotional = !filters.emotional || 
      (filters.emotional === 'true' && song.emotional === true) ||
      (filters.emotional === 'false' && song.emotional === false);

    return matchesSearch && matchesGenre && matchesAtmosphere && matchesEmotional;
  });

  if (sortMode === 'name') {
    filteredSongs.sort(customSort);
  }

  renderTable();
  updateStats();
};

// フィルターボタンの状態更新
const updateFilterButtons = (groupId, value) => {
  const buttons = document.querySelectorAll(`#${groupId} .filter-btn`);
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.value === value) {
      btn.classList.add('active');
    }
  });
};

// フィルター設定
const setFilter = (type, value) => {
  filters[type] = value;
  updateFilterButtons(`${type}Buttons`, value);
  applyFilters();
};

// イベントリスナーの設定
const setupEventListeners = () => {
  // テーマ切り替え
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // 検索
  document.getElementById('searchInput').addEventListener('input', applyFilters);

  // フィルターボタン
  document.querySelectorAll('#genreButtons .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter('genre', btn.dataset.value));
  });
  
  document.querySelectorAll('#atmosphereButtons .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter('atmosphere', btn.dataset.value));
  });
  
  document.querySelectorAll('#emotionalButtons .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter('emotional', btn.dataset.value));
  });

  // 並び替えボタン
  document.querySelectorAll('#sortButtons .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sortMode = btn.dataset.value;
      updateFilterButtons('sortButtons', btn.dataset.value);
      applyFilters();
    });
  });

  // モーダル関連
  document.querySelector('.close').addEventListener('click', closeModal);
  
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal')) {
      closeModal();
    }
  });

  // ウィンドウリサイズ時の再描画
  window.addEventListener('resize', () => {
    renderTable();
  });
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupEventListeners();
  loadMusicData();
});