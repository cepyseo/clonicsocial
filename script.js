// Temel değişkenler
let onlineUsers = 0;
let totalVisits = 0;
let totalDownloads = 0;

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    updateStats();
    setInterval(updateStats, 5000);
    loadSettings();
    setupEventListeners();
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

    // Ayarlar modalı için event listener
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsContent = document.querySelector('.settings-content');
    
    if (settingsToggle && settingsContent) {
        settingsToggle.addEventListener('click', () => {
            settingsContent.classList.toggle('show');
            
            // Ayarlar ikonunu döndür
            const icon = settingsToggle.querySelector('i');
            if (icon) {
                icon.style.transform = settingsContent.classList.contains('show') 
                    ? 'rotate(180deg)' 
                    : 'rotate(0deg)';
            }
        });

        // Ayarlar dışına tıklandığında kapat
        document.addEventListener('click', (e) => {
            if (!settingsToggle.contains(e.target) && 
                !settingsContent.contains(e.target) && 
                settingsContent.classList.contains('show')) {
                settingsContent.classList.remove('show');
                const icon = settingsToggle.querySelector('i');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        });

        // Ayarları kaydet
        const autoDownload = document.getElementById('autoDownload');
        const saveHistory = document.getElementById('saveHistory');
        const notifications = document.getElementById('notifications');

        // Kaydedilmiş ayarları yükle
        if (autoDownload) {
            autoDownload.checked = localStorage.getItem('autoDownload') === 'true';
            autoDownload.addEventListener('change', () => {
                localStorage.setItem('autoDownload', autoDownload.checked);
            });
        }

        if (saveHistory) {
            saveHistory.checked = localStorage.getItem('saveHistory') === 'true';
            saveHistory.addEventListener('change', () => {
                localStorage.setItem('saveHistory', saveHistory.checked);
            });
        }

        if (notifications) {
            notifications.checked = localStorage.getItem('notifications') === 'true';
            notifications.addEventListener('change', () => {
                localStorage.setItem('notifications', notifications.checked);
            });
        }
    }
}

// URL değişikliğini dinle
document.getElementById('urlInput')?.addEventListener('input', debounce(async (e) => {
    const url = e.target.value.trim();
    
    if (url && isValidUrl(url)) {
        try {
            toggleLoading(true);
            const data = await fetchVideoData(url);
            
            if (data.status) {
                updateDownloadOptions(data);
                showMessage('Video bilgileri alındı', 'success');
            } else {
                showMessage('Video bilgileri alınamadı', 'error');
            }
        } catch (error) {
            console.error('Hata:', error);
            showMessage('Bir hata oluştu', 'error');
        } finally {
            toggleLoading(false);
        }
    } else {
        hideDownloadOptions();
    }
}, 500));

// Video bilgilerini getir
async function fetchVideoData(url) {
    const targetUrl = `https://tele-social.vercel.app/down?url=${encodeURIComponent(url)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    return await response.json();
}

// İndirme seçeneklerini güncelle
function updateDownloadOptions(data) {
    const downloadOptions = document.querySelector('.download-options');
    if (!downloadOptions) return;

    let optionsHTML = '';

    if (data.video_hd) {
        optionsHTML += createDownloadButton(data.video_hd, 'video-hd', '720p MP4 HD');
    }
    if (data.video) {
        optionsHTML += createDownloadButton(data.video, 'video-sd', '360p MP4');
    }
    if (data.audio) {
        optionsHTML += createDownloadButton(data.audio, 'audio', '128kbps MP3');
    }

    downloadOptions.innerHTML = optionsHTML || '<p class="no-downloads">İndirme seçeneği bulunamadı</p>';
    downloadOptions.style.display = 'grid';

    // İndirme butonlarına event listener ekle
    downloadOptions.querySelectorAll('.download-option').forEach(btn => {
        btn.addEventListener('click', incrementDownloads);
    });
}

// İndirme butonu oluştur
function createDownloadButton(url, className, text) {
    return `
        <a href="${url}" class="download-option ${className}" download>
            <i class="fas fa-${className.includes('video') ? 'video' : 'music'}"></i>
            ${text}
        </a>
    `;
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