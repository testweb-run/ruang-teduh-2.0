// ISI DENGAN API KEY GEMINI ANDA DI SINI AGAR PENGGUNA TIDAK PERLU MEMASUKKANNYA LAGI
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; 

// STATE MANAGEMENT & LOCAL STORAGE
let appState = {
  user: null, // { nama, kelas, umur, wa, privacyApproved }
  checkins: [], // list of check-in objects: { id, date, score, category, answers }
  chatHistory: [], // list of messages: { sender: 'user'|'bot', text: '', time: '' }
  badges: {
    badge1: false, // 🌱 First check-in
    badge2: false, // 🌸 3 check-ins
    badge3: false, // ☀️ 5 check-ins
    badge4: false, // 💬 Curhat AI
    badge5: false  // 👑 10 check-ins
  },
  theme: 'light', // 'light' | 'dark'
  currentCarouselSlide: 0,
  geminiApiKey: (GEMINI_API_KEY && GEMINI_API_KEY !== "AQ.Ab8RN6I9vg2Mnjhbbm0swlQIbkY_3xX5393KUvADphDcpNZghg") ? GEMINI_API_KEY : null,
  isBKAuthorized: false,
  aiSummaries: []
};

// Seed initial data for a realistic demo
const seedData = () => {
  const seededCheckins = [];
  localStorage.setItem('rt_seeded_checkins', JSON.stringify(seededCheckins));

  const seededAISummaries = [];
  localStorage.setItem('rt_seeded_ai_summaries', JSON.stringify(seededAISummaries));
};

// INIT APP
window.addEventListener('DOMContentLoaded', () => {
  // WIPE OLD SEEDED DATA ONCE TO FORCE-RESET RESPONDENTS AND CLASS OPTIONS
  if (!localStorage.getItem('rt_data_wiped_v3')) {
    localStorage.removeItem('rt_my_checkins');
    localStorage.removeItem('rt_my_ai_summaries');
    localStorage.removeItem('rt_user');
    localStorage.removeItem('rt_badges');
    localStorage.removeItem('rt_seeded_checkins');
    localStorage.removeItem('rt_seeded_ai_summaries');
    localStorage.setItem('rt_data_wiped_v3', 'true');
  }

  // Check if data is already seeded, if not, seed it
  if (!localStorage.getItem('rt_seeded_checkins')) {
    seedData();
  }
  
  // Load State from localStorage
  loadStateFromLocalStorage();
  
  // Setup Theme
  initTheme();
  
  // Setup Event Listeners
  setupEventListeners();
  
  // Refresh UI
  updateUserUI();
  renderAdminDashboard();
  updateApiKeyUI();
  renderAISummaries();
});

// LOAD STATE
const loadStateFromLocalStorage = () => {
  const storedUser = localStorage.getItem('rt_user');
  if (storedUser) {
    appState.user = JSON.parse(storedUser);
  }
  
  const storedCheckins = localStorage.getItem('rt_my_checkins');
  if (storedCheckins) {
    appState.checkins = JSON.parse(storedCheckins);
  }
  
  const storedBadges = localStorage.getItem('rt_badges');
  if (storedBadges) {
    appState.badges = JSON.parse(storedBadges);
  }
  
  const storedTheme = localStorage.getItem('rt_theme');
  if (storedTheme) {
    appState.theme = storedTheme;
  }
  
  const storedApiKey = localStorage.getItem('rt_gemini_api_key');
  if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
    appState.geminiApiKey = GEMINI_API_KEY;
  } else if (storedApiKey) {
    appState.geminiApiKey = storedApiKey;
  }

  const storedAISummaries = localStorage.getItem('rt_my_ai_summaries');
  if (storedAISummaries) {
    appState.aiSummaries = JSON.parse(storedAISummaries);
  } else {
    appState.aiSummaries = [];
  }
};

// SAVE STATE
const saveStateToLocalStorage = () => {
  if (appState.user) {
    localStorage.setItem('rt_user', JSON.stringify(appState.user));
  }
  localStorage.setItem('rt_my_checkins', JSON.stringify(appState.checkins));
  localStorage.setItem('rt_badges', JSON.stringify(appState.badges));
  localStorage.setItem('rt_theme', appState.theme);
};

// THEME MANAGEMENT
const initTheme = () => {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (appState.theme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    themeToggleBtn.textContent = '🌙';
  }
};

const toggleTheme = () => {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (document.body.classList.contains('dark-mode')) {
    document.body.classList.remove('dark-mode');
    appState.theme = 'light';
    themeToggleBtn.textContent = '🌙';
    showToast('Mode Terang Diaktifkan ☀️');
  } else {
    document.body.classList.add('dark-mode');
    appState.theme = 'dark';
    themeToggleBtn.textContent = '☀️';
    showToast('Mode Gelap Diaktifkan 🌙');
  }
  saveStateToLocalStorage();
};

// NAVIGATION
const navigateTo = (viewId) => {
  // If accessing Quiz or Chat and NOT logged in, show auth modal
  if ((viewId === 'view-quiz' || viewId === 'view-chat') && !appState.user) {
    openAuthModal(viewId);
    return;
  }
  
  // Hide all panels
  const panels = document.querySelectorAll('.view-panel');
  panels.forEach(panel => panel.classList.remove('active'));
  
  // Show target panel
  const targetPanel = document.getElementById(viewId);
  if (targetPanel) {
    targetPanel.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Update nav buttons active state
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => btn.classList.remove('active'));
  
  let navId = 'nav-landing';
  let mobNavId = 'mob-landing';
  
  if (viewId === 'view-quiz') {
    navId = 'nav-quiz';
    mobNavId = 'mob-quiz';
  } else if (viewId === 'view-chat') {
    navId = 'nav-chat';
    mobNavId = 'mob-chat';
  } else if (viewId === 'view-articles') {
    navId = 'nav-articles';
    mobNavId = 'mob-articles';
  } else if (viewId === 'view-admin') {
    navId = 'nav-admin';
    mobNavId = 'mob-admin';
  }
  
  const activeBtn = document.getElementById(navId);
  if (activeBtn) activeBtn.classList.add('active');

  // Update mobile navigation items active state
  const mobButtons = document.querySelectorAll('.mobile-nav-item');
  mobButtons.forEach(btn => btn.classList.remove('active'));
  const activeMobBtn = document.getElementById(mobNavId);
  if (activeMobBtn) activeMobBtn.classList.add('active');
};

