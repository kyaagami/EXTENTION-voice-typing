// Mendefinisikan variabel global untuk recognition
let voiceRecognition = null;

// Mendengarkan pesan dari extension
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "startVoiceRecognition") {
    startVoiceRecognition();
  } else if (message.action === "stopVoiceRecognition") {
    stopVoiceRecognition();
  }
});

function startVoiceRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    chrome.runtime.sendMessage({ status: "error", error: "Browser tidak mendukung pengenalan suara" });
    return;
  }
  
  // Hentikan instance sebelumnya jika ada
  if (voiceRecognition) {
    voiceRecognition.stop();
  }
  
  voiceRecognition = new webkitSpeechRecognition();
  const recognition = voiceRecognition;
  
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'id-ID'; // Bahasa Indonesia, ubah sesuai kebutuhan
  
  let currentInput = document.activeElement;
  let finalTranscript = '';
  
  recognition.onstart = function() {
    console.log('Pengenalan suara dimulai');
    chrome.runtime.sendMessage({ status: "listening" });
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
    chrome.runtime.sendMessage({ status: "error", error: event.error });
  };
  
  recognition.onend = function() {
    console.log('Pengenalan suara berakhir');
    chrome.runtime.sendMessage({ status: "stopped" });
  };
  
  // Memulai pengenalan suara
  try {
    recognition.start();
    
    // Mendeteksi perubahan fokus input
    document.addEventListener('focus', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        currentInput = e.target;
      }
    }, true);
  } catch (err) {
    chrome.runtime.sendMessage({ status: "error", error: err.message });
  }
}

function stopVoiceRecognition() {
  if (voiceRecognition) {
    try {
      voiceRecognition.stop();
    } catch (err) {
      console.error('Error stopping voice recognition:', err);
    }
    voiceRecognition = null;
    chrome.runtime.sendMessage({ status: "stopped" });
  }
}