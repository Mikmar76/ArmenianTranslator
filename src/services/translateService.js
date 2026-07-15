const GOOGLE_API = 'https://translate.googleapis.com/translate_a/single';

export async function translateText(text, sourceLang, targetLang) {
  if (!text || text.trim().length === 0) return '';

  const params = new URLSearchParams({
    client: 'gtx',
    sl: sourceLang,
    tl: targetLang,
    dt: 't',
    q: text,
  });

  try {
    const response = await fetch(`${GOOGLE_API}?${params}`);
    const data = await response.json();
    const translated = data[0].map(item => item[0]).join('');
    return translated;
  } catch (error) {
    throw new Error(`Translation error: ${error.message}`);
  }
}
