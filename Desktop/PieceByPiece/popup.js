// popup.js
document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    chrome.storage.local.get({
      enabled: true,
      languages: {
        spanish: true,
        german: true,
        french: true
      },
      density: 'medium',
      maxWords: '3'
    }, function(items) {
      document.getElementById('enabled').checked = items.enabled;
      document.getElementById('spanish').checked = items.languages.spanish;
      document.getElementById('german').checked = items.languages.german;
      document.getElementById('french').checked = items.languages.french;
      document.getElementById('density').value = items.density;
      document.getElementById('maxWords').value = items.maxWords;
    });
  
    // Save settings when apply button is clicked
    document.getElementById('apply').addEventListener('click', function() {
      const settings = {
        enabled: document.getElementById('enabled').checked,
        languages: {
          spanish: document.getElementById('spanish').checked,
          german: document.getElementById('german').checked,
          french: document.getElementById('french').checked
        },
        density: document.getElementById('density').value,
        maxWords: document.getElementById('maxWords').value
      };
      
      chrome.storage.local.set(settings, function() {
        // Notify the content script about the settings change
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "settingsUpdated",
            settings: settings
          });
        });
        
        // Visual feedback
        const button = document.getElementById('apply');
        button.textContent = 'Applied!';
        setTimeout(function() {
          button.textContent = 'Apply Settings';
        }, 1500);
      });
    });
  });