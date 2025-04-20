document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const status = document.getElementById('status');
  const themeToggle = document.getElementById('themeToggle');
  
  // Load saved theme preference
  chrome.storage.local.get('theme', function(data) {
    if (data.theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.setAttribute('data-theme', 'light');
    }
  });
  
  // Theme toggle functionality
  themeToggle.addEventListener('click', function() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    
    // Save theme preference
    chrome.storage.local.set({theme: newTheme});
  });
    
    // Check current status on load
    checkStatus();
  
    startBtn.addEventListener('click', function() {
      status.textContent = "Memulai pengenalan suara...";
      startBtn.disabled = true;
      
      chrome.runtime.sendMessage(
        {target: "recognition", action: "start"}, 
        function(response) {
          if (response && response.status === "listening") {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            status.textContent = "Mendengarkan...";
            status.className = "status-listening";
          } else {
            const errorMsg = response && response.message ? response.message : "Tidak dapat memulai pengenalan suara";
            status.textContent = "Error: " + errorMsg;
            status.className = "status-error";
            startBtn.disabled = false;
            stopBtn.disabled = true;
          }
        }
      );
    });
    
    stopBtn.addEventListener('click', function() {
      chrome.runtime.sendMessage(
        {target: "recognition", action: "stop"}, 
        function(response) {
          startBtn.disabled = false;
          stopBtn.disabled = true;
          status.textContent = "Pengenalan suara dihentikan";
          status.className = "";
        }
      );
    });
  
    function checkStatus() {
      chrome.runtime.sendMessage(
        {target: "recognition", action: "status"}, 
        function(response) {
          if (response && response.status === "listening") {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            status.textContent = "Mendengarkan...";
            status.className = "status-listening";
          } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            status.textContent = "Klik \"Mulai Mendengarkan\" untuk memulai";
            status.className = "";
          }
        }
      );
    }
  });