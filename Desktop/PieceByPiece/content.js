// content.js
let settings = {
  enabled: true,
  languages: {
    spanish: true,
    german: true,
    french: true
  },
  density: 'medium',
  maxWords: '3'
};

// Cache for translations
const translationCache = {};
let pageTranslations = {};

// Load settings when the script runs
chrome.storage.local.get(settings, function(items) {
  settings = items;
  if (settings.enabled) {
    setTimeout(initializeTranslation, 1000); // Wait for page to fully load
  }
});

// Listen for settings changes
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "settingsUpdated") {
    settings = request.settings;
    
    // If enabled, refresh translations
    if (settings.enabled) {
      // Remove existing translations
      const translatedElements = document.querySelectorAll('.translated-word');
      translatedElements.forEach(el => {
        const originalText = el.getAttribute('data-original');
        el.outerHTML = originalText;
      });
      
      // Apply new translations
      setTimeout(initializeTranslation, 100);
    } else {
      // Remove all translations
      const translatedElements = document.querySelectorAll('.translated-word');
      translatedElements.forEach(el => {
        const originalText = el.getAttribute('data-original');
        el.outerHTML = originalText;
      });
    }
  }
});

// Main function to initialize translation
async function initializeTranslation() {
  if (!settings.enabled) return;
  
  // Collect available languages based on settings
  const availableLanguages = [];
  if (settings.languages.spanish) availableLanguages.push('spanish');
  if (settings.languages.german) availableLanguages.push('german');
  if (settings.languages.french) availableLanguages.push('french');
  
  // If no languages are selected, exit
  if (availableLanguages.length === 0) return;
  
  try {
    // Request translations from the background script
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: "translate",
        text: document.body.innerText,
        targetLanguages: availableLanguages
      }, response => {
        if (response && response.success) {
          pageTranslations = response.translations;
          resolve();
        } else {
          console.error("Translation request failed:", response ? response.error : "No response");
          reject(new Error("Translation request failed"));
        }
      });
    });
    
    // Once we have translations, apply them to the page
    translatePage();
  } catch (error) {
    console.error("Error initializing translation:", error);
  }
}

