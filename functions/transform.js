export function cleanTopicData(data) {
  if (!data || !Array.isArray(data)) return []
  
  return data.map(topic => ({
    themeName: sanitizeText(topic.themeName || ''),
    themeCode: sanitizeText(topic.themeCode || ''),
    f3: normalizePercent(topic.f3),
    newsTitle: sanitizeText(topic.newsTitle || ''),
    stock: topic.stock ? topic.stock.map(stock => ({
      name: sanitizeText(stock.name || ''),
      f3: normalizePercent(stock.f3)
    })) : []
  }))
}

export function cleanExpectedData(data) {
  if (!data || !Array.isArray(data)) return []
  
  return data.map(topic => ({
    date: topic.date || Date.now(),
    isNew: Boolean(topic.isNew),
    summary: sanitizeText(topic.summary || ''),
    theme: topic.theme ? topic.theme.map(theme => ({
      name: sanitizeText(theme.name || ''),
      code: sanitizeText(theme.code || ''),
      f3: normalizePercent(theme.f3)
    })) : []
  }))
}

export function cleanThemeList(data) {
  if (!data || !data.list) return { list: [], total: 0 }
  
  return {
    list: data.list.map(theme => ({
      themeCode: sanitizeText(theme.themeCode || ''),
      themeName: sanitizeText(theme.themeName || ''),
      fex3: Number(theme.fex3) || 0,
      bf3: normalizePercent(theme.bf3),
      securityName: sanitizeText(theme.securityName || ''),
      f3: normalizePercent(theme.f3)
    })),
    total: Number(data.total) || 0
  }
}

function sanitizeText(text) {
  if (typeof text !== 'string') return ''
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

function normalizePercent(value) {
  const num = Number(value)
  if (isNaN(num)) return 0
  return Math.round(num * 100) / 100
}

export function addNoiseMarkup(html) {
  const noiseChars = ['\u200B', '\u200C', '\u200D', '\uFEFF']
  let result = html
  
  noiseChars.forEach((char, index) => {
    if (index % 2 === 0) {
      result = result.replace(/<span/g, `<span data-noise="${char}"`)
    }
  })
  
  return result
}