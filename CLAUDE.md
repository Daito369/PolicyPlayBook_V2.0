# PolicyPlayBook V2.0 - Claude AI ガイド

## プロジェクト概要

PolicyPlayBook V2.0は、Google Apps Script（GAS）で構築された、**Google広告ポリシー対応メール自動生成システム**です。このアプリケーションは、Google Sheetsをデータベースとして使用し、HTMLベースのWebアプリケーションとして動作します。

### 主要な特徴

- **テンプレートベースのメール生成**: 130以上のテンプレートに対応
- **リアルタイムプレビュー**: 入力と同時にメールプレビューを表示
- **高度なバリデーション**: ECID、日付、必須項目の検証
- **Material Design 3 UI**: 最新のGoogleデザインシステムを採用
- **完全無料**: Google Workspaceの無料枠内で動作
- **ダークモード対応**: ライト/ダークモードの切り替え
- **レスポンシブデザイン**: デスクトップ/タブレット/モバイル対応

### 技術スタック

**バックエンド:**
- Google Apps Script（V8 Runtime - ES2015対応）
- Google Sheets（データベース）
- PropertiesService（キャッシュ & 設定管理）

**フロントエンド:**
- HTML5 + CSS3
- Bootstrap 5.3.3
- Material Design 3 Design System
- Vanilla JavaScript（ES6+）
- Font Awesome 6.5.1

## プロジェクト構造

```
PolicyPlayBook_V2.0/
├── PlayBook/
│   ├── Code.js                 # メインコントローラー（doGet/doPost）
│   ├── Templates.js            # テンプレートエンジン（変数置換・条件分岐）
│   ├── Database.js             # Google Sheetsデータベースサービス
│   ├── Utils.js                # ユーティリティ関数（日付・バリデーション・ログ）
│   ├── setup-automation.js     # 自動セットアップスクリプト
│   ├── index.html              # メインUIテンプレート
│   ├── script.html             # フロントエンドロジック（JavaScript）
│   ├── style.html              # Material Design 3スタイル（CSS）
│   ├── appsscript.json         # GAS設定ファイル
│   └── .clasp.json             # Clasp設定ファイル
├── CLAUDE.md                   # このファイル
├── AGENTS.md                   # Agent別の専門知識（作成予定）
├── ARCHITECTURE.md             # アーキテクチャドキュメント（作成予定）
├── TECHNICAL_SPECS.md          # 技術仕様書（作成予定）
└── API.md                      # API仕様書（作成予定）
```

## アーキテクチャ概要

### 3層アーキテクチャ

```
┌────────────────────────────────────────┐
│     Presentation Layer (UI)            │
│  ┌──────────────────────────────────┐  │
│  │  index.html + script.html        │  │
│  │  - Material Design 3 UI          │  │
│  │  - ライブプレビュー              │  │
│  │  - 4ステップウィザード           │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
              ↕ (google.script.run)
┌────────────────────────────────────────┐
│   Business Logic Layer (GAS)           │
│  ┌──────────────────────────────────┐  │
│  │  Code.js (Controller)            │  │
│  │  - doGet/doPost endpoints        │  │
│  │  - エラーハンドリング            │  │
│  │  ├─ Templates.js (Engine)        │  │
│  │  │  - 変数置換・条件分岐        │  │
│  │  │  - テンプレート処理          │  │
│  │  └─ Utils.js (Utilities)         │  │
│  │     - 日付処理・バリデーション  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
              ↕ (SpreadsheetApp API)
┌────────────────────────────────────────┐
│      Data Layer (Google Sheets)        │
│  ┌──────────────────────────────────┐  │
│  │  Database.js (Service)           │  │
│  │  ├─ Templates Sheet              │  │
│  │  ├─ Variables Sheet              │  │
│  │  ├─ Options Sheet                │  │
│  │  └─ Footers Sheet                │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

## コアモジュール詳細

### 1. Code.js - メインコントローラー

**役割**: Webアプリケーションのエントリーポイントとして、すべてのHTTPリクエストを処理します。

**主要な関数:**

```javascript
// HTMLサービスのエントリーポイント
function doGet()
// - アプリケーション初期化
// - スプレッドシート接続確認
// - 初期データ取得
// - エラーページ生成（接続失敗時）