// EVENT LISTENERS SETUP
const setupEventListeners = () => {
  // Theme Toggle Click
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  // Auth Form Submit
  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
  
  // Questionnaire Form Submit
  document.getElementById('quiz-form').addEventListener('submit', handleQuizSubmit);
  
  // Chat Send button
  document.getElementById('chat-send-btn').addEventListener('click', sendChatMessage);
  
  // Chat Input keypress Enter
  document.getElementById('chat-user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });

  // BK Passcode Form Submit
  const bkForm = document.getElementById('bk-passcode-form');
  if (bkForm) {
    bkForm.addEventListener('submit', handleBKAuthSubmit);
  }
};

// AUTH & PRIVACY MODAL
let postAuthRedirectView = 'view-landing';

const openAuthModal = (redirectView) => {
  postAuthRedirectView = redirectView || 'view-landing';
  const overlay = document.getElementById('auth-modal-overlay');
  overlay.classList.add('active');
};

const closeAuthModal = () => {
  const overlay = document.getElementById('auth-modal-overlay');
  overlay.classList.remove('active');
};

const handleAuthSubmit = (e) => {
  e.preventDefault();
  
  const nama = document.getElementById('auth-nama').value.trim();
  const kelas = document.getElementById('auth-kelas').value;
  const umur = document.getElementById('auth-umur').value;
  const wa = document.getElementById('auth-wa').value.trim();
  const privacyApproved = document.getElementById('auth-privacy').checked;
  
  if (!nama || !kelas || !umur || !wa || !privacyApproved) {
    showToast('Mohon lengkapi semua data dan setujui kebijakan privasi!');
    return;
  }
  
  appState.user = { nama, kelas, umur, wa, privacyApproved };
  saveStateToLocalStorage();
  
  closeAuthModal();
  updateUserUI();
  showToast(`Selamat datang, ${nama}! 🎒`);
  navigateTo(postAuthRedirectView);
};

// USER PROGRESS & BADGES UI
const updateUserUI = () => {
  const userProgressBox = document.getElementById('user-progress-box');
  if (appState.user) {
    userProgressBox.style.display = 'flex';
    document.getElementById('span-username').textContent = appState.user.nama;
    
    // Count checkins
    const count = appState.checkins.length;
    document.getElementById('span-checkin-count').textContent = count;
    
    // Update Badge Awards based on logic
    evaluateBadges();
    
    // Update Progress Bar
    let nextThreshold = 5;
    let base = 0;
    if (count >= 10) {
      nextThreshold = 15;
      base = 10;
    } else if (count >= 5) {
      nextThreshold = 10;
      base = 5;
    } else if (count >= 3) {
      nextThreshold = 5;
      base = 3;
    } else if (count >= 1) {
      nextThreshold = 3;
      base = 1;
    } else {
      nextThreshold = 1;
      base = 0;
    }
    
    const diff = nextThreshold - base;
    const progress = count - base;
    const pct = Math.min((progress / diff) * 100, 100);
    
    document.getElementById('progress-checkin-fill').style.width = `${pct}%`;
    document.getElementById('progress-text').textContent = `${count}/${nextThreshold} Check-in untuk badge berikutnya!`;
  } else {
    userProgressBox.style.display = 'none';
  }
};

const evaluateBadges = () => {
  const count = appState.checkins.length;
  
  if (count >= 1) appState.badges.badge1 = true;
  if (count >= 3) appState.badges.badge2 = true;
  if (count >= 5) appState.badges.badge3 = true;
  if (appState.chatHistory.length > 0) appState.badges.badge4 = true;
  if (count >= 10) appState.badges.badge5 = true;
  
  // Render badge items
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`badge-${i}`);
    if (appState.badges[`badge${i}`]) {
      el.classList.add('earned');
    } else {
      el.classList.remove('earned');
    }
  }
  saveStateToLocalStorage();
};

// CHECK-IN SUBMISSION
const handleQuizSubmit = (e) => {
  e.preventDefault();
  
  if (!appState.user) {
    openAuthModal('view-quiz');
    return;
  }
  
  // Calculate scoring
  let score = 0;
  const form = document.getElementById('quiz-form');
  const fd = new FormData(form);
  
  // 5 main + 3 supporting questions
  for (let i = 1; i <= 8; i++) {
    const val = parseInt(fd.get(`q${i}`));
    if (!val) {
      showToast(`Harap selesaikan pertanyaan nomor ${i}!`);
      return;
    }
    score += val;
  }
  
  // Category classification
  // Max possible: 8 * 5 = 40. Min: 8 * 1 = 8.
  // Ringan (Mental state healthy/good): 32 - 40
  // Sedang (Moderate anxiety/stress): 20 - 31
  // Tinggi (Alert, High distress): 8 - 19
  let category = "Ringan";
  if (score <= 19) {
    category = "Tinggi";
  } else if (score <= 31) {
    category = "Sedang";
  }
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  
  const newCheckin = {
    id: Date.now(),
    name: appState.user.nama,
    kelas: appState.user.kelas,
    date: dateStr,
    score: score,
    category: category
  };
  
  appState.checkins.unshift(newCheckin); // add to front
  saveStateToLocalStorage();
  
  // Reset form
  form.reset();
  
  // Evaluate and show success feedback
  updateUserUI();
  renderAdminDashboard();
  
  if (category === "Tinggi") {
    // Show urgent prompt modal/notification
    showHighRiskWarning();
  } else {
    // Normal congratulations
    showToast(`Check-in berhasil! Kondisi mentalmu hari ini: ${category} (${score}/40)`);
    navigateTo('view-landing');
  }
};

