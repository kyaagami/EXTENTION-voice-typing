chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Menangani pesan dari sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === "recognition") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) {
        sendResponse({status: "error", message: "No active tab"});
        return;
      }
      
      if (message.action === "start") {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          func: startVoiceRecognition
        }).then((results) => {
          if (results && results[0]) {
            sendResponse(results[0].result);
          } else {
            sendResponse({status: "error", message: "Failed to start recognition"});
          }
        }).catch((err) => {
          console.error("Error executing script:", err);
          sendResponse({status: "error", message: err.message});
        });
      } else if (message.action === "stop") {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          func: stopVoiceRecognition
        }).then((results) => {
          if (results && results[0]) {
            sendResponse(results[0].result);
          } else {
            sendResponse({status: "error", message: "Failed to stop recognition"});
          }
        }).catch((err) => {
          console.error("Error executing script:", err);
          sendResponse({status: "error", message: err.message});
        });
      } else if (message.action === "status") {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          func: getRecognitionStatus
        }).then((results) => {
          if (results && results[0]) {
            sendResponse(results[0].result);
          } else {
            sendResponse({status: "stopped"});
          }
        }).catch((err) => {
          console.error("Error executing script:", err);
          sendResponse({status: "error", message: err.message});
        });
      }
    });
    
    // Mengembalikan true agar sendResponse bisa digunakan secara asinkron
    return true;
  }
});

// Fungsi yang akan dieksekusi di halaman web
function startVoiceRecognition() {
  // Hentikan instance yang ada jika sedang berjalan
  if (window.voiceRecognitionActive) {
    if (window.existingRecognition) {
      try {
        window.existingRecognition.stop();
      } catch (e) {
        console.error("[Voice Typing] Error stopping existing recognition:", e);
      }
    }
  }

  if (!('webkitSpeechRecognition' in window)) {
    return { status: "error", message: "Browser tidak mendukung pengenalan suara" };
  }
  
  try {
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
      window.voiceRecognitionActive = false;
    };
    
    recognition.onend = function() {
      console.log('[Voice Typing] Pengenalan suara berakhir');
      window.voiceRecognitionActive = false;
    };
    
    // Mendeteksi perubahan fokus input
    document.addEventListener('focus', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        currentInput = e.target;
      }
    }, true);
    
    recognition.start();
    return { status: "listening" };
  } catch (err) {
    console.error('[Voice Typing] Start error:', err);
    return { status: "error", message: err.message };
  }
}

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

function getRecognitionStatus() {
  if (window.voiceRecognitionActive) {
    return { status: "listening" };
  } else {
    return { status: "stopped" };
  }
}