// APIエンドポイント（POSTリクエスト処理）
function doPost(e)
// サポートするアクション:
// - getTemplates: カテゴリ別テンプレート取得
// - getVariables: テンプレート別変数取得
// - getOptions: 変数別オプション取得
// - getTemplateContent: テンプレートコンテンツ取得
// - generateEmail: メール生成
// - getTemplateCategories: カテゴリ一覧取得
// - validateTemplate: テンプレートバリデーション
// - getSystemStatus: システムステータス取得

// ユーティリティ関数
function include(filename)         // HTMLファイルのインクルード
function getInitialData()          // 初期データ取得（キャッシュ対応）
function getConfig(key)            // 設定値取得
```

**セキュリティ機能:**
- `PropertiesService`によるSPREADSHEET_IDの安全な管理
- フォールバックメカニズム（初回セットアップ時のみ）
- 詳細なエラーログとユーザーフレンドリーなエラーページ

### 2. Templates.js - テンプレートエンジン

**役割**: テンプレートの解析、変数置換、条件分岐、ループ処理を実行します。

**主要なクラス:**

```javascript
class TemplateEngine {
  // メイン生成関数
  generate(templateId, variables)

  // 変数処理
  preprocessVariables(variables)     // ECID, status, footer等の前処理
  validateVariables(template, vars)  // 必須変数・フォーマット検証

  // テンプレート処理
  processTemplate(content, vars)     // メインの処理パイプライン
  replaceBasicVariables(content)     // {{variableName}} 置換
  processConditionals(content)       // {{if}}...{{endif}} 処理
  processLoops(content)              // {{for}}...{{endfor}} 処理
  processFunctions(content)          // {{formatDate()}} 等の関数呼び出し
  processLinks(content)              // [text](url) → リンク変換