// Function to translate selected words on the page
function translatePage() {
  if (!settings.enabled) return;
  
  // Get all text nodes that are not in script or style tags
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Ignore script, style tags and existing translated words
        if (node.parentElement && 
            (node.parentElement.tagName === 'SCRIPT' || 
             node.parentElement.tagName === 'STYLE' || 
             node.parentElement.classList.contains('translated-word') ||
             node.parentElement.classList.contains('translation-popup'))) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Only process nodes with actual text content
        if (node.textContent.trim() === '') {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Prioritize nodes in the left part of the page
        const rect = node.parentElement.getBoundingClientRect();
        const pageWidth = window.innerWidth;
        const positionX = rect.left;
        
        // Higher probability for elements in left 40% of the page
        const leftBias = (positionX < pageWidth * 0.4) ? 1.5 : 1.0;
        
        // Apply the bias
        if (Math.random() < leftBias) {
          return NodeFilter.FILTER_ACCEPT;
        }
        
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }
  
  // Determine density percentage based on settings
  let densityPercentage;
  switch(settings.density) {
    case 'low':
      densityPercentage = Math.random() * 1 + 1; // 1-2%
      break;
    case 'medium':
      densityPercentage = Math.random() * 2 + 3; // 3-5%
      break;
    case 'high':
      densityPercentage = Math.random() * 2 + 6; // 6-8%
      break;
    default:
      densityPercentage = 3;
  }
  
  // Collect available languages based on settings
  const availableLanguages = [];
  if (settings.languages.spanish) availableLanguages.push('spanish');
  if (settings.languages.german) availableLanguages.push('german');
  if (settings.languages.french) availableLanguages.push('french');
  
  // If no languages are selected, exit
  if (availableLanguages.length === 0) return;
  
  // Determine total words and how many to translate
  const totalWords = textNodes.reduce((count, node) => 
    count + node.textContent.split(/\s+/).filter(word => word.trim().length > 0).length, 0);
  
  const wordsToTranslate = Math.ceil(totalWords * (densityPercentage / 100));
  
  // Create array of word positions to translate, favoring the left side
  const translationPositions = [];
  let wordCount = 0;
  
  textNodes.forEach(node => {
    const words = node.textContent.split(/\s+/);
    wordCount += words.length;
  });
  
  // Select random positions based on density
  for (let i = 0; i < wordsToTranslate; i++) {
    // Give higher probability to earlier positions (left side of page)
    const position = Math.floor(Math.pow(Math.random(), 1.5) * wordCount);
    translationPositions.push(position);
  }
  
  translationPositions.sort((a, b) => a - b);
  
  // Process the nodes and translate selected words
  let currentPosition = 0;
  
  // Function to get translation for a word or phrase
  const getTranslation = (text, language) => {
    const lowerText = text.toLowerCase();
    
    // Check if we have this translation in our cache
    if (pageTranslations[language] && typeof pageTranslations[language] === 'object') {
      // First check exact match
      if (pageTranslations[language][lowerText]) {
        return pageTranslations[language][lowerText];
      }
      
      // Try to find partial matches
      for (const phrase in pageTranslations[language]) {
        if (lowerText.includes(phrase) || phrase.includes(lowerText)) {
          return pageTranslations[language][phrase];
        }
      }
    }
    
    // Fallback to mock translations
    const mockTranslations = {
      spanish: {
        "hello": "hola",
        "world": "mundo",
        "good": "bueno",
        "morning": "mañana",
        "night": "noche",
        "thank": "gracias",
        "please": "por favor",
        "yes": "sí",
        "no": "no",
        "maybe": "quizás",
        "today": "hoy",
        "tomorrow": "mañana",
        "yesterday": "ayer"
      },
      german: {
        "hello": "hallo",
        "world": "Welt",
        "good": "gut",
        "morning": "Morgen",
        "night": "Nacht",
        "thank": "danke",
        "please": "bitte",
        "yes": "ja",
        "no": "nein",
        "maybe": "vielleicht",
        "today": "heute",
        "tomorrow": "morgen",
        "yesterday": "gestern"
      },
      french: {
        "hello": "bonjour",
        "world": "monde",
        "good": "bon",
        "morning": "matin",
        "night": "nuit",
        "thank": "merci",
        "please": "s'il vous plaît",
        "yes": "oui",
        "no": "non",
        "maybe": "peut-être",
        "today": "aujourd'hui",
        "tomorrow": "demain",
        "yesterday": "hier"
      }
    };
    
    // Check if we have a mock translation
    if (mockTranslations[language][lowerText]) {
      return mockTranslations[language][lowerText];
    }
    
    // Last resort: make a pseudo-translation for demo purposes
    return `[${text} in ${language}]`;
  };
  
  // Process each text node
  for (const node of textNodes) {
    const text = node.textContent;
    const words = text.split(/(\s+)/); // Split by whitespace but keep the separators
    
    let newHTML = '';
    let i = 0;
    
    while (i < words.length) {
      // Skip whitespace elements
      if (words[i].trim() === '') {
        newHTML += words[i];
        i++;
        continue;
      }
      
      // Check if current position should be translated
      if (translationPositions.includes(currentPosition)) {
        // Determine how many words to translate (1-3 based on settings)
        const maxWordsToTranslate = Math.min(
          parseInt(settings.maxWords), 
          Math.floor((words.length - i) / 2) + 1
        );
        
        const wordsToTranslate = Math.floor(Math.random() * maxWordsToTranslate) + 1;
        
        // Combine words to translate
        let originalPhrase = words[i].trim();
        let j = 1;
        for (; j < wordsToTranslate * 2 && i + j < words.length; j += 2) {
          if (words[i + j].trim() === '' && i + j + 1 < words.length) {
            originalPhrase += ' ' + words[i + j + 1].trim();
          }
        }
        
        // Select a random language
        const language = availableLanguages[Math.floor(Math.random() * availableLanguages.length)];
        
        // Get translation for this phrase
        const translatedPhrase = getTranslation(originalPhrase, language);
        
        // Create the translated element with special handling for click events
        newHTML += `<span class="translated-word" 
                        data-original="${words.slice(i, i + j).join('')}" 
                        data-translation="${translatedPhrase}" 
                        data-language="${language}">${translatedPhrase}</span>`;
        
        i += j;
      } else {
        newHTML += words[i];
        i++;
      }
      
      currentPosition++;
    }
    
    // Replace the text node with our modified HTML if changes were made
    if (newHTML !== text) {
      const tempElement = document.createElement('span');
      tempElement.innerHTML = newHTML;
      
      node.parentNode.replaceChild(tempElement, node);
      
      // Move contents outside the temporary span
      while (tempElement.firstChild) {
        tempElement.parentNode.insertBefore(tempElement.firstChild, tempElement);
      }
      
      // Remove the empty temporary span
      tempElement.parentNode.removeChild(tempElement);
    }
  }
  
  // Add click handlers for all translated words
  document.querySelectorAll('.translated-word').forEach(el => {
    el.addEventListener('click', function(event) {
      event.stopPropagation();
      
      // Remove any existing popups
      document.querySelectorAll('.translation-popup').forEach(popup => popup.remove());
      
      // Create popup
      const popup = document.createElement('div');
      popup.className = 'translation-popup';
      
      const original = document.createElement('div');
      original.className = 'original';
      original.textContent = `English: ${this.getAttribute('data-original')}`;
      popup.appendChild(original);
      
      const language = this.getAttribute('data-language');
      const langDisplay = language.charAt(0).toUpperCase() + language.slice(1);
      
      const translated = document.createElement('div');
      translated.textContent = `${langDisplay}: ${this.getAttribute('data-translation')}`;
      popup.appendChild(translated);
      
      const playButton = document.createElement('button');
      playButton.className = 'play-button';
      playButton.textContent = '🔊 Pronounce';
      playButton.onclick = function(e) {
        e.stopPropagation();
        speakText(el.getAttribute('data-translation'), language);
      };
      popup.appendChild(playButton);
      
      // Add popup to the word element
      this.appendChild(popup);
      
      // Close popup when clicking outside
      document.addEventListener('click', function closePopup(e) {
        if (!popup.contains(e.target) && e.target !== el) {
          popup.remove();
          document.removeEventListener('click', closePopup);
        }
      });
    });
  });
}

// Function to speak text using Web Speech API
function speakText(text, language) {
  const speechLang = {
    'spanish': 'es-ES',
    'german': 'de-DE',
    'french': 'fr-FR'
  }[language] || 'en-US';
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLang;
  speechSynthesis.speak(utterance);
}