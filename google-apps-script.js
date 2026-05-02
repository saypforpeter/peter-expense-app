/**
 * Peter 記帳 App - Google Apps Script 後端
 * 
 * 安裝步驟：
 * 1. 打開你的 Google Sheets (Spreadsheet ID: 1pJNf-WTSoz1-ftW7rTBDOTNTNKSwOgm6mTnorXH8F1c)
 * 2. 工具 → 指令碼編輯器
 * 3. 刪除所有現有代碼，粘貼這個文件的所有內容
 * 4. 儲存專案 (Ctrl+S)
 * 5. 部署 → 新增部署 → 類型選擇「網頁應用程式」
 *    - 說明：Peter 記帳 API
 *    - 執行身份：身為本人
 *    - 可存取身份：任何人
 * 6. 複製「網頁應用程式」URL
 * 7. 把 URL 粘貼到 index.html 的 CONFIG.SCRIPT_URL
 */

// ============================================================
// CONFIG — UPDATE THIS TO YOUR SPREADSHEET ID
// ============================================================
const SPREADSHEET_ID = '1pJNf-WTSoz1-ftW7rTBDOTNTNKSwOgm6mTnorXH8F1c';

/**
 * 取得 Spreadsheet
 */
function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

/**
 * Web App GET 入口
 */
