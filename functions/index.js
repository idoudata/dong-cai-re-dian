import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { cleanTopicData, cleanExpectedData, cleanThemeList, addNoiseMarkup } from './transform.js'

const app = new Hono()

app.use('*', cors())

const isHXRequest = (c) => {
  return c.req.header('HX-Request') === 'true'
}

const honeyPotResponse = () => {
  return `<div style="color:#cccccc;text-align:center;padding:20px;">数据加载中...</div>`
}

const verifyRequest = (c, next) => {
  if (!isHXRequest(c)) {
    return c.html(honeyPotResponse())
  }
  return next()
}

app.use('/internal-render/*', verifyRequest)

const getBaseUrl = (c) => {
  return c.env.EM_BASE_URL || 'https://emcfgdata.eastmoney.com'
}

async function fetchEastmoneyData(c, endpoint, isExpectedHot = false, pageNum = 1) {
  const baseUrl = getBaseUrl(c)
  const url = `${baseUrl}${endpoint}`
  
  const params = {
    args: isExpectedHot ? {} : { pageSize: 30, pageNum, sort: -1 },
    client: "web",
    clientVersion: c.env.CLIENT_VERSION || "8.3",
    clientType: c.env.CLIENT_TYPE || "cfw",
    randomCode: isExpectedHot ? "qwRtDlKIulaJS88Y" : "QMvrYSV2BSS4uDmf",
    timestamp: Date.now()
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Origin': 'https://emrnweb.eastmoney.com',
        'Referer': 'https://emrnweb.eastmoney.com/'
      },
      body: JSON.stringify(params)
    })
    const data = await response.json()
    if (data.code === 0) {
      return data.data
    }
    return null
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

app.get('/internal-render/today-hot', async (c) => {
  const rawData = await fetchEastmoneyData(c, '/api/themeInvest/getTodayChance', false)
  
  if (!rawData) {
    return c.html(honeyPotResponse())
  }

  const data = cleanTopicData(rawData)

  const html = data.map(topic => `
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800" data-t="${Math.random().toString(36).substr(2, 9)}">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-lg font-bold" data-n="${Math.random().toString(36).substr(2, 5)}">${topic.themeName}</h3>
        <span class="text-lg font-bold ${topic.f3 >= 0 ? 'text-red-500' : 'text-green-500'}" data-v="${Math.random().toString(36).substr(2, 5)}">
          ${topic.f3}% ${topic.f3 >= 0 ? '↑' : '↓'}
        </span>
      </div>
      <p class="text-gray-400 text-sm mb-4 cursor-pointer hover:text-blue-400" 
         onclick="openModal('${topic.themeCode}')" data-d="${Math.random().toString(36).substr(2, 7)}">${topic.newsTitle}</p>
      <div class="grid grid-cols-2 gap-2">
        ${topic.stock.map(stock => `
          <div class="bg-gray-800 p-2 rounded" data-s="${Math.random().toString(36).substr(2, 6)}">
            <div class="text-sm">${stock.name}</div>
            <div class="text-sm ${stock.f3 >= 0 ? 'text-red-500' : 'text-green-500'}">
              ${stock.f3}%
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')

  return c.html(addNoiseMarkup(html))
})

app.get('/internal-render/expected-hot', async (c) => {
  const rawData = await fetchEastmoneyData(c, '/api/themeInvest/getExpectHot', true)
  
  if (!rawData) {
    return c.html(honeyPotResponse())
  }

  const data = cleanExpectedData(rawData)

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const html = data.map(topic => `
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800" data-t="${Math.random().toString(36).substr(2, 9)}">
      <div class="flex justify-between items-center mb-2">
        <span class="text-gray-400 text-sm" data-d="${Math.random().toString(36).substr(2, 5)}">${formatDate(topic.date)}</span>
        ${topic.isNew ? '<span class="px-2 py-1 bg-blue-600 text-xs rounded-full" data-n="1">新</span>' : ''}
      </div>
      <p class="text-sm mb-3" data-s="${Math.random().toString(36).substr(2, 7)}">${topic.summary}</p>
      <div class="space-y-2">
        ${topic.theme.map(theme => `
          <div class="flex justify-between items-center bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700"
               onclick="openModal('${theme.code}')" data-m="${Math.random().toString(36).substr(2, 6)}">
            <span class="text-sm">${theme.name}</span>
            <span class="text-sm ${theme.f3 >= 0 ? 'text-red-500' : 'text-green-500'}" data-v="${Math.random().toString(36).substr(2, 5)}">
              ${theme.f3}% ${theme.f3 >= 0 ? '↑' : '↓'}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')

  return c.html(addNoiseMarkup(html))
})

app.get('/internal-render/all-themes', async (c) => {
  const pageNum = parseInt(c.req.query('page') || '1')
  const rawData = await fetchEastmoneyData(c, '/api/themeInvest/getThemeList', false, pageNum)
  
  if (!rawData) {
    return c.html(honeyPotResponse())
  }

  const data = cleanThemeList(rawData)

  const html = data.list.map(theme => `
    <div class="bg-gray-900 rounded-lg p-3 border border-gray-800 cursor-pointer hover:bg-gray-800"
         onclick="openModal('${theme.themeCode}')" data-t="${Math.random().toString(36).substr(2, 9)}">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium" data-n="${Math.random().toString(36).substr(2, 5)}">${theme.themeName}</span>
          ${theme.fex3 > 0 ? `
            <span class="px-2 py-0.5 bg-gray-800 rounded-full text-xs" data-f="${Math.random().toString(36).substr(2, 4)}">
              ${theme.fex3}家涨停
            </span>
          ` : ''}
        </div>
        <span class="text-sm font-bold ${theme.bf3 >= 0 ? 'text-red-500' : 'text-green-500'}" data-b="${Math.random().toString(36).substr(2, 5)}">
          ${theme.bf3}%
        </span>
      </div>
      <div class="flex justify-between items-center mt-2 text-xs text-gray-400">
        <span data-s="${Math.random().toString(36).substr(2, 6)}">领涨：${theme.securityName}</span>
        <span class="${theme.f3 >= 0 ? 'text-red-500' : 'text-green-500'}" data-v="${Math.random().toString(36).substr(2, 5)}">
          ${theme.f3}%
        </span>
      </div>
    </div>
  `).join('')

  return c.html(addNoiseMarkup(html))
})

export default app