const showHighRiskWarning = () => {
  const resultPanel = document.createElement('div');
  resultPanel.className = 'auth-overlay active';
  resultPanel.innerHTML = `
    <div class="auth-modal" style="text-align: center;">
      <h2 style="color: var(--brave-pink); margin-bottom: 1rem;">🚨 Perhatian Khusus</h2>
      <p style="margin-bottom: 1.5rem; line-height: 1.5;">
        Halo <strong>${appState.user.nama}</strong>, kuesioner harianmu hari ini menunjukkan skor tingkat tekanan psikologis yang cukup <strong>Tinggi</strong>. 
      </p>
      <p style="margin-bottom: 1.5rem; line-height: 1.5; font-size: 0.95rem; color: var(--text-secondary);">
        Ingatlah bahwa kamu tidak sendirian. Kami sangat peduli padamu. Kami merekomendasikanmu untuk berbincang santai dengan guru BK sekolah. Percakapan ini dijamin rahasia dan aman.
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <a href="https://wa.me/6281234567890?text=Halo%20Pak%20Jumardan%2C%20saya%20${encodeURIComponent(appState.user.nama)}%20kelas%20${encodeURIComponent(appState.user.kelas)}.%20Saya%20baru%20saja%20menyelesaikan%20cek%20kondisi%20kesehatan%20mental%20dan%20ingin%20bercerita." target="_blank" class="btn-doodle pink shadow-doodle">
          💬 Chat Pak Jumardan (BK)
        </a>
        <a href="https://wa.me/6289876543210?text=Halo%20Pak%20Heri%2C%20saya%20${encodeURIComponent(appState.user.nama)}%20kelas%20${encodeURIComponent(appState.user.kelas)}.%20Saya%20baru%20saja%20menyelesaikan%20cek%20kondisi%20kesehatan%20mental%20dan%20ingin%20bercerita." target="_blank" class="btn-doodle green shadow-doodle">
          💬 Chat Pak Heri Gunawan (BK)
        </a>
        <button class="btn-doodle lavender" onclick="this.closest('.auth-overlay').remove(); navigateTo('view-landing');">
          Kembali ke Beranda
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(resultPanel);
};

// CURHATKUY AI CHATBOT SYSTEM (Empathy Engine + School Math/Science Solver)
const sendChatMessage = async () => {
  const inputEl = document.getElementById('chat-user-input');
  const text = inputEl.value.trim();
  if (!text) return;
  
  // Clear input
  inputEl.value = '';
  
  // Render user message
  appendChatMessage('user', text);
  
  // Update state chat history
  appState.chatHistory.push({ sender: 'user', text: text, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) });
  saveStateToLocalStorage();
  evaluateBadges();
  
  // LOG AND ANALYZE FOR GURU BK DASHBOARD
  if (appState.user) {
    analyzeAndLogChat(appState.user.nama, appState.user.kelas, text);
  }
  
  // Typing state
  showBotTypingIndicator(true);
  
  let botResponse = '';
  
  if (appState.geminiApiKey) {
    // Call Real Gemini API
    try {
      botResponse = await callGeminiAPI(text);
    } catch (error) {
      console.error("Gemini API Error:", error);
      showToast("Koneksi Gemini API gagal, menggunakan Mode Offline.");
      botResponse = generateAIResponse(text);
    }
  } else {
    // Local simulated AI response
    botResponse = generateAIResponse(text);
  }
  
  showBotTypingIndicator(false);
  appendChatMessage('bot', botResponse);
  
  // Update state with bot reply
  appState.chatHistory.push({ sender: 'bot', text: botResponse, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) });
  saveStateToLocalStorage();
};

// GEMINI API KEY MANAGEMENT
const toggleApiKeyInput = () => {
  const panel = document.getElementById('api-key-panel');
  if (panel.style.display === 'none' || panel.style.display === '') {
    panel.style.display = 'flex';
  } else {
    panel.style.display = 'none';
  }
};

const saveApiKey = () => {
  const input = document.getElementById('gemini-api-key-input');
  const key = input.value.trim();
  if (!key) {
    showToast("Masukkan API Key terlebih dahulu!");
    return;
  }
  appState.geminiApiKey = key;
  localStorage.setItem('rt_gemini_api_key', key);
  updateApiKeyUI();
  toggleApiKeyInput();
  showToast("API Key Gemini disimpan! 🔑");
};

const clearApiKey = () => {
  appState.geminiApiKey = null;
  localStorage.removeItem('rt_gemini_api_key');
  updateApiKeyUI();
  toggleApiKeyInput();
  showToast("API Key Gemini dihapus, beralih ke Mode Offline.");
};

const updateApiKeyUI = () => {
  const statusEl = document.getElementById('chat-bot-status-text');
  const inputEl = document.getElementById('gemini-api-key-input');
  if (!statusEl) return;
  if (appState.geminiApiKey) {
    statusEl.textContent = 'Aktif (Mode Gemini AI)';
    statusEl.style.color = 'var(--brave-pink)';
    if (inputEl) inputEl.value = appState.geminiApiKey;
  } else {
    statusEl.textContent = 'Aktif (Mode Offline)';
    statusEl.style.color = 'var(--hero-green)';
    if (inputEl) inputEl.value = '';
  }
};

const callGeminiAPI = async (query) => {
  const systemPrompt = `Kamu adalah CurhatKuy AI, asisten virtual kesehatan mental sekolah yang ramah, hangat, dan sangat empatik untuk siswa Sekolah Menengah Atas (khususnya Kelas X, usia 15-18 tahun).
  Program "Ruang Teduh 2.0" ini merupakan inisiatif program kesehatan mental sekolah oleh Nesha Fidelya Fitra dan dicoding oleh Rahmat Dwi Kurniawan.
  
  Gaya Bicara:
  - Gunakan bahasa Indonesia santai, gaul yang sopan dan ramah (panggil dirimu "Aku" / "CurhatKuy AI", dan panggil siswa "Kamu" / "Teman Teduh").
  - Tunjukkan empati mendalam, validasi kekhawatiran mereka, dan berikan dorongan positif.
  - Gunakan emoji agar terkesan ceria dan bersahabat.
  
  Pembantu Belajar (School Solver):
  - Kamu juga bisa membantu memecahkan dan menjelaskan soal pelajaran sekolah (seperti matematika, fisika, kimia, biologi, sejarah, dll.) secara runtut langkah demi langkah dengan penjelasan yang mudah dipahami anak sekolah.
  
  Panduan Keselamatan:
  - JANGAN memberikan diagnosis medis atau psikiatri formal.
  - Jika terdeteksi kondisi berisiko tinggi (misalnya ada niat menyakiti diri, stres berat ekstrim, bullying berat, atau keputusasaan mendalam), berikan tanggapan yang menenangkan dan secara tegas arahkan/rekomendasikan mereka untuk berkonsultasi dengan Guru BK sekolah (Pak Jumardan, S.Pd. atau Pak Heri Gunawan, S.Pd.) di ruang BK.`;

  const recentHistory = appState.chatHistory.slice(-6).map(msg => `${msg.sender === 'user' ? 'Siswa' : 'CurhatKuy AI'}: ${msg.text}`).join('\n');
  
  const prompt = `${systemPrompt}\n\nRiwayat Obrolan Terkini:\n${recentHistory}\n\nSiswa: ${query}\n\nCurhatKuy AI:`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${appState.geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
    let reply = data.candidates[0].content.parts[0].text;
    
    // Format simple markdown to HTML (asterisks to bold/italic, newlines to <br>)
    reply = reply
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    
    // Check if response contains high distress signals, append counselor contact just in case
    const textLower = query.toLowerCase();
    const highRiskKeywords = ["bunuh diri", "menyerah saja", "mengakhiri hidup", "potong pergelangan", "menyakiti diri", "pingin mati", "pengen mati", "selesai hidup"];
    if (highRiskKeywords.some(keyword => textLower.includes(keyword))) {
      reply += `<br><br><a href="https://wa.me/6281234567890?text=Halo%20Pak%20Jumardan%2C%20saya%20${encodeURIComponent(appState.user?.nama || 'Siswa')}%20sedang%20mengalami%20situasi%20darurat%20dan%20membutuhkan%20bantuan." target="_blank" class="btn-doodle pink shadow-doodle" style="display: inline-block; margin-top: 10px; text-decoration: none;">📞 Hubungi Pak Jumardan (BK)</a>`;
    }

    return reply;
  } else {
    throw new Error("Invalid response format from Gemini API");
  }
};

const appendChatMessage = (sender, text) => {
  const box = document.getElementById('chat-messages-box');
  const bubble = document.createElement('div');
  bubble.className = `msg-bubble ${sender}`;
  bubble.innerHTML = text;
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
};

const showBotTypingIndicator = (show) => {
  const box = document.getElementById('chat-messages-box');
  const existingIndicator = document.getElementById('chat-typing-indicator');
  
  if (show && !existingIndicator) {
    const indicator = document.createElement('div');
    indicator.id = 'chat-typing-indicator';
    indicator.className = 'msg-bubble bot';
    indicator.innerHTML = `<span style="font-style: italic; color: var(--text-secondary);">CurhatKuy AI sedang mengetik...</span>`;
    box.appendChild(indicator);
    box.scrollTop = box.scrollHeight;
  } else if (!show && existingIndicator) {
    existingIndicator.remove();
  }
};

const resetChat = () => {
  if (confirm("Apakah kamu yakin ingin mereset seluruh obrolan dengan CurhatKuy AI?")) {
    appState.chatHistory = [];
    saveStateToLocalStorage();
    const box = document.getElementById('chat-messages-box');
    box.innerHTML = `
      <div class="msg-bubble bot">
        Halo! Aku <strong>CurhatKuy AI</strong>, teman curhat digitalmu yang aman dan ramah. 😊
        <br><br>
        Ada cerita apa hari ini? Kamu bisa curhat tentang masalah pertemanan, kecemasan, adaptasi di SMA, bahkan menanyakan PR atau memecahkan soal pelajaran sekolah, lho!
      </div>
    `;
    showToast("Riwayat obrolan direset! 🗑️");
  }
};

// GEMINI-LIKE INTELLIGENT RULE & EMPATHY RESPONDER
const generateAIResponse = (query) => {
  const text = query.toLowerCase();
  
  // 1. SAFE RAILS - HIGH RISK TRIGGER DETECTOR
  const highRiskKeywords = ["bunuh diri", "menyerah saja", "mengakhiri hidup", "potong pergelangan", "menyakiti diri", "pingin mati", "pengen mati", "selesai hidup"];
  if (highRiskKeywords.some(keyword => text.includes(keyword))) {
    return `
      <div style="color: var(--brave-pink); font-weight: bold; margin-bottom: 8px;">🚨 PERINGATAN: Kami Sangat Peduli Padamu!</div>
      Ceritamu menunjukkan bahwa kamu sedang berada dalam situasi tekanan yang sangat berat. Saya hanyalah AI dan tidak bisa menggantikan pertolongan darurat atau medis. 
      <br><br>
      Tolong hubungi Guru BK kita segera atau hubungi nomor darurat/pihak profesional. Mereka ada untuk membantumu tanpa menghakimi.
      <br><br>
      <a href="https://wa.me/6281234567890?text=Halo%20Pak%20Jumardan%2C%20saya%20${encodeURIComponent(appState.user?.nama || 'Siswa')}%20sedang%20mengalami%20situasi%20darurat%20dan%20membutuhkan%20bantuan." target="_blank" class="btn-doodle pink shadow-doodle" style="display: inline-block; margin-top: 10px; text-decoration: none;">
        📞 Hubungi Pak Jumardan (BK)
      </a>
    `;
  }

  // 2. MATHEMATICAL / SCHOOL SUBJECT SOLVER
  // Let's check for equations or arithmetic: e.g., "pecahkan", "hitung", "2x + 5 = 15", "x^2", "rumus", "fisika", "kimia", "sejarah"
  
  // Math Equation Solver: 2x + 5 = 15
  if (text.includes("x") && text.includes("=") && (text.includes("+") || text.includes("-"))) {
    // Try to parse basic linear equations: ax + b = c
    // E.g. "2x + 5 = 15"
    const cleaned = text.replace(/\s+/g, ''); // remove spaces
    const match = cleaned.match(/(-?\d*)x([+-]\d+)=([+-]?\d+)/);
    if (match) {
      let a = parseInt(match[1] === "" ? "1" : match[1] === "-" ? "-1" : match[1]);
      let b = parseInt(match[2]);
      let c = parseInt(match[3]);
      
      if (!isNaN(a) && !isNaN(b) && !isNaN(c)) {
        // ax = c - b
        const step1 = c - b;
        const result = step1 / a;
        
        return `
          ✍️ <strong>Pelajaran Sekolah - Matematika:</strong>
          <br>
          Wah, ada tugas matematika ya? Sini, aku bantu selesaikan persamaan linier ini langkah demi langkah:
          <br><br>
          Soal: <code>${match[1]}x ${match[2]} = ${c}</code>
          <br>
          Langkah 1: Pindahkan konstanta ke ruas kanan.
          <br>
          <code>${match[1]}x = ${c} - (${b})</code>
          <br>
          <code>${match[1]}x = ${step1}</code>
          <br><br>
          Langkah 2: Bagi kedua ruas dengan koefisien x (yaitu ${a}).
          <br>
          <code>x = ${step1} / ${a}</code>
          <br>
          <strong><code>x = ${result}</code></strong>
          <br><br>
          Semoga penjelasanku membantu belajarmu ya! Tetap semangat belajarnya! 🌟
        `;
      }
    }
  }

  // Chemistry query: e.g. "h2o", "air", "atom"
  if (text.includes("h2o") || text.includes("rumus kimia air") || text.includes("kimia")) {
    return `
      🧪 <strong>Pelajaran Sekolah - Kimia:</strong>
      <br>
      Tentu! Rumus kimia untuk air adalah <strong>H₂O</strong>.
      <br><br>
      Artinya, satu molekul air terdiri dari:
      <ul>
        <li><strong>2 atom Hidrogen (H)</strong></li>
        <li><strong>1 atom Oksigen (O)</strong></li>
      </ul>
      Mereka terikat secara kovalen. Ada pertanyaan kimia lain yang membingungkanmu? Tanyakan saja! 🔬
    `;
  }

  // Physics query: e.g. "f = ma", "hukum newton", "gaya"
  if (text.includes("f = ma") || text.includes("hukum newton") || text.includes("fisika") || text.includes("gaya")) {
    return `
      🍎 <strong>Pelajaran Sekolah - Fisika:</strong>
      <br>
      Mari kita bahas! Rumus <code>F = m * a</code> adalah formula dari <strong>Hukum II Newton</strong> tentang gerak benda.
      <br><br>
      Keterangan komponennya:
      <ul>
        <li><strong>F (Force / Gaya)</strong>: diukur dalam satuan Newton (N).</li>
        <li><strong>m (Mass / Massa)</strong>: massa benda dalam satuan Kilogram (kg).</li>
        <li><strong>a (Acceleration / Percepatan)</strong>: perubahan kecepatan benda dalam m/s².</li>
      </ul>
      Artinya: Gaya berbanding lurus dengan percepatan dan massa benda. Jika kamu mendorong meja yang berat (massa besar), kamu butuh gaya yang lebih besar agar ia bergeser! 📈
    `;
  }

  // History query: e.g. "proklamasi", "kemerdekaan", "sejarah"
  if (text.includes("proklamasi") || text.includes("kemerdekaan") || text.includes("sejarah") || text.includes("soekarno")) {
    return `
      📜 <strong>Pelajaran Sekolah - Sejarah:</strong>
      <br>
      Tentu! Proklamasi Kemerdekaan Indonesia dibacakan pada hari <strong>Jumat, 17 Agustus 1945</strong> (atau tahun 2605 menurut penanggalan Jepang saat itu) pukul 10.00 WIB.
      <br><br>
      Dibacakan oleh <strong>Ir. Soekarno</strong> didampingi oleh <strong>Drs. Mohammad Hatta</strong> di Jalan Pegangsaan Timur No. 56, Jakarta Pusat. Peristiwa bersejarah ini menjadi tanda berdirinya Negara Kesatuan Republik Indonesia (NKRI) yang bebas dari penjajahan. 🇮🇩
    </ul>
    `;
  }
  
  // General Math/Calculation query helper
  if (text.includes("hitung") || text.includes("tambah") || text.includes("kali") || text.includes("bagi")) {
    const mathExpression = query.replace(/[^0-9+\-*/().\s]/g, '');
    if (mathExpression.trim().length > 2) {
      try {
        const res = Function(`"use strict"; return (${mathExpression})`)();
        if (!isNaN(res)) {
          return `
            🧮 <strong>Kalkulator Belajar:</strong>
            <br>
            Hasil perhitungan dari <code>${mathExpression}</code> adalah:
            <br>
            <strong><code>${res}</code></strong>
            <br><br>
            Butuh bantuan pemecahan soal pelajaran lainnya? Beritahu aku ya!
          `;
        }
      } catch (e) {
        // ignore math parse failures and slide to emotional triggers
      }
    }
  }

  // 3. EMPATHETIC MENTAL HEALTH & COPING RESPONDERS
  
  // Anxiety / Cemas / Overthinking
  if (text.includes("cemas") || text.includes("khawatir") || text.includes("takut") || text.includes("overthink") || text.includes("panik")) {
    return `
      Aku mengerti sekali rasa cemas itu sangat tidak nyaman. Bernapaslah sejenak, kamu aman di sini. 🌸
      <br><br>
      Banyak siswa kelas X mengalami hal serupa karena banyaknya hal baru di SMA. Ketika kepalamu terasa sangat bising dengan kekhawatiran, cobalah <strong>teknik grounding 5-4-3-2-1</strong>:
      <br>
      1. Sebutkan 5 hal yang kamu <strong>lihat</strong> di sekitarmu.
      <br>
      2. Sebutkan 4 hal yang bisa kamu <strong>sentuh</strong>.
      <br>
      3. Sebutkan 3 hal yang kamu <strong>dengar</strong>.
      <br>
      4. Sebutkan 2 hal yang bisa kamu <strong>cium</strong> baunya.
      <br>
      5. Sebutkan 1 hal baik tentang dirimu.
      <br><br>
      Apakah cemasmu berhubungan dengan ujian, pertemanan, atau adaptasi sekolah? Kamu bisa ceritakan lebih detail, aku ada untuk mendengar.
    `;
  }

  // Bullying / Perundungan / Di-bully
  if (text.includes("bully") || text.includes("ejek") || text.includes("dijauhi") || text.includes("musuh") || text.includes("diskriminasi")) {
    return `
      Ya ampun, aku sangat sedih mendengarnya. Ketahuilah bahwa <strong>perilaku perundungan/bullying sama sekali tidak dibenarkan</strong> dan itu bukan salahmu. 🤝
      <br><br>
      Kamu berhak merasa aman di sekolah. Langkah terbaik adalah melaporkannya ke pihak berwenang di sekolah. Kamu bisa menceritakan ini kepada <strong>Pak Jumardan</strong> atau <strong>Pak Heri</strong> di ruang BK. Mereka akan membantumu menyelesaikan masalah ini secara aman dan melindungi privasimu.
      <br><br>
      Tetap kuat ya! Apakah kejadiannya terjadi di dalam kelas atau di luar?
    `;
  }

  // Stress / Capek / Lelah / Beban
  if (text.includes("stres") || text.includes("capek") || text.includes("lelah") || text.includes("tekanan") || text.includes("pusing") || text.includes("berat")) {
    return `
      Rasanya lelah sekali ya ketika tugas menumpuk dan ekspektasi di sekitar kita terasa sangat menuntut. Peluk hangat untukmu. 🫂
      <br><br>
      Terkadang, yang paling kita butuhkan bukanlah menyelesaikan semuanya sekaligus, melainkan memberi diri kita izin untuk <strong>istirahat sejenak</strong>. 
      <br><br>
      Cobalah matikan HP-mu selama 15 menit, renggangkan badan, minum segelas air hangat, atau dengarkan lagu favoritmu. Besok kita hadapi lagi perlahan. Ingat, kesehatan mentalmu jauh lebih penting daripada nilai akademis semata. 
      <br><br>
      Apa yang paling membuatmu merasa lelah hari ini? Ceritakan saja, aku siap menemanimu.
    </ul>
    `;
  }

  // Lonely / Sendiri / Kesepian
  if (text.includes("sepi") || text.includes("sendiri") || text.includes("gapunya teman") || text.includes("kesepian") || text.includes("asing")) {
    return `
      Berada di tengah keramaian sekolah tapi merasa terasing dan sendirian adalah perasaan yang sangat berat. Tapi ketahuilah, kamu tidak pernah benar-benar sendiri. Di sini, aku menemanimu. ❤️
      <br><br>
      Sebagai siswa kelas X, butuh waktu untuk menemukan "kelompok belajar" atau teman yang klop. Cobalah mulai dengan hal kecil, seperti tersenyum, menyapa teman sebangku, atau bergabung di kegiatan ekstrakurikuler yang kamu minati.
      <br><br>
      Apakah kamu ingin bercerita tentang hobi atau hal yang kamu sukai? Aku ingin sekali mendengarnya!
    `;
  }

  // Sad / Sedih / Kecewa / Nangis
  if (text.includes("sedih") || text.includes("nangis") || text.includes("kecewa") || text.includes("patah hati") || text.includes("buruk")) {
    return `
      Tidak apa-apa untuk merasa sedih atau ingin menangis. Menangis bukanlah tanda kelemahan, melainkan cara tubuh melepaskan emosi yang terlalu penuh. 🌧️
      <br><br>
      Apapun yang sedang membuatmu sedih hari ini, luapkan saja di sini. Aku tidak akan menghakimi atau menyudutkanmu. 
      <br><br>
      Setelah air matamu reda, kita bisa mencari cara bersama untuk membuat perasaanmu sedikit lebih baik. Mau bercerita apa yang terjadi?
    `;
  }

  // 4. GENERAL RESPONSES
  const generalReplies = [
    `Terima kasih sudah mau berbagi cerita denganku. Aku mendengarkan setiap katamu. Bagaimana kelanjutannya?`,
    `Itu pasti tidak mudah bagimu. Tapi kamu hebat sudah bisa mengekspresikannya lewat kata-kata. Ceritakan lebih banyak, aku ada di sini.`,
    `Aku mengerti. Sebagai siswa SMA, wajar sekali jika kita menghadapi banyak tantangan emosional. Apa yang biasanya kamu lakukan ketika sedang merasa seperti ini?`,
    `Menarik sekali ceritamu. Aku di sini siap mendengarkan keluh kesahmu kapan saja. Apakah ada hal spesifik yang ingin kamu selesaikan?`
  ];
  const idx = Math.floor(Math.random() * generalReplies.length);
  return generalReplies[idx];
};

// ADMIN DASHBOARD RENDERING
const renderAdminDashboard = () => {
  const tableBody = document.querySelector('#admin-checkin-table tbody');
  if (!tableBody) return;
  
  // Load initial static seeded list & combine with current checkins from localStorage
  const seeded = JSON.parse(localStorage.getItem('rt_seeded_checkins')) || [];
  const myCheckinsFormatted = appState.checkins.map(c => {
    return {
      id: c.id,
      name: c.name,
      kelas: c.kelas,
      date: c.date,
      score: c.score,
      category: c.category
    };
  });
  
  const allCheckins = [...myCheckinsFormatted, ...seeded];
  
  // 1. Render Table
  tableBody.innerHTML = '';
  allCheckins.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.kelas}</td>
      <td>${row.date}</td>
      <td>${row.score} / 40</td>
      <td><span class="badge-status ${row.category.toLowerCase()}">${row.category}</span></td>
    `;
    tableBody.appendChild(tr);
  });
  
  // 2. Count priorities based on 'Tinggi' status
  // For priority flagging: Let's count occurrences of "Tinggi" for each student name.
  // In a real system we check sequential occurrences. Let's do a simulation:
  const studentHighCounts = {};
  allCheckins.forEach(row => {
    if (row.category === 'Tinggi') {
      studentHighCounts[row.name] = (studentHighCounts[row.name] || 0) + 1;
    }
  });
  
  // Filter students who have 3 or more 'Tinggi' checks
  const priorityListEl = document.getElementById('admin-priority-list');
  const countEl = document.getElementById('admin-priority-count');
  
  priorityListEl.innerHTML = '';
  let priorityCount = 0;
  
  Object.keys(studentHighCounts).forEach(name => {
    const counts = studentHighCounts[name];
    if (counts >= 3) {
      priorityCount++;
      const item = document.createElement('div');
      item.className = 'priority-item';
      
      // Look up student details
      const studentData = allCheckins.find(r => r.name === name);
      const kelas = studentData ? studentData.kelas : 'X';
      
      // WhatsApp message customization
      const waMsg = `Halo ${name}, saya guru Bimbingan Konseling (BK) Ruang Teduh. Bisa luangkan waktunya sebentar ke ruang BK? Ada hal ringan yang ingin kami diskusikan santai denganmu. Tetap semangat ya!`;
      
      item.innerHTML = `
        <div class="priority-info">
          <h4>${name}</h4>
          <p>Kelas: ${kelas} | Terdeteksi Kondisi Tinggi</p>
          <p style="color: var(--brave-pink); font-weight: bold; margin-top: 5px;">🔥 ${counts}x Kategori Tinggi</p>
        </div>
        <div>
          <a href="https://wa.me/6281234567890?text=${encodeURIComponent(waMsg)}" target="_blank" class="btn-doodle pink shadow-doodle" style="padding: 6px 12px; font-size: 0.8rem;">
            Panggil (WA)
          </a>
        </div>
      `;
      priorityListEl.appendChild(item);
    }
  });
  
  countEl.textContent = priorityCount;
  
  // 3. Update Chart counts
  // Count overall stats
  let ringanCount = 0;
  let sedangCount = 0;
  let tinggiCount = 0;
  
  allCheckins.forEach(row => {
    if (row.category === 'Ringan') ringanCount++;
    else if (row.category === 'Sedang') sedangCount++;
    else if (row.category === 'Tinggi') tinggiCount++;
  });
  
  // Update Stats labels in landing view (simulated increase)
  document.getElementById('stat-responses').textContent = allCheckins.length;
  // Increase counseling count based on priority list size + some static
  document.getElementById('stat-counselled').textContent = 30 + priorityCount;
  
  // Render AI Summaries Table
  renderAISummaries();
};