  // 後処理
  postProcessContent(content)        // 空行整理、トリミング
}
```

**サポートする構文:**

```
基本変数:        {{variableName}}
条件分岐:        {{if status == "制限付き"}}...{{endif}}
存在チェック:    {{if variableName}}...{{endif}}
ループ:          {{for item in list}}...{{endfor}}
関数呼び出し:    {{formatDate(replyDate)}}, {{formatECID(ecid)}}
リンク:          [テキスト](https://example.com)
特殊変数:        {{today}}, {{nextBusinessDay}}, {{version}}
```

**変数前処理の例:**

```javascript
// ECID: 1234567890 → 123-456-7890
formattedECID = formatECID(ecid)

// status: 0 → "制限付き", 1 → "不承認"
statusText = statusMap[status]

// footer: true → アクティブなフッター内容を挿入
footer = getActiveFooter().content

// disclaimer: true → Optionsシートから免責事項内容を挿入、false → 空文字
disclaimer = getOptionsByVariable('disclaimer').find(opt => opt.value === 'TRUE').label

// replyDate: null → 次の営業日を自動計算
formattedReplyDate = getNextBusinessDay()
```

### 3. Database.js - データベースサービス

**役割**: Google Sheetsとのデータ連携、キャッシュ管理、CRUD操作を提供します。

**主要なクラス:**

```javascript
class DatabaseService {
  // 初期化
  initializeConnection()             // スプレッドシート接続・シート確認

  // カテゴリ & テンプレート
  getTemplateCategories()            // カテゴリ一覧取得（キャッシュ30分）
  getTemplatesByCategory(category)   // カテゴリ別テンプレート（キャッシュ15分）
  getTemplate(templateId)            // テンプレート詳細（キャッシュ60分）

  // 変数 & オプション
  getVariablesByTemplate(id)         // テンプレート別変数（最適化版）
  getOptionsByVariable(varName)      // 変数別オプション

  // フッター
  getActiveFooter()                  // アクティブなフッター取得
  getFooterById(footerId)            // フッターID指定取得

  // CRUD操作
  createTemplate(templateData)       // テンプレート作成
  updateTemplate(id, updates)        // テンプレート更新
  deleteTemplate(id)                 // テンプレート削除（論理削除）

  // キャッシュ管理
  clearTemplateCache()               // テンプレート関連キャッシュクリア

  // ヘルスチェック
  healthCheck()                      // データベース健全性チェック
  getStatistics()                    // 統計情報取得
}
```

**データベーススキーマ:**

**Templates シート:**
```
[template_id, category, subcategory, template_name, template_content,
 required_variables, optional_variables, is_active, created_at,
 updated_at, created_by, notes]
```

**Variables シート:**
```
[variable_name, display_name, variable_type, is_required, default_value,
 validation_rule, placeholder, help_text, sort_order, is_active]
```

**Options シート:**
```
[variable_name, option_value, option_label, sort_order, is_active, condition]
```

**Footers シート:**
```
[footer_id, footer_name, footer_content, is_active, created_at,
 updated_at, notes]
```

**最適化戦略:**
- Set構造による高速検索（O(1)）
- 3段階キャッシュ戦略（10分/15分/30分/60分）
- 選択的キャッシュクリア（onEditトリガー）

### 4. Utils.js - ユーティリティ関数

**役割**: 日付処理、バリデーション、ログ出力、キャッシュ管理などの共通機能を提供します。

**主要な関数カテゴリ:**

**日付処理:**
```javascript
getNextBusinessDay(startDate, addDays)  // 営業日計算（日本の祝日対応）
isBusinessDay(date)                     // 営業日判定
formatJapaneseDate(date, format)        // 日本語日付フォーマット
formatTime(date, includeSeconds)        // 時間フォーマット
```

**バリデーション:**
```javascript
validateEmail(email)                    // メールアドレス検証
validateUrl(url)                        // URL検証
validatePhoneNumber(phone)              // 電話番号検証（日本形式）
validateString(value, pattern)          // 正規表現検証
```

**文字列処理:**
```javascript
formatECID(ecid)                        // ECID フォーマット（123-456-7890）
sanitizeString(text, options)           // 文字列サニタイズ
```

**ログ出力:**
```javascript
logInfo(message, data)                  // 情報ログ
logError(message, error)                // エラーログ（スタックトレース付き）
logWarning(message, data)               // 警告ログ
```

**パフォーマンス測定:**
```javascript
startPerformanceTimer(label)            // 測定開始
endPerformanceTimer(label)              // 測定終了・結果ログ出力
```

**キャッシュサービス:**
```javascript
class CacheService {
  get(key)                              // キャッシュ取得（期限チェック付き）
  set(key, value, expiryMinutes)        // キャッシュ設定
  delete(key)                           // キャッシュ削除
  has(key)                              // キャッシュ存在確認
  clear(pattern)                        // パターンマッチでクリア
  getStats()                            // キャッシュ統計取得
}
```

**祝日リスト（2024-2035年）:**
- 日本の祝日を完全カバー
- 営業日計算に自動適用
- 土日も除外

### 5. setup-automation.js - セットアップスクリプト

**役割**: ワンクリックで完全なシステムセットアップを実行します。

**主要な関数:**

```javascript
autoSetup()                             // メインセットアップ関数
createDatabase()                        // Google Sheets作成
setupTemplatesSheet(spreadsheet)        // Templatesシート設定
setupVariablesSheet(spreadsheet)        // Variablesシート設定
setupOptionsSheet(spreadsheet)          // Optionsシート設定
setupFootersSheet(spreadsheet)          // Footersシート設定
insertInitialData(spreadsheet)          // 初期データ投入
updateSpreadsheetId(spreadsheetId)      // PropertiesServiceに保存
showSetupComplete(spreadsheetId)        // 完了通知表示
```

**セットアップ内容:**
1. 新規スプレッドシート作成（PolicyPlayBook-Database）
2. 4シート作成・フォーマット設定
3. データ検証ルール設定（ドロップダウン等）
4. 初期データ投入（Variables, Options, Footers, Templates）
5. Script PropertiesにSPREADSHEET_ID保存
6. 完了通知（HTMLダイアログ）

## フロントエンド UI/UX

### Material Design 3 デザインシステム

**カラーパレット:**
```css
/* Primary (Google Blue) */
--md-primary: #1A73E8
--md-on-primary: #FFFFFF

/* Tertiary (Google Green) */
--md-tertiary: #34A853

/* Error (Google Red) */
--md-error: #EA4335

/* Surface (Dynamic) */
--md-surface: #FEFBFF (Light) / #121212 (Dark)
```

**タイポグラフィ:**
- Display: Roboto (57px/400)
- Headline: Roboto (28-32px/500)
- Body: Noto Sans JP (14-16px/400)
- Label: Roboto (11-14px/500)

**シェイプシステム:**
- Extra Small: 4px
- Small: 8px
- Medium: 12px
- Large: 16px
- Extra Large: 28px
- Full: 9999px (円形)

### 4ステップウィザード

```
1. カテゴリ選択
   ↓
2. テンプレート選択（テンプレート検索機能付き）
   ↓
3. 入力（動的フォーム生成）
   ↓
4. セルフレビュー・コピー（ライブプレビュー）
```

**ステップインジケーター:**
- Sticky positioning（navbarに追従）
- アクティブステップのハイライト
- 完了ステップのチェックマーク

### ライブプレビュー機能

**リアルタイム処理:**
1. フォーム入力変更イベント（input/change）
2. 変数オブジェクト構築
3. `generateEmail` API呼び出し
4. プレビューエリア更新（debounce 300ms）

**変数ハイライト:**
```css
.variable-filled {
  /* 緑色ハイライト（入力済み変数） */
  background-color: var(--md-tertiary-container);
}

.variable-placeholder {
  /* 赤色ハイライト（未入力必須変数） */
  background-color: var(--md-error-container);
  border: 1px dashed var(--md-error);
}
```

## キャッシュ戦略

### 3段階キャッシュシステム

**Level 1: Script Cache（短期 - 10分）**
```javascript
cache_sheet_data_templates   // Sheetsの生データ
cache_sheet_data_variables
cache_sheet_data_options
cache_sheet_data_footers
```

**Level 2: Medium Cache（中期 - 15-30分）**
```javascript
cache_template_categories         // カテゴリ一覧（30分）
cache_templates_by_category_X     // カテゴリ別テンプレート（15分）
cache_variables_by_template_X     // テンプレート別変数（30分）
cache_options_by_variable_X       // 変数別オプション（30分）
cache_active_footer               // アクティブフッター（30分）
```

**Level 3: Long Cache（長期 - 60分）**
```javascript
cache_template_X                  // テンプレート詳細
cache_footer_X                    // フッター詳細
cache_initial_data                // 初期データ
```

### 自動キャッシュクリア

**onEditトリガー（選択的削除）:**
```javascript
function onEdit(e) {
  // 編集されたシートと行を検出
  // 関連キャッシュのみを選択的に削除

  // 例: Templatesシート行2のtemplate_idが編集された場合
  // → cache_template_{id}, cache_templates_by_category_{cat} をクリア
}
```

## エラーハンドリング

### 多層防御戦略

**Layer 1: フロントエンドバリデーション**
```javascript
// 必須項目チェック
// フォーマット検証（ECID, 日付等）
// リアルタイムフィードバック
```

**Layer 2: サーバーサイドバリデーション**
```javascript
validateVariables(template, variables)
// - 必須変数チェック
// - ECID フォーマット検証（10桁）
// - 日付妥当性チェック
// - 文字列長制限（10000文字）
```

**Layer 3: try-catch ブロック**
```javascript
// すべての主要関数にtry-catchを実装
// 詳細なエラーログ（logError）
// ユーザーフレンドリーなエラーメッセージ
```

**Layer 4: フォールバックメカニズム**
```javascript
// キャッシュ取得失敗 → データベースから再取得
// データベース接続失敗 → エラーページ表示
// テンプレート取得失敗 → デフォルト値使用
```

## パフォーマンス最適化

### バックエンド最適化

**1. Set構造による高速検索**
```javascript
// O(n²) → O(n) に改善
const varSet = new Set(allVars);
for (let i = 1; i < data.length; i++) {
  if (varSet.has(data[i][0])) {  // O(1)
    // 処理
  }
}
```

**2. バッチ操作**
```javascript
// ✗ 悪い例: ループで個別取得
for (let i = 0; i < 100; i++) {
  sheet.getRange(i, 1).getValue();  // 100回API呼び出し
}

// ✓ 良い例: 一括取得
const data = sheet.getRange(1, 1, 100, 1).getValues();  // 1回API呼び出し
```

**3. 選択的キャッシュクリア**
```javascript
// 全キャッシュクリア（遅い）✗
clearAllCache();

// 関連キャッシュのみクリア（速い）✓
cache.remove(`cache_template_${templateId}`);
cache.remove(`cache_templates_by_category_${category}`);
```

### フロントエンド最適化

**1. Debounce（入力遅延）**
```javascript
// 300msの遅延でAPIコール頻度を削減
const debouncedUpdate = debounce(updatePreview, 300);
```

**2. Lazy Loading**
```javascript
// 初期表示時は最小限のデータのみ読み込み
// テンプレート選択後に変数を動的読み込み
```

**3. Sticky Positioning**
```javascript
// CSSのposition: stickyを使用
// JavaScriptによるスクロール計算を回避
```

## セキュリティ対策

### 1. 認証・認可

```javascript
// GAS Web App設定
executeAs: "USER_DEPLOYING"     // デプロイユーザーとして実行
access: "DOMAIN"                // 同一ドメインのみアクセス可能
```

### 2. 機密情報の保護

```javascript
// ✗ 悪い例: ハードコーディング
const SPREADSHEET_ID = '1Eo_piCwA517O7j_rgNLQ-j08nhKTaPcy0Qcgh57n2sk';

// ✓ 良い例: PropertiesServiceで管理
const scriptProps = PropertiesService.getScriptProperties();
const SPREADSHEET_ID = scriptProps.getProperty('SPREADSHEET_ID');
```

### 3. 入力サニタイゼーション

```javascript
sanitizeString(text, {
  removeHtml: true,          // HTMLタグ除去
  removeControlChars: true,  // 制御文字除去
  trim: true,                // 前後空白除去
  maxLength: 10000           // 長さ制限
});
```

### 4. XSS対策

```javascript
// HTMLエスケープ（必要に応じて）
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

## テスト戦略

### デバッグ関数

```javascript
// テンプレート直接データ確認
debugDirectTemplateData(templateId)

// 変数リスト確認
debugTemplateVariables(templateId)

// 手動キャッシュクリア
clearAllCacheManually()

// ヘルスチェック
healthCheck()
```

### 個別テスト関数

```javascript
testCreateDatabase()         // データベース作成テスト
testTemplatesSheet()         // Templatesシートテスト
testVariablesSheet()         // Variablesシートテスト
testOptionsSheet()           // Optionsシートテスト
testInitialData()            // 初期データテスト
```

## デプロイメント

### 1. 初回セットアップ

```javascript
// Google Apps Script エディターで実行
autoSetup();
```

### 2. Web App デプロイ

1. 右上「デプロイ」→「新しいデプロイ」
2. 種類: ウェブアプリ
3. 説明: PolicyPlayBook v1.0
4. 実行ユーザー: 自分
5. アクセス権限: すべてのユーザー（組織内）
6. デプロイ

### 3. Clasp（CLI）デプロイ

```bash
clasp login
clasp push
clasp deploy --description "PolicyPlayBook v1.0"
```

## トラブルシューティング

### よくある問題と解決方法

**1. スプレッドシート接続エラー**
```
原因: SPREADSHEET_IDが設定されていない
解決: setup-automation.js の autoSetup() を実行
```

**2. テンプレートが表示されない**
```
原因: キャッシュが古い、またはis_activeがfalse
解決: clearAllCacheManually() を実行、is_activeをtrueに設定
```

**3. メール生成エラー**
```
原因: 必須変数が未入力、またはフォーマット不正
解決: 赤色ハイライトの変数を確認、フォーマットを修正
```

**4. ライブプレビューが更新されない**
```
原因: JavaScriptエラー、またはAPI呼び出し失敗
解決: ブラウザのコンソールでエラー確認、ページリロード
```

## ベストプラクティス

### コーディング規約

**JavaScript:**
```javascript
// camelCase for variables and functions
const templateId = 'review_approved';
function getTemplatesByCategory(category) { }

// PascalCase for classes
class TemplateEngine { }

// UPPER_SNAKE_CASE for constants
const SPREADSHEET_ID = '...';

// JSDoc comments for all functions
/**
 * テンプレートからメール生成
 * @param {string} templateId - テンプレートID
 * @param {Object} variables - 変数オブジェクト
 * @return {Object} 生成結果
 */
```

**CSS:**
```css
/* kebab-case for class names */
.email-preview { }
.search-result-item { }

/* BEM naming for complex components */
.step__circle { }
.step__label { }
```

### データベース設計

**1. 正規化**
```
Templates (1) ──< (N) Variables (through required_variables JSON)
Variables (1) ──< (N) Options
```

**2. インデックス最適化**
```
- template_id: 主キー（一意）
- category: 高頻度検索
- is_active: フィルタリング条件
```

**3. データ整合性**
```
- required_variables: JSON配列（検証済み）
- optional_variables: JSON配列（検証済み）
- is_active: Boolean（データ検証ルール設定）
```

## 拡張性

### 新しいテンプレート追加

1. Templatesシートに新しい行を追加
2. required_variables/optional_variablesをJSON配列で指定
3. 必要に応じてVariables/Optionsシートに変数定義を追加

### 新しい変数タイプ追加

1. Variablesシートでvariable_typeに新しいタイプを追加
2. フロントエンドのフォーム生成ロジックに対応コードを追加
3. 必要に応じてバリデーションロジックを追加

### 新しい関数追加

1. Templates.jsのprocessFunctions()に新しい正規表現と処理を追加
2. 対応する実装関数を追加

## パフォーマンス指標

### 目標値

- 初期ロード: < 2秒
- テンプレート選択: < 500ms
- ライブプレビュー更新: < 300ms（debounce後）
- メール生成: < 1秒

### モニタリング

```javascript
// パフォーマンス測定
startPerformanceTimer('email_generation');
const result = generateEmail(templateId, variables);
const duration = endPerformanceTimer('email_generation');
// ログ出力: "Performance timer ended: email_generation - 234ms"
```

## 今後の拡張計画

### Phase 2.1（短期）
- [ ] テンプレート検索機能の強化（全文検索）
- [ ] お気に入りテンプレート機能
- [ ] 最近使用したテンプレート履歴

### Phase 2.2（中期）
- [ ] テンプレートバージョン管理
- [ ] 変数のプリセット機能
- [ ] エクスポート/インポート機能（JSON）

### Phase 3.0（長期）
- [ ] マルチユーザー対応
- [ ] 承認ワークフロー
- [ ] メール送信機能（GmailApp連携）
- [ ] テンプレート使用統計・分析

## リファレンス

### 公式ドキュメント
- [Google Apps Script Reference](https://developers.google.com/apps-script/reference)
- [HTML Service Guide](https://developers.google.com/apps-script/guides/html)
- [Spreadsheet Service](https://developers.google.com/apps-script/reference/spreadsheet)
- [Properties Service](https://developers.google.com/apps-script/reference/properties)

### Material Design 3
- [Material Design 3 Guidelines](https://m3.material.io/)
- [Color System](https://m3.material.io/styles/color/overview)
- [Typography Scale](https://m3.material.io/styles/typography/overview)

### ベストプラクティス
- [Apps Script Best Practices](https://developers.google.com/apps-script/guides/support/best-practices)
- [V8 Runtime Guide](https://developers.google.com/apps-script/guides/v8-runtime)

---

**最終更新日**: 2025-11-10
**バージョン**: 2.0.0
**メンテナ**: PolicyPlayBook Team
