# 整除性：數字守城戰

學生答題頁與教師大屏，內容分為三個程度：

- 程度一：判斷能否被 2、5、10（隨機一種）整除
- 程度二：判斷能否被 3 整除
- 程度三：同時判斷能否被 2、5、10、3 整除

## 頁面

- `index.html`：學生答題
- `dashboard.html`：教師大屏

資料透過 `apps-script/Code.gs` 寫入獨立的 Google Sheet。若 `config.js` 尚未填入 Apps Script 網址，網站會使用瀏覽器本機資料，方便預覽。
