import { Hono } from 'hono'
import { cors } from 'hono/cors'

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

async function fetchEastmoneyData(url, isExpectedHot = false, pageNum = 1) {
  const params = {
    args: isExpectedHot ? {} : { pageSize: 30, pageNum, sort: -1 },
    client: "web",
    clientVersion: "8.3",
    clientType: "cfw",
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
  const data = await fetchEastmoneyData('https://emcfgdata.eastmoney.com/api/themeInvest/getTodayChance', false)
  
  if (!data) {
    return c.html(honeyPotResponse())
  }

  const html = data.map(topic => `
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-lg font-bold">${topic.themeName}</h3>
        <span class="text-lg font-bold ${topic.f3 >= 0 ? 'text-red-500' : 'text-green-500'}">
          ${topic.f3}% ${topic.f3 >= 0 ? '↑' : '↓'}
        </span>
      </div>
      <p class="text-gray-400 text-sm mb-4 cursor-pointer hover:text-blue-400" 
         onclick="openModal('${topic.themeCode}')">${topic.newsTitle}</p>
      <div class="grid grid-cols-2 gap-2">
        ${topic.stock.map(stock => `
          <div class="bg-gray-800 p-2 rounded">
            <div class="text-sm">${stock.name}</div>
            <div class="text-sm ${stock.f3 >= 0 ? 'text-red-500' : 'text-green-500'}">
              ${stock.f3}%
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')

  return c.html(html)
})

app.get('/internal-render/expected-hot', async (c) => {
  const data = await fetchEastmoneyData('https://emcfgdata.eastmoney.com/api/themeInvest/getExpectHot', true)
  
  if (!data) {
    return c.html(honeyPotResponse())
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const html = data.map(topic => `
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div class="flex justify-between items-center mb-2">
        <span class="text-gray-400 text-sm">${formatDate(topic.date)}</span>
        ${topic.isNew ? '<span class="px-2 py-1 bg-blue-600 text-xs rounded-full">新</span>' : ''}
      </div>
      <p class="text-sm mb-3">${topic.summary}</p>
      <div class="space-y-2">
        ${topic.theme.map(theme => `
          <div class="flex justify-between items-center bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700"
               onclick="openModal('${theme.code}')">
            <span class="text-sm">${theme.name}</span>
            <span class="text-sm ${theme.f3 >= 0 ? 'text-red-500' : 'text-green-500'}">
              ${theme.f3}% ${theme.f3 >= 0 ? '↑' : '↓'}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')

  return c.html(html)
})

app.get('/internal-render/all-themes', async (c) => {
  const pageNum = parseInt(c.req.query('page') || '1')
  const data = await fetchEastmoneyData('https://emcfgdata.eastmoney.com/api/themeInvest/getThemeList', false, pageNum)
  
  if (!data || !data.list) {
    return c.html(honeyPotResponse())
  }

  const html = data.list.map(theme => `
    <div class="bg-gray-900 rounded-lg p-3 border border-gray-800 cursor-pointer hover:bg-gray-800"
         onclick="openModal('${theme.themeCode}')">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">${theme.themeName}</span>
          ${theme.fex3 > 0 ? `
            <span class="px-2 py-0.5 bg-gray-800 rounded-full text-xs">
              ${theme.fex3}家涨停
            </span>
          ` : ''}
        </div>
        <span class="text-sm font-bold ${theme.bf3 >= 0 ? 'text-red-500' : 'text-green-500'}">
          ${theme.bf3}%
        </span>
      </div>
      <div class="flex justify-between items-center mt-2 text-xs text-gray-400">
        <span>领涨：${theme.securityName}</span>
        <span class="${theme.f3 >= 0 ? 'text-red-500' : 'text-green-500'}">
          ${theme.f3}%
        </span>
      </div>
    </div>
  `).join('')

  return c.html(html)
})

export default app