document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const status = document.getElementById('status');
    
    startBtn.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: startVoiceRecognition
        });
        startBtn.disabled = true;
        stopBtn.disabled = false;
        status.textContent = "Mendengarkan...";
      });
    });
    
    stopBtn.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: stopVoiceRecognition
        });
        startBtn.disabled = false;
        stopBtn.disabled = true;
        status.textContent = "Pengenalan suara dihentikan";
      });
    });
  });
  
  function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Browser Anda tidak mendukung pengenalan suara. Gunakan Google Chrome terbaru.');
      return;
    }
    
    window.voiceRecognition = new webkitSpeechRecognition();
    const recognition = window.voiceRecognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'id-ID'; // Bahasa Indonesia, ubah sesuai kebutuhan
    
    let currentInput = document.activeElement;
    let finalTranscript = '';
    
    recognition.onstart = function() {
      console.log('Pengenalan suara dimulai');
    };
    
    recognition.onresult = function(event) {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Memasukkan teks ke dalam elemen input yang aktif
      if (currentInput && (currentInput.tagName === 'INPUT' || currentInput.tagName === 'TEXTAREA' || currentInput.isContentEditable)) {
        if (event.results[event.resultIndex].isFinal) {
          // Jika hasil final, tambahkan ke input
          if (currentInput.isContentEditable) {
            currentInput.textContent += finalTranscript;
          } else {
            currentInput.value += finalTranscript;
          }
          finalTranscript = '';
        }
      }
    };
    
    recognition.onerror = function(event) {
      console.error('Error pengenalan suara:', event.error);
    };
    
    recognition.onend = function() {
      console.log('Pengenalan suara berakhir');
    };
    
    // Memulai pengenalan suara
    recognition.start();
    
    // Mendeteksi perubahan fokus input
    document.addEventListener('focus', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        currentInput = e.target;
      }
    }, true);
  }
  
  function stopVoiceRecognition() {
    if (window.voiceRecognition) {
      window.voiceRecognition.stop();
      console.log('Pengenalan suara dihentikan');
    }
  }