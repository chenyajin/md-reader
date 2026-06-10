// renderer.js - Markdown 阅读器核心逻辑

// 获取 DOM 元素
const markdownInput = document.getElementById('markdown-input')
const previewContent = document.getElementById('preview-content')
const btnOpen = document.getElementById('btn-open')
const btnSave = document.getElementById('btn-save')
const btnExport = document.getElementById('btn-export')
const btnSync = document.getElementById('btn-sync')
const btnRefresh = document.getElementById('btn-refresh')
const btnSplit = document.getElementById('btn-split')
const btnTheme = document.getElementById('btn-theme')
const filePathSpan = document.getElementById('file-path')
const statusText = document.getElementById('status-text')
const charCount = document.getElementById('char-count')
const lineCount = document.getElementById('line-count')
const mainContent = document.getElementById('main-content')
const divider = document.getElementById('divider')

// 状态变量
let currentFilePath = null
let isSynced = true
let isDarkTheme = false
let isVerticalSplit = true

// 初始化 marked
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
})

// 更新预览
function updatePreview() {
  const markdownText = markdownInput.value
  const html = marked.parse(markdownText)
  previewContent.innerHTML = html
  
  // 更新统计信息
  updateStats(markdownText)
  
  // 更新状态
  statusText.textContent = '预览已更新'
  setTimeout(() => {
    statusText.textContent = '就绪'
  }, 2000)
}

// 更新统计信息
function updateStats(text) {
  const chars = text.length
  const lines = text.split('\n').length
  charCount.textContent = `字符: ${chars}`
  lineCount.textContent = `行数: ${lines}`
}

// 打开文件
async function openFile() {
  try {
    const result = await window.electronAPI.openFile()
    if (result) {
      currentFilePath = result.filePath
      markdownInput.value = result.content
      filePathSpan.textContent = result.filePath
      updatePreview()
      statusText.textContent = `已打开: ${result.filePath}`
    }
  } catch (error) {
    console.error('打开文件失败:', error)
    statusText.textContent = '打开文件失败'
  }
}

// 保存文件
async function saveFile() {
  try {
    const result = await window.electronAPI.saveFile(currentFilePath, markdownInput.value)
    if (result) {
      currentFilePath = result
      filePathSpan.textContent = result
      statusText.textContent = `已保存: ${result}`
    }
  } catch (error) {
    console.error('保存文件失败:', error)
    statusText.textContent = '保存文件失败'
  }
}

// 导出 HTML
async function exportHtml() {
  try {
    const markdownText = markdownInput.value
    const htmlContent = generateHtmlDocument(markdownText)
    const result = await window.electronAPI.exportHtml(htmlContent)
    if (result) {
      statusText.textContent = `已导出: ${result}`
    }
  } catch (error) {
    console.error('导出HTML失败:', error)
    statusText.textContent = '导出HTML失败'
  }
}

// 生成完整的 HTML 文档
function generateHtmlDocument(markdownText) {
  const html = marked.parse(markdownText)
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Export</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown-light.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fff;
        }
        .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 900px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="markdown-body">
        ${html}
    </div>
</body>
</html>`
}

// 切换同步滚动
function toggleSync() {
  isSynced = !isSynced
  btnSync.textContent = isSynced ? '🔗' : '🔓'
  btnSync.title = isSynced ? '取消同步滚动' : '同步滚动'
}

// 刷新预览
function refreshPreview() {
  updatePreview()
}

// 切换布局（垂直/水平）
function toggleSplit() {
  isVerticalSplit = !isVerticalSplit
  if (isVerticalSplit) {
    mainContent.classList.remove('horizontal')
    mainContent.classList.add('vertical')
    btnSplit.textContent = '⊞'
    btnSplit.title = '切换到水平布局'
  } else {
    mainContent.classList.remove('vertical')
    mainContent.classList.add('horizontal')
    btnSplit.textContent = '⊟'
    btnSplit.title = '切换到垂直布局'
  }
}

// 切换主题
function toggleTheme() {
  isDarkTheme = !isDarkTheme
  if (isDarkTheme) {
    document.body.classList.add('dark-theme')
    btnTheme.textContent = '☀️'
    btnTheme.title = '切换到亮色主题'
  } else {
    document.body.classList.remove('dark-theme')
    btnTheme.textContent = '🌓'
    btnTheme.title = '切换到暗色主题'
  }
}

// 同步滚动
function syncScroll() {
  if (!isSynced) return
  
  const editorPanel = document.getElementById('editor-panel')
  const previewPanel = document.getElementById('preview-panel')
  
  const editorScrollPercent = markdownInput.scrollTop / (markdownInput.scrollHeight - markdownInput.clientHeight)
  previewPanel.scrollTop = editorScrollPercent * (previewContent.scrollHeight - previewPanel.clientHeight)
}

// 拖拽分割线
let isDragging = false

divider.addEventListener('mousedown', (e) => {
  isDragging = true
  document.body.style.cursor = 'col-resize'
  e.preventDefault()
})

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return
  
  const containerRect = mainContent.getBoundingClientRect()
  const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100
  
  if (percentage > 20 && percentage < 80) {
    const editorPanel = document.getElementById('editor-panel')
    const previewPanel = document.getElementById('preview-panel')
    
    editorPanel.style.flex = `0 0 ${percentage}%`
    previewPanel.style.flex = `0 0 ${100 - percentage - 0.5}%`
  }
})

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false
    document.body.style.cursor = ''
  }
})

// 事件监听
markdownInput.addEventListener('input', updatePreview)
markdownInput.addEventListener('scroll', syncScroll)
btnOpen.addEventListener('click', openFile)
btnSave.addEventListener('click', saveFile)
btnExport.addEventListener('click', exportHtml)
btnSync.addEventListener('click', toggleSync)
btnRefresh.addEventListener('click', refreshPreview)
btnSplit.addEventListener('click', toggleSplit)
btnTheme.addEventListener('click', toggleTheme)

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + O - 打开文件
  if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
    e.preventDefault()
    openFile()
  }
  
  // Ctrl/Cmd + S - 保存文件
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveFile()
  }
  
  // Ctrl/Cmd + E - 导出HTML
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault()
    exportHtml()
  }
})

// 初始化
updatePreview()
statusText.textContent = '欢迎使用 MD Reader！'