const renderAISummaries = () => {
  const tableBody = document.querySelector('#admin-ai-summary-table tbody');
  if (!tableBody) return;

  const seeded = JSON.parse(localStorage.getItem('rt_seeded_ai_summaries')) || [];
  const allSummaries = [...appState.aiSummaries, ...seeded];

  tableBody.innerHTML = '';
  allSummaries.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${row.name}</strong></td>
      <td>${row.kelas}</td>
      <td>${row.date}</td>
      <td><span style="font-weight: bold; color: var(--brave-pink);">${row.topic}</span></td>
      <td><span class="badge-status ${row.emotion.toLowerCase() === 'netral' ? 'sedang' : row.emotion.toLowerCase() === 'cemas' ? 'sedang' : 'tinggi'}">${row.emotion}</span></td>
      <td><span style="font-size: 0.9rem; font-style: italic;">"${row.text}"</span></td>
      <td><span style="font-weight: bold; color: var(--hero-green);">${row.action}</span></td>
    `;
    tableBody.appendChild(tr);
  });
};

const filterAISummaries = () => {
  const query = document.getElementById('admin-ai-search').value.toLowerCase();
  const rows = document.querySelectorAll('#admin-ai-summary-table tbody tr');
  
  rows.forEach(row => {
    const nameCell = row.querySelector('td strong');
    if (nameCell) {
      const nameText = nameCell.textContent.toLowerCase();
      if (nameText.includes(query)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });
};

const analyzeAndLogChat = (name, kelas, text) => {
  const textLower = text.toLowerCase();
  
  // Avoid logging calculations or API key setup statements
  if (textLower.includes("aizasy") || textLower.length < 5) return;

  let topic = "Keluhan Umum";
  let emotion = "Netral";
  let action = "Pantau perkembangan & tanyakan kabar.";

  if (textLower.includes("cemas") || textLower.includes("takut") || textLower.includes("panik") || textLower.includes("overthink")) {
    topic = "Kecemasan";
    emotion = "Cemas";
    action = "Bimbingan pernapasan 4-7-8 & relaksasi cemas.";
  } else if (textLower.includes("bully") || textLower.includes("ejek") || textLower.includes("dijauhi") || textLower.includes("musuh") || textLower.includes("diskriminasi")) {
    topic = "Perundungan / Bullying";
    emotion = "Stres";
    action = "PANGGIL SEGERA - Berikan perlindungan sosial.";
  } else if (textLower.includes("stres") || textLower.includes("capek") || textLower.includes("lelah") || textLower.includes("tekanan") || textLower.includes("berat")) {
    topic = "Tekanan Belajar / Stres";
    emotion = "Stres";
    action = "Konseling manajemen waktu & belajar Pomodoro.";
  } else if (textLower.includes("sepi") || textLower.includes("sendiri") || textLower.includes("kesepian")) {
    topic = "Penyesuaian Sosial";
    emotion = "Sedih";
    action = "Fasilitasi interaksi kelas & pantau hubungan sosial.";
  } else if (textLower.includes("sedih") || textLower.includes("nangis") || textLower.includes("kecewa")) {
    topic = "Tekanan Emosional";
    emotion = "Sedih";
    action = "Berikan bimbingan katarsis emosi & motivasi diri.";
  } else if (textLower.includes("x") && textLower.includes("=") || textLower.includes("hitung") || textLower.includes("pelajaran") || textLower.includes("fisika") || textLower.includes("kimia")) {
    topic = "Keluhan Belajar / Akademik";
    emotion = "Netral";
    action = "Bantu jelaskan materi belajar pendukung.";
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  // Check if student already has a log in state
  const existingIdx = appState.aiSummaries.findIndex(item => item.name === name);
  const truncatedText = text.length > 120 ? text.substring(0, 120) + "..." : text;

  const newLog = {
    id: Date.now(),
    name: name,
    kelas: kelas,
    date: dateStr,
    topic: topic,
    emotion: emotion,
    text: truncatedText,
    action: action
  };

  if (existingIdx !== -1) {
    appState.aiSummaries[existingIdx] = newLog;
  } else {
    appState.aiSummaries.unshift(newLog);
  }

  localStorage.setItem('rt_my_ai_summaries', JSON.stringify(appState.aiSummaries));
  renderAISummaries();
};

// BK PASSCODE SECURITY CONTROLLERS
const openBKPasscodeModal = () => {
  if (appState.isBKAuthorized) {
    navigateTo('view-admin');
  } else {
    const modal = document.getElementById('bk-auth-modal-overlay');
    if (modal) modal.classList.add('active');
  }
};

const closeBKPasscodeModal = () => {
  const modal = document.getElementById('bk-auth-modal-overlay');
  if (modal) {
    modal.classList.remove('active');
    document.getElementById('bk-passcode-input').value = '';
  }
};

const handleBKAuthSubmit = (e) => {
  e.preventDefault();
  const inputVal = document.getElementById('bk-passcode-input').value.trim();
  
  if (inputVal === '12345') {
    appState.isBKAuthorized = true;
    closeBKPasscodeModal();
    navigateTo('view-admin');
    showToast("Akses Guru BK Berhasil! 🔓");
  } else {
    showToast("Kode Keamanan BK Salah! ❌");
    document.getElementById('bk-passcode-input').value = '';
  }
};

// EXPORT ACTION MOCK
const exportData = (format) => {
  showToast(`Mengekspor data kesehatan mental sekolah sebagai ${format}...`);
  setTimeout(() => {
    showToast(`File RuangTeduh_Laporan_${format}.xlsx berhasil diunduh! 📄`);
  }, 1500);
};

// ARTICLE FILTERING
const filterArticles = (category) => {
  // Update filter buttons
  const filterBtns = document.querySelectorAll('.article-filter-btn');
  filterBtns.forEach(btn => btn.classList.remove('active'));
  
  // Find which button triggered this
  const eventBtn = [...filterBtns].find(btn => {
    const clickAttr = btn.getAttribute('onclick');
    return clickAttr && clickAttr.includes(`'${category}'`);
  });
  if (eventBtn) eventBtn.classList.add('active');
  
  // Filter cards
  const cards = document.querySelectorAll('.article-card');
  cards.forEach(card => {
    const cardCat = card.getAttribute('data-category');
    if (category === 'all' || cardCat === category) {
      card.style.display = 'flex';
      card.style.animation = 'fadeIn 0.3s ease';
    } else {
      card.style.display = 'none';
    }
  });
};

// TESTIMONIAL CAROUSEL
const moveCarousel = (direction) => {
  const slides = document.querySelectorAll('.testimonial-slide');
  slides[appState.currentCarouselSlide].classList.remove('active');
  
  appState.currentCarouselSlide += direction;
  if (appState.currentCarouselSlide >= slides.length) {
    appState.currentCarouselSlide = 0;
  } else if (appState.currentCarouselSlide < 0) {
    appState.currentCarouselSlide = slides.length - 1;
  }
  
  slides[appState.currentCarouselSlide].classList.add('active');
};

// FAQ ACCORDION TOGGLING
const toggleFaq = (el) => {
  const item = el.closest('.faq-item');
  const isActive = item.classList.contains('active');
  
  // Close all FAQs
  const allFaqs = document.querySelectorAll('.faq-item');
  allFaqs.forEach(faq => {
    faq.classList.remove('active');
    faq.querySelector('.faq-answer').style.maxHeight = '0px';
  });
  
  if (!isActive) {
    item.classList.add('active');
    const answer = item.querySelector('.faq-answer');
    answer.style.maxHeight = '200px'; // open height
  }
};

// UTILITY TOAST
const showToast = (message) => {
  // Create toast container if not exists
  let toast = document.querySelector('.toast-msg');
  if (toast) {
    toast.remove();
  }
  
  toast = document.createElement('div');
  toast.className = 'toast-msg crayon-border-small';
  toast.innerHTML = `<span>💬</span> <span>${message}</span>`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// SIMULATED DATABASE SYNC ENGINE (API CLOUD BOILERPLATE)
// Fungsi di bawah ini mendemonstrasikan bagaimana Anda dapat menghubungkan website ini ke server backend MySQL/Firebase di masa depan.
// Cukup uncomment dan sesuaikan URL API dengan server nyata Anda.

/*
const syncCheckinToCloud = async (checkinData) => {
  try {
    const response = await fetch('https://api.sekolahanda.sch.id/api/checkins/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SERVER_TOKEN'
      },
      body: JSON.stringify(checkinData)
    });
    
    if (response.ok) {
      console.log('Sync Kuesioner ke Cloud Berhasil!');
    } else {
      console.error('Gagal sinkronisasi data ke Cloud.');
    }
  } catch (error) {
    console.error('Error jaringan database terpusat:', error);
  }
};

const syncAISummaryToCloud = async (summaryData) => {
  try {
    const response = await fetch('https://api.sekolahanda.sch.id/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SERVER_TOKEN'
      },
      body: JSON.stringify(summaryData)
    });
    
    if (response.ok) {
      console.log('Sync Analisis AI ke Cloud Berhasil!');
    } else {
      console.error('Gagal sinkronisasi analisis AI ke Cloud.');
    }
  } catch (error) {
    console.error('Error jaringan database terpusat:', error);
  }
};
*/
