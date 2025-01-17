// Temel değişkenler
let onlineUsers = 0;
let totalVisits = 0;
let totalDownloads = 0;

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', () => {
    // CORS hatasını önlemek için manifest.json bağlantısını kaldır
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        manifestLink.remove();
    }

    initializeApp();
    updateStats();
    setInterval(updateStats, 5000);
    loadSettings();
    setupEventListeners();
    setupSettingsPanel();
    initializeLanguage();
    setupSearchButton();
});

// Uygulama başlangıç ayarları
function initializeApp() {
    // URL input alanını temizle
    document.getElementById('clearInput')?.addEventListener('click', () => {
        document.getElementById('urlInput').value = '';
        hideDownloadOptions();
    });

    // Tema değiştirici
    document.getElementById('themeSwitcher')?.addEventListener('click', toggleTheme);

    // Platform butonları
    document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.platform-btn.active')?.classList.remove('active');
            btn.classList.add('active');
        });
    });
}

// URL değişikliğini dinle
const urlInput = document.getElementById('urlInput');
if (urlInput) {
    urlInput.addEventListener('input', debounce(async (e) => {
        const url = e.target.value.trim();
        console.log('URL girildi:', url);
        
        if (url && isValidUrl(url)) {
            try {
                toggleLoading(true);
                showMessage('Video bilgileri alınıyor...', 'info');
                
                // API'ye CORS-Anywhere üzerinden istek yap
                const corsProxy = 'https://cors-anywhere.herokuapp.com/';
                const apiUrl = `${corsProxy}https://tele-social.vercel.app/down?url=${encodeURIComponent(url)}`;
                
                console.log('API isteği yapılıyor:', apiUrl);
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Origin': window.location.origin,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('API yanıt vermedi');
                }
                
                const data = await response.json();
                console.log('API yanıtı:', data);
                
                // İndirme seçeneklerini göster
                const downloadContainer = document.querySelector('.download-container');
                const downloadOptions = document.querySelector('.download-options');
                
                if (downloadContainer && downloadOptions) {
                    let optionsHTML = '';
                    
                    if (data.platform === 'YouTube') {
                        if (data.video_hd) {
                            optionsHTML += `
                                <div class="option-group">
                                    <a href="${data.video_hd}" class="download-button primary" download target="_blank">
                                        <i class="fas fa-video"></i>
                                        HD Video İndir (720p)
                                    </a>
                                </div>`;
                        }
                        if (data.video) {
                            optionsHTML += `
                                <div class="option-group">
                                    <a href="${data.video}" class="download-button secondary" download target="_blank">
                                        <i class="fas fa-video"></i>
                                        Video İndir (360p)
                                    </a>
                                </div>`;
                        }
                        if (data.audio) {
                            optionsHTML += `
                                <div class="option-group">
                                    <a href="${data.audio}" class="download-button secondary" download target="_blank">
                                        <i class="fas fa-music"></i>
                                        Ses İndir (MP3)
                                    </a>
                                </div>`;
                        }
                    }
                    
                    if (optionsHTML) {
                        downloadOptions.innerHTML = optionsHTML;
                        downloadContainer.style.display = 'block';
                        showMessage(`${data.platform} medyası bulundu`, 'success');
                    } else {
                        downloadOptions.innerHTML = '<p class="no-downloads">İndirme seçeneği bulunamadı</p>';
                        downloadContainer.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Hata:', error);
                showMessage('Bir hata oluştu: ' + error.message, 'error');
                hideDownloadOptions();
            } finally {
                toggleLoading(false);
            }
        } else {
            hideDownloadOptions();
        }
    }, 500));
}

// Video bilgilerini getir
async function fetchVideoData(url) {
    try {
        console.log('API isteği yapılıyor:', url);
        const response = await fetch(`https://tele-social.vercel.app/down?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            throw new Error('API yanıt vermedi');
        }
        
        const data = await response.json();
        console.log('API yanıtı:', data);
        return data;
    } catch (error) {
        console.error('API Hatası:', error);
        throw error;
    }
}

// İndirme seçeneklerini gizle
function hideDownloadOptions() {
    const downloadContainer = document.querySelector('.download-container');
    if (downloadContainer) {
        downloadContainer.style.display = 'none';
    }
}

// Yükleniyor göstergesini aç/kapat
function toggleLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

// URL geçerliliğini kontrol et
function isValidUrl(url) {
    try {
        new URL(url);
        return url.includes('youtube.com') || 
               url.includes('youtu.be') || 
               url.includes('tiktok.com') || 
               url.includes('instagram.com') || 
               url.includes('twitter.com');
    } catch {
        return false;
    }
}

// Debounce fonksiyonu
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// İndirme seçeneklerini güncelle
function updateDownloadOptions(data) {
    console.log('İndirme seçenekleri güncelleniyor:', data);
    
    const downloadOptions = document.querySelector('.download-options');
    if (!downloadOptions) {
        console.error('Download options elementi bulunamadı');
        return;
    }

    let optionsHTML = '';
    const platform = data.platform?.toLowerCase();

    if (platform === 'tiktok' && data.data) {
        if (data.data.video) {
            optionsHTML += `
                <div class="option-group">
                    <a href="${data.data.video}" class="download-button primary" download target="_blank">
                        <i class="fas fa-video"></i>
                        Video İndir
                    </a>
                </div>`;
        }
        if (data.data.audio) {
            optionsHTML += `
                <div class="option-group">
                    <a href="${data.data.audio}" class="download-button secondary" download target="_blank">
                        <i class="fas fa-music"></i>
                        Ses İndir (MP3)
                    </a>
                </div>`;
        }
    } else if (platform === 'youtube') {
        if (data.video_hd) {
            optionsHTML += `
                <div class="option-group">
                    <a href="${data.video_hd}" class="download-button primary" download target="_blank">
                        <i class="fas fa-video"></i>
                        HD Video İndir (720p)
                    </a>
                </div>`;
        }
        if (data.audio) {
            optionsHTML += `
                <div class="option-group">
                    <a href="${data.audio}" class="download-button secondary" download target="_blank">
                        <i class="fas fa-music"></i>
                        Ses İndir (MP3)
                    </a>
                </div>`;
        }
    }

    if (!optionsHTML) {
        optionsHTML = '<p class="no-downloads">İndirme seçeneği bulunamadı</p>';
    }

    downloadOptions.innerHTML = optionsHTML;
    document.getElementById('result').style.display = 'block';
    showMessage(`${data.platform} medyası bulundu`, 'success');
}

// İstatistikleri güncelle
function updateStats() {
    // Çevrimiçi kullanıcı sayısı (simüle)
    onlineUsers = Math.floor(Math.random() * 50) + 100;
    
    // Toplam ziyaret
    totalVisits = parseInt(localStorage.getItem('totalVisits') || '0') + 1;
    localStorage.setItem('totalVisits', totalVisits);
    
    // Toplam indirme
    totalDownloads = parseInt(localStorage.getItem('totalDownloads') || '0');
    
    // DOM güncelle
    document.getElementById('onlineUsers').textContent = onlineUsers.toLocaleString();
    document.getElementById('totalVisits').textContent = totalVisits.toLocaleString();
    document.getElementById('totalDownloads').textContent = totalDownloads.toLocaleString();
}

// Yardımcı fonksiyonlar
function toggleLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showMessage(message, type) {
    const messageElement = document.getElementById('message');
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';

    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

function hideDownloadOptions() {
    const downloadOptions = document.querySelector('.download-options');
    if (downloadOptions) {
        downloadOptions.style.display = 'none';
    }
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function incrementDownloads() {
    totalDownloads++;
    localStorage.setItem('totalDownloads', totalDownloads);
    document.getElementById('totalDownloads').textContent = totalDownloads.toLocaleString();
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const icon = document.querySelector('#themeSwitcher i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function loadSettings() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.querySelector('#themeSwitcher i');
    if (icon) {
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Ayarlar paneli için yeni kod
function setupSettingsPanel() {
    console.log('Ayarlar paneli başlatılıyor...');
    
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsContent = document.getElementById('settingsContent');

    if (!settingsToggle || !settingsContent) {
        console.error('Ayarlar paneli elemanları bulunamadı');
        return;
    }

    // Ayarlar butonuna tıklama
    settingsToggle.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isVisible = settingsContent.classList.contains('show');
        
        // Tüm açık menüleri kapat
        document.querySelectorAll('.settings-content.show').forEach(menu => {
            if (menu !== settingsContent) {
                menu.classList.remove('show');
            }
        });

        // Ayarlar menüsünü aç/kapat
        settingsContent.classList.toggle('show');
        
        // İkonu döndür
        const icon = this.querySelector('i');
        if (icon) {
            icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    };

    // Dışarı tıklandığında kapat
    document.addEventListener('click', function(e) {
        if (!settingsToggle.contains(e.target) && !settingsContent.contains(e.target)) {
            settingsContent.classList.remove('show');
            const icon = settingsToggle.querySelector('i');
            if (icon) {
                icon.style.transform = 'rotate(0deg)';
            }
        }
    });

    // Menü içine tıklandığında kapanmasını engelle
    settingsContent.onclick = function(e) {
        e.stopPropagation();
    };

    // Ayarları yükle
    loadSavedSettings();
}

// Ayarlar menüsünü aç/kapat
function toggleSettings() {
    const settingsContent = document.getElementById('settingsContent');
    const settingsToggle = document.getElementById('settingsToggle');
    const icon = settingsToggle.querySelector('i');
    
    const isVisible = settingsContent.classList.contains('show');
    
    if (isVisible) {
        closeSettings();
    } else {
        settingsContent.classList.add('show');
        icon.style.transform = 'rotate(180deg)';
    }
}

// Ayarlar menüsünü kapat
function closeSettings() {
    const settingsContent = document.getElementById('settingsContent');
    const settingsToggle = document.getElementById('settingsToggle');
    const icon = settingsToggle.querySelector('i');
    
    settingsContent.classList.remove('show');
    icon.style.transform = 'rotate(0deg)';
}

// Ayarlar için event listener'ları ekle
function setupSettingsListeners() {
    const autoDownload = document.getElementById('autoDownload');
    const saveHistory = document.getElementById('saveHistory');
    const notifications = document.getElementById('notifications');

    if (autoDownload) {
        autoDownload.checked = localStorage.getItem('autoDownload') === 'true';
        autoDownload.addEventListener('change', () => {
            localStorage.setItem('autoDownload', autoDownload.checked);
            showMessage(autoDownload.checked ? 'Otomatik indirme aktif' : 'Otomatik indirme devre dışı', 'success');
        });
    }

    if (saveHistory) {
        saveHistory.checked = localStorage.getItem('saveHistory') === 'true';
        saveHistory.addEventListener('change', () => {
            localStorage.setItem('saveHistory', saveHistory.checked);
            if (!saveHistory.checked) clearHistory();
        });
    }

    if (notifications) {
        notifications.checked = localStorage.getItem('notifications') === 'true';
        notifications.addEventListener('change', () => {
            localStorage.setItem('notifications', notifications.checked);
            if (notifications.checked) requestNotificationPermission();
        });
    }
}

// Kaydedilmiş ayarları yükle
function loadSavedSettings() {
    const autoDownload = document.getElementById('autoDownload');
    const saveHistory = document.getElementById('saveHistory');
    const notifications = document.getElementById('notifications');

    if (autoDownload) {
        autoDownload.checked = localStorage.getItem('autoDownload') === 'true';
    }
    if (saveHistory) {
        saveHistory.checked = localStorage.getItem('saveHistory') === 'true';
    }
    if (notifications) {
        notifications.checked = localStorage.getItem('notifications') === 'true';
    }
}

// Geçmişi temizle
function clearHistory() {
    localStorage.removeItem('downloadHistory');
    showMessage('İndirme geçmişi temizlendi', 'success');
}

// İndirme geçmişine ekle
function addToHistory(data) {
    if (document.getElementById('saveHistory').checked) {
        let history = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        history.unshift({
            url: data.url,
            title: data.title,
            date: new Date().toISOString(),
            platform: data.platform
        });
        // Son 50 indirmeyi tut
        history = history.slice(0, 50);
        localStorage.setItem('downloadHistory', JSON.stringify(history));
    }
}

// Ayarlar ikonunu döndür
function rotateSettingsIcon(show = true) {
    const icon = document.querySelector('#settingsToggle i');
    if (icon) {
        icon.style.transform = show ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

// Bildirim izni iste
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            showMessage('Bildirim izni reddedildi', 'error');
            document.getElementById('notifications').checked = false;
            localStorage.setItem('notifications', false);
        }
    }
}

// Bildirim gönder
function sendNotification(title, message) {
    if (document.getElementById('notifications').checked && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/path/to/icon.png'
        });
    }
}

// Dil değiştirme fonksiyonu
function changeLanguage(lang) {
    localStorage.setItem('language', lang);
    
    // Tüm çevrilebilir elementleri güncelle
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' && element.getAttribute('type') === 'text') {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // Dil seçiciyi güncelle
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = lang;
    }

    // Mesaj göster
    showMessage(`Dil ${lang.toUpperCase()} olarak değiştirildi`, 'success');
}

// Dil seçici event listener'ı
function setupLanguageSelector() {
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            const newLang = e.target.value;
            changeLanguage(newLang);
            // Sayfayı yenileme olmadan dil değişimini uygula
            document.documentElement.lang = newLang;
        });
    }
}

// Sayfa yüklendiğinde dil ayarını kontrol et
function initializeLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'tr';
    document.documentElement.lang = savedLanguage; // HTML lang attribute'unu güncelle
    changeLanguage(savedLanguage);
    setupLanguageSelector();
}

// Event listener'ları ayarla
function setupEventListeners() {
    // URL input alanını temizle
    const clearInput = document.getElementById('clearInput');
    if (clearInput) {
        clearInput.addEventListener('click', () => {
            const urlInput = document.getElementById('urlInput');
            if (urlInput) {
                urlInput.value = '';
                hideDownloadOptions();
            }
        });
    }

    // Tema değiştirici
    const themeSwitcher = document.getElementById('themeSwitcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', toggleTheme);
    }

    // Platform butonları
    const platformButtons = document.querySelectorAll('.platform-btn');
    platformButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.platform-btn.active')?.classList.remove('active');
            btn.classList.add('active');
        });
    });

    // İndirme butonları için event listener
    document.addEventListener('click', (e) => {
        if (e.target.closest('.download-button')) {
            incrementDownloads();
        }
    });

    // Dil seçici
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
}

// URL arama işlemi
function setupSearchButton() {
    const searchButton = document.getElementById('searchButton');
    const urlInput = document.getElementById('urlInput');

    if (searchButton && urlInput) {
        searchButton.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            console.log('Arama yapılıyor:', url);
            
            if (url && isValidUrl(url)) {
                try {
                    toggleLoading(true);
                    showMessage('Video bilgileri alınıyor...', 'info');
                    
                    // CORS proxy kullan
                    const proxyUrl = 'https://api.allorigins.win/raw?url=';
                    const apiUrl = `${proxyUrl}${encodeURIComponent(`https://tele-social.vercel.app/down?url=${url}`)}`;
                    
                    console.log('API isteği yapılıyor:', apiUrl);
                    
                    const response = await fetch(apiUrl);
                    
                    if (!response.ok) {
                        throw new Error('API yanıt vermedi');
                    }
                    
                    const data = await response.json();
                    console.log('API yanıtı:', data);
                    
                    // Result container'ı göster
                    const resultContainer = document.getElementById('result');
                    if (resultContainer) {
                        resultContainer.style.display = 'block';
                    }
                    
                    if (data && data.status) {
                        // İndirme seçeneklerini göster
                        const downloadContainer = document.querySelector('.download-container');
                        const downloadOptions = document.querySelector('.download-options');
                        
                        if (downloadContainer && downloadOptions) {
                            let optionsHTML = '';
                            
                            switch(data.platform) {
                                case 'YouTube':
                                    // Video önizleme bilgilerini güncelle
                                    document.getElementById('videoThumb').src = data.thumb || '';
                                    document.getElementById('videoTitle').textContent = data.title || 'Video Başlığı';
                                    document.getElementById('channelName').textContent = data.channel || 'Kanal Adı';
                                    
                                    if (data.video_hd) {
                                        optionsHTML += `
                                            <div class="option-group">
                                                <a href="${data.video_hd}" class="download-button primary" download target="_blank">
                                                    <i class="fas fa-video"></i>
                                                    HD Video İndir (720p)
                                                </a>
                                            </div>`;
                                    }
                                    if (data.video) {
                                        optionsHTML += `
                                            <div class="option-group">
                                                <a href="${data.video}" class="download-button secondary" download target="_blank">
                                                    <i class="fas fa-video"></i>
                                                    Video İndir (360p)
                                                </a>
                                            </div>`;
                                    }
                                    if (data.audio) {
                                        optionsHTML += `
                                            <div class="option-group">
                                                <a href="${data.audio}" class="download-button secondary" download target="_blank">
                                                    <i class="fas fa-music"></i>
                                                    Ses İndir (MP3)
                                                </a>
                                            </div>`;
                                    }
                                    break;

                                case 'TikTok':
                                    // TikTok önizleme bilgilerini güncelle
                                    document.getElementById('videoThumb').src = data.creator?.profile_photo || '';
                                    document.getElementById('videoTitle').textContent = `TikTok - ${data.creator?.name || 'Bilinmeyen'}`;
                                    document.getElementById('channelName').textContent = data.creator?.username || '@username';
                                    
                                    if (data.data?.video) {
                                        optionsHTML += `
                                            <div class="option-group">
                                                <a href="${data.data.video}" class="download-button primary" download target="_blank">
                                                    <i class="fas fa-video"></i>
                                                    Video İndir
                                                </a>
                                            </div>`;
                                    }
                                    if (data.data?.audio) {
                                        optionsHTML += `
                                            <div class="option-group">
                                                <a href="${data.data.audio}" class="download-button secondary" download target="_blank">
                                                    <i class="fas fa-music"></i>
                                                    Ses İndir (MP3)
                                                </a>
                                            </div>`;
                                    }
                                    break;

                                case 'Twitter':
                                    if (data.url) {
                                        optionsHTML += `
                                            <div class="option-group">
                                                <a href="${data.url}" class="download-button primary" download="${data.filename || 'twitter_media'}" target="_blank">
                                                    <i class="fas fa-download"></i>
                                                    Medya İndir
                                                </a>
                                            </div>`;
                                    }
                                    break;

                                case 'Instagram':
                                    if (data.data && data.data.length > 0) {
                                        const mediaItem = data.data[0];
                                        if (mediaItem.url) {
                                            optionsHTML += `
                                                <div class="option-group">
                                                    <a href="${mediaItem.url}" class="download-button primary" download target="_blank">
                                                        <i class="fas fa-download"></i>
                                                        Medya İndir
                                                    </a>
                                                </div>`;
                                        }
                                    }
                                    break;
                            }
                            
                            if (optionsHTML) {
                                downloadOptions.innerHTML = optionsHTML;
                                downloadContainer.style.display = 'block';
                                showMessage(`${data.platform} medyası bulundu`, 'success');
                            } else {
                                downloadOptions.innerHTML = '<p class="no-downloads">İndirme seçeneği bulunamadı</p>';
                                downloadContainer.style.display = 'block';
                            }
                        }
                    } else {
                        showMessage('Video bilgileri alınamadı', 'error');
                        hideDownloadOptions();
                    }
                } catch (error) {
                    console.error('Hata:', error);
                    showMessage('Bir hata oluştu: ' + error.message, 'error');
                    hideDownloadOptions();
                } finally {
                    toggleLoading(false);
                }
            } else {
                showMessage('Geçerli bir URL giriniz', 'error');
            }
        });
    }
} 