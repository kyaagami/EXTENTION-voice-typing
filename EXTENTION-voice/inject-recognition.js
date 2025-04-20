// Fungsi yang akan diinjeksi ke halaman web
function setupVoiceRecognition() {
    // Hentikan instance yang ada jika sedang berjalan
    if (window.voiceRecognitionActive) {
      window.existingRecognition.stop();
      window.voiceRecognitionActive = false;
      return { status: "stopped" };
    }
  
    if (!('webkitSpeechRecognition' in window)) {
      return { status: "error", message: "Browser tidak mendukung pengenalan suara" };
    }
    
    const recognition = new webkitSpeechRecognition();
    window.existingRecognition = recognition;
    window.voiceRecognitionActive = true;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'id-ID';
    
    let currentInput = document.activeElement;
    let finalTranscript = '';
    
    recognition.onstart = function() {
      console.log('[Voice Typing] Pengenalan suara dimulai');
      document.dispatchEvent(new CustomEvent('voice-recognition-status', { 
        detail: { status: "listening" } 
      }));
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
      
      if (currentInput && (currentInput.tagName === 'INPUT' || currentInput.tagName === 'TEXTAREA' || currentInput.isContentEditable)) {
        if (finalTranscript) {
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
      console.error('[Voice Typing] Error:', event.error);
      document.dispatchEvent(new CustomEvent('voice-recognition-status', { 
        detail: { status: "error", message: event.error } 
      }));
      window.voiceRecognitionActive = false;
    };
    
    recognition.onend = function() {
      console.log('[Voice Typing] Pengenalan suara berakhir');
      document.dispatchEvent(new CustomEvent('voice-recognition-status', { 
        detail: { status: "stopped" } 
      }));
      window.voiceRecognitionActive = false;
    };
    
    // Mendeteksi perubahan fokus input
    document.addEventListener('focus', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        currentInput = e.target;
      }
    }, true);
    
    try {
      recognition.start();
      return { status: "listening" };
    } catch (err) {
      console.error('[Voice Typing] Start error:', err);
      return { status: "error", message: err.message };
    }
  }
  
  // Fungsi untuk menghentikan pengenalan suara
  function stopVoiceRecognition() {
    if (window.existingRecognition) {
      try {
        window.existingRecognition.stop();
      } catch (err) {
        console.error('[Voice Typing] Stop error:', err);
      }
      window.voiceRecognitionActive = false;
      return { status: "stopped" };
    }
    return { status: "not_running" };
  }
  
  // Mengembalikan fungsi yang diminta
  function executeVoiceAction(action) {
    if (action === 'start') {
      return setupVoiceRecognition();
    } else if (action === 'stop') {
      return stopVoiceRecognition();
    } else if (action === 'status') {
      return { 
        status: window.voiceRecognitionActive ? "listening" : "stopped"
      };
    }
  }
  
  // Mengembalikan hasil dari tindakan yang diminta
  return executeVoiceAction(arguments[0]);