function doGet(e) {
  const action = e.parameter.action;
  let result;
  
  try {
    switch (action) {
      case 'readTransactions':
        result = readTransactions();
        break;
      case 'readCategories':
        result = readCategories();
        break;
      case 'readSettings':
        result = readSettings();
        break;
      case 'getSummary':
        result = getMonthlySummary();
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.toString() };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web App POST 入口
 */
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Invalid JSON: ' + err }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  let result;
  try {
    switch (data.action || data._action) {
      case 'addTransaction':
        result = addTransaction(data);
        break;
      case 'updateTransaction':
        result = updateTransaction(data);
        break;
      case 'deleteTransaction':
        result = deleteTransaction(data);
        break;
      case 'addCategory':
        result = addCategory(data);
        break;
      default:
        result = { error: 'Unknown action: ' + data.action };
    }
  } catch (err) {
    result = { error: err.toString() };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * 讀取所有交易
 * 返回格式：[{"日期":"2026-04-01","類別":"🍜 餐廳","金額":150,"商戶":"太古廣場","備註":"午餐","銀行":"SCB","圖片URL":"","狀態":"confirmed"}, ...]
 */
function readTransactions() {
  const sheet = getSheet('Transactions');
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return [];
  
  const range = sheet.getRange(2, 1, lastRow - 1, 8);
  const values = range.getValues();
  
  return values.map(row => ({
    '日期': formatDate(row[0]),
    '類別': String(row[1] || ''),
    '金額': parseFloat(row[2]) || 0,
    '商戶': String(row[3] || ''),
    '備註': String(row[4] || ''),
    '銀行': String(row[5] || ''),
    '圖片URL': String(row[6] || ''),
    '狀態': String(row[7] || 'confirmed')
  }));
}

/**
 * 讀取所有類別
 */
function readCategories() {
  const sheet = getSheet('Categories');
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return [];
  
  const range = sheet.getRange(2, 1, lastRow - 1, 4);
  const values = range.getValues();
  
  return values.map(row => ({
    '類別': String(row[0] || ''),
    'Emoji': String(row[1] || ''),
    '顏色': String(row[2] || '#ADB5BD'),
    '類型': String(row[3] || '支出')
  }));
}

/**
 * 讀取設定
 */
function readSettings() {
  const sheet = getSheet('Settings');
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return {};
  
  const range = sheet.getRange(2, 1, lastRow - 1, 2);
  const values = range.getValues();
  
  const settings = {};
  values.forEach(row => {
    if (String(row[0]).trim()) {
      settings[String(row[0])] = String(row[1] || '');
    }
  });
  return settings;
}

/**
 * 每月摘要
 */
function getMonthlySummary() {
  const txs = readTransactions();
  const months = {};
  
  txs.forEach(tx => {
    if (!tx.日期 || tx.狀態 === 'deleted') return;
    const month = tx.日期.substring(0, 7); // "2026-04"
    if (!months[month]) months[month] = { expense: 0, income: 0, count: 0, categories: {} };
    
    const amt = parseFloat(tx.金額) || 0;
    if (tx.狀態 === 'income') {
      months[month].income += amt;
    } else {
      months[month].expense += amt;
      const cat = tx.類別 || '其他';
      months[month].categories[cat] = (months[month].categories[cat] || 0) + amt;
    }
    months[month].count++;
  });
  
  return months;
}

// ============================================================
// WRITE OPERATIONS
// ============================================================

/**
 * 新增交易
 */
function addTransaction(tx) {
  const sheet = getSheet('Transactions');
  const nextRow = sheet.getLastRow() + 1;
  
  sheet.getRange(nextRow, 1, 1, 8).setValues([[
    tx.日期,
    tx.類別,
    tx.金額,
    tx.商戶,
    tx.備註 || '',
    tx.銀行 || '',
    tx.圖片URL || '',
    tx.狀態 || 'confirmed'
  ]]);
  
  // Update monthly summary
  updateMonthlySummary(tx.日期.substring(0, 7));
  
  return { success: true, row: nextRow };
}

/**
 * 更新交易
 */
function updateTransaction(data) {
  const index = parseInt(data.index);
  const sheet = getSheet('Transactions');
  const row = index + 2; // +2 because row 1 is header, data starts at row 2
  
  sheet.getRange(row, 1, 1, 8).setValues([[
    data.日期,
    data.類別,
    data.金額,
    data.商戶,
    data.備註 || '',
    data.銀行 || '',
    data.圖片URL || '',
    data.狀態 || 'confirmed'
  ]]);
  
  return { success: true };
}

/**
 * 刪除交易（軟刪除）
 */
function deleteTransaction(data) {
  const index = parseInt(data.index);
  const sheet = getSheet('Transactions');
  const row = index + 2;
  
  sheet.getRange(row, 8).setValue('deleted'); // 軟刪除
  return { success: true };
}

/**
 * 新增類別
 */
function addCategory(cat) {
  const sheet = getSheet('Categories');
  const nextRow = sheet.getLastRow() + 1;
  
  sheet.getRange(nextRow, 1, 1, 4).setValues([[
    cat.類別,
    cat.Emoji || cat.類別.substring(0, 2),
    cat.顏色 || '#ADB5BD',
    cat.類型 || '支出'
  ]]);
  
  return { success: true, row: nextRow };
}

// ============================================================
// MONTHLY SUMMARY
// ============================================================

function updateMonthlySummary(month) {
  const sheet = getSheet('MonthlySummary');
  const txs = readTransactions().filter(tx => tx.日期 && tx.日期.startsWith(month) && tx.狀態 !== 'deleted');
  
  const totalExpense = txs.filter(tx => tx.狀態 !== 'income').reduce((s, tx) => s + parseFloat(tx.金額 || 0), 0);
  const totalIncome = txs.filter(tx => tx.狀態 === 'income').reduce((s, tx) => s + parseFloat(tx.金額 || 0), 0);
  const count = txs.length;
  
  // Find top category
  const catTotals = {};
  txs.filter(tx => tx.狀態 !== 'income').forEach(tx => {
    const cat = tx.類別 || '其他';
    catTotals[cat] = (catTotals[cat] || 0) + parseFloat(tx.金額 || 0);
  });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  
  // Find or create row for this month
  const lastRow = sheet.getLastRow();
  let monthRow = -1;
  
  if (lastRow >= 2) {
    const months = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < months.length; i++) {
      if (String(months[i][0]) === month) {
        monthRow = i + 2;
        break;
      }
    }
  }
  
  const rowData = [month, totalExpense, totalIncome, totalIncome - totalExpense, topCat[0], count];
  
  if (monthRow > 0) {
    sheet.getRange(monthRow, 1, 1, 6).setValues([rowData]);
  } else {
    sheet.getRange(lastRow + 1, 1, 1, 6).setValues([rowData]);
  }
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date.substring(0, 10);
  // Use Hong Kong timezone to avoid off-by-one day errors
  const d = new Date(date);
  const tz = Session.getScriptTimeZone();
  const formatted = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
  return formatted;
}
