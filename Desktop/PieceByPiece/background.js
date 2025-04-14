// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    // Get the current URL to check for localized versions
    const currentUrl = sender.tab.url;
    const urlObj = new URL(currentUrl);
    
    // Check if the site has localized versions first
    checkLocalizedVersions(urlObj, request.targetLanguages)
      .then(localizedData => {
        if (localizedData && Object.keys(localizedData.translations).length > 0) {
          // Found localized versions, use them
          sendResponse({
            success: true,
            translationSource: "localized",
            translations: localizedData.translations
          });
        } else {
          // No suitable localized versions found, use translation API
          translateWithAPI(request.text, request.targetLanguages)
            .then(apiData => {
              sendResponse({
                success: true,
                translationSource: "api",
                translations: apiData.translations
              });
            })
            .catch(error => {
              sendResponse({
                success: false,
                error: error.toString()
              });
            });
        }
      })
      .catch(error => {
        // Error checking localized versions, fall back to API
        translateWithAPI(request.text, request.targetLanguages)
          .then(apiData => {
            sendResponse({
              success: true,
              translationSource: "api",
              translations: apiData.translations
            });
          })
          .catch(error => {
            sendResponse({
              success: false,
              error: error.toString()
            });
          });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

// Check if the site has localized versions in the target languages
async function checkLocalizedVersions(urlObj, targetLanguages) {
  const translations = {};
  const langCodes = {
    "spanish": "es",
    "german": "de",
    "french": "fr"
  };
  
  try {
    for (const language of targetLanguages) {
      const langCode = langCodes[language];
      
      // Try subdomain approach
      const subdomainUrl = new URL(urlObj.toString());
      subdomainUrl.hostname = `${langCode}.${subdomainUrl.hostname.replace(/^[^.]+\./, '')}`;
      
      // Try path approach
      const pathUrl = new URL(urlObj.toString());
      pathUrl.pathname = `/${langCode}${pathUrl.pathname}`;
      
      // Try query param approach
      const queryUrl = new URL(urlObj.toString());
      queryUrl.searchParams.set('lang', langCode);
      
      // Check if any of these URLs exist and get their content
      const urls = [subdomainUrl.toString(), pathUrl.toString(), queryUrl.toString()];
      
      for (const url of urls) {
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            // Add credentials to handle cookies that might be required for localized versions
            credentials: 'include',
            // Add headers to make the request look like a normal browser request
            headers: {
              'User-Agent': navigator.userAgent
            }
          });
          
          if (response.ok) {
            // Localized version exists, store it
            translations[language] = {
              url: url,
              // In real implementation, we'd fetch the content and analyze
              // but for now we'll just store the URL
              mappings: {}
            };
            
            // We found a localized version, break the inner loop
            break;
          }
        } catch (error) {
          console.log(`Error checking ${url}:`, error);
          // Continue to the next URL
        }
      }
    }
    
    return { translations };
  } catch (error) {
    console.error("Error checking localized versions:", error);
    throw error;
  }
}

// Function to translate text using an external API
async function translateWithAPI(text, targetLanguages) {
  const translations = {};
  const langCodes = {
    "spanish": "es",
    "german": "de",
    "french": "fr"
  };
  
  try {
    // For demo purposes, we'll use the LibreTranslate API
    // In production, you should use a paid API with better reliability
    for (const language of targetLanguages) {
      const langCode = langCodes[language];
      
      // Extract words and phrases from the text to translate
      // This is a simplified approach - in production you'd do more sophisticated text processing
      const wordsToTranslate = extractWords(text);
      const translatedWords = {};
      
      for (const word of wordsToTranslate) {
        // In a real extension, this would be an actual API call
        
        // LibreTranslate example (you would need to host this yourself or use a public instance)
        // const response = await fetch('https://libretranslate.com/translate', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     q: word,
        //     source: 'en',
        //     target: langCode,
        //     format: 'text'
        //   }),
        //   headers: { 'Content-Type': 'application/json' }
        // });
        // const data = await response.json();
        // translatedWords[word] = data.translatedText;
        
        // For now, we'll use mock translations
        translatedWords[word] = getMockTranslation(word, language);
      }
      
      translations[language] = translatedWords;
    }
    
    return { translations };
  } catch (error) {
    console.error("Translation API error:", error);
    throw error;
  }
}

// Function to extract words and phrases from text
function extractWords(text) {
  // This is a simplified approach
  // In production, you'd do more sophisticated text processing
  const words = [];
  
  // Split by spaces and remove punctuation
  const rawWords = text.split(/\s+/).map(word => word.replace(/[^\w\s]|_/g, "").trim()).filter(Boolean);
  
  // Add single words
  for (const word of rawWords) {
    if (word.length > 2 && !words.includes(word)) {
      words.push(word);
    }
  }
  
  // Add some common phrases (simplified)
  for (let i = 0; i < rawWords.length - 1; i++) {
    const phrase = `${rawWords[i]} ${rawWords[i+1]}`;
    if (!words.includes(phrase)) {
      words.push(phrase);
    }
  }
  
  // Limit the number of words to prevent excessive API usage
  return words.slice(0, 100);
}

// Mock translations for demo purposes
function getMockTranslation(word, language) {
  const mockTranslations = {
    spanish: {
      "hello": "hola",
      "world": "mundo",
      "good morning": "buenos días",
      "good night": "buenas noches",
      "thank you": "gracias",
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
      "good morning": "guten Morgen",
      "good night": "gute Nacht",
      "thank you": "danke",
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
      "good morning": "bonjour",
      "good night": "bonne nuit",
      "thank you": "merci",
      "please": "s'il vous plaît",
      "yes": "oui",
      "no": "non",
      "maybe": "peut-être",
      "today": "aujourd'hui",
      "tomorrow": "demain",
      "yesterday": "hier"
    }
  };
  
  // Return mock translation or a placeholder
  return mockTranslations[language][word.toLowerCase()] || 
         `[${word} in ${language}]`;
}