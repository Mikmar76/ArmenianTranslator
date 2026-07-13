const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

export async function translateText(text, sourceLang, targetLang) {
  if (!text || text.trim().length === 0) return '';

  const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    }
    throw new Error(data.responseDetails || 'Translation failed');
  } catch (error) {
    throw new Error(`Translation error: ${error.message}`);
  }
}
