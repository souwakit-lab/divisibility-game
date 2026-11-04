# 金榜學堂雲端同步

前端發布在 GitHub Pages，後端沿用課堂遊戲的 Google Apps Script 和試算表。

- 正式入口：https://souwakit-lab.github.io/divisibility-game/jinbang/
- Google 資料表使用獨立的「金榜學堂資料」工作表，無須 GitHub Token。
- 密碼在 Apps Script 伺服器驗證；登入憑證由伺服器簽署，最多有效 30 天。
- 勾選「保持登入」後儲存在此瀏覽器；新瀏覽器輸入教師密碼即可載入同一份資料。
- 每次操作先保存在本機，再自動補傳；開啟頁面時每 15 秒讀取其他裝置的更新。
- 同時記分以紀錄 ID 合併，重傳不重複加分；撤銷紀錄保留刪除標記，避免舊裝置重新上傳。
- 清空及還原是整份資料替換，必須符合雲端版本；衝突時保留本機資料並提示先匯出備份。

## 後端維護

將 `../apps-script/Jinbang.gs` 加入既有 Apps Script 專案。原 `doPost(e)` 已持有 script lock，在其 `try` 最前方加入以下路由，其餘遊戲路由保留：

```js
if (String(e.parameter.action || '').startsWith('jinbang')) return jsonResponse(jinbangRoute_(e));
```

更新前端 API_URL 所指向的既有網頁應用程式部署版本。保留原執行身分及存取設定。

可使用 Apps Script 的 `JINBANG_PASSWORD_SHA256` 指令碼屬性指定新的密碼 SHA-256；不要把明文密碼或簽署密鑰加入公開前端。`JINBANG_SESSION_SECRET` 首次登入時自動產生；更換後現有登入憑證會失效。

資料以分段 JSON 與版本一起寫入工作表。請使用網頁上的 JSON 匯出及還原功能維護，不要手動編輯資料片段。JSON 備份包含學生姓名及積分，應由教師妥善保存。

```sh
node tests/jinbang-cloud.cjs
node tests/gem-sync.cjs
node tests/gem-dashboard.cjs
```
