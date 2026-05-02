# Peter 記帳 App

手機優先嘅記帳 App，數據存在 Google Sheets，我（小小）幫你分析銀行月結單。

## 功能

- ✅ 每日收支記錄（帶日期/分類/備註）
- ✅ 圖表分析（圓餅圖 + 柱狀圖）
- ✅ 月/年總結
- ✅ 預算追蹤（預算用曬會紅色警示）
- ✅ 類別管理（18個預設類別）
- ✅ 搜索 + 篩選
- ✅ 自動更新（30秒自動refresh）
- ✅ 編輯/刪除交易
- ✅ 數據匯出 CSV
- ✅ 手機優先介面

## 安裝步驟

### 第一步：部署 Google Apps Script（後端）

1. 打開 Google Sheets：
   https://docs.google.com/spreadsheets/d/1pJNf-WTSoz1-ftW7rTBDOTNTNKSwOgm6mTnorXH8F1c

2. 點擊 **工具** → **指令碼編輯器**

3. 刪除所有現有代碼

4. 開檔 `google-apps-script.js`，複製全部內容，粘貼到指令碼編輯器

5. 點擊 **儲存** (Ctrl+S)

6. 點擊 **部署** → **新增部署**：
   - 類型：🌐 **網頁應用程式**
   - 說明：`Peter 記帳 API`
   - 執行身份：👤 **身為本人**
   - 可存取身份：🌍 **任何人**

7. 點擊 **部署**，複製 **網頁應用程式 URL**

### 第二步：設定 Web App

1. 開檔 `index.html`

2. 找到這一行：
   ```javascript
   const CONFIG = {
     SCRIPT_URL: '', // <-- 這裏
   ```

3. 把 URL 粘貼進去，例如：
   ```javascript
   const CONFIG = {
     SCRIPT_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
   ```

4. 儲存

### 第三步：放到 GitHub Pages（免費托管）

1. 登入 GitHub：https://github.com

2. 點擊右上角 **+** → **New repository**
   - Name: `peter-expense-app`
   - Private 或 Public 都得

3. 上傳 `index.html`：
   - 點擊 **uploading an existing file**
   - 把 `index.html` 拖進去
   - 點擊 **Commit changes**

4. 開啟 GitHub Pages：
   - 點擊 Settings → Pages
   - Source: **Deploy from a branch**
   - Branch: **main**, folder: **/ (root)**
   - 點擊 **Save**

5. 等 1-2 分鐘，你的 App 就會上綫：
   `https://你的用戶名.github.io/peter-expense-app/`

### 第四步：匯入舊有交易（可選）

我（小助手）已經有你之前嘅 58 筆記錄。

如果你想匯入，喺 Telegram 叫我，我就幫你搞掂。

## 使用方式

1. 你喺 Telegram send 銀行截圖俾我
2. 我幫你 OCR 分析 + 分類
3. 我直接寫入 Google Sheets
4. 你打開 Web App → 自動睇到更新

## 技術架構

```
Telegram（你） → 小小（OCR分析） → Google Sheets
                                         ↓
                              Google Apps Script (後端)
                                         ↓
                              Web App（你部電話）
```

## 文件結構

```
hermes-expense-app/
├── index.html          # 主 App（前端）
├── google-apps-script.js  # 後端代碼
└── README.md          # 呢個說明
```

## 常见问题

**Q: App 顯示 "請先設定 Google Apps Script URL"**
A: 你仲未完成第一步部署。跟住上面步驟做。

**Q: 數據係咪安全？**
A: 係，全部數據喺你嘅 Google Drive，只有你有權限。

**Q: 要幾多錢？**
A: 完全免費。GitHub Pages 免費，Google Apps Script 免費。
