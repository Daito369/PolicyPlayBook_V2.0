# PolicyPlayBook V2.0 - 技術仕様書

## 目次
1. [システム要件](#システム要件)
2. [技術スタック詳細](#技術スタック詳細)
3. [データベーススキーマ](#データベーススキーマ)
4. [テンプレートエンジン仕様](#テンプレートエンジン仕様)
5. [バリデーション仕様](#バリデーション仕様)
6. [パフォーマンス仕様](#パフォーマンス仕様)
7. [セキュリティ仕様](#セキュリティ仕様)
8. [エラーハンドリング仕様](#エラーハンドリング仕様)

---

## システム要件

### ブラウザ要件

**サポートブラウザ:**
- Google Chrome 90+ (推奨)
- Microsoft Edge 90+
- Firefox 88+
- Safari 14+

**必須機能:**
- JavaScript有効
- Cookies有効
- LocalStorage有効（設定保存用）

**推奨解像度:**
- デスクトップ: 1366x768以上
- タブレット: 768x1024以上
- モバイル: 375x667以上

### サーバー要件

**Google Apps Script:**
- V8 Runtime必須
- タイムゾーン: Asia/Tokyo
- 実行時間制限: 6分/実行
- メモリ制限: 制限なし（実質的）

**Google Sheets:**
- 最大セル数: 500万セル
- 最大シート数: 200シート
- 推奨データ量: 10,000行以下/シート

**PropertiesService:**
- 最大ストレージ: 500KB
- 最大プロパティ数: 無制限（実質的）

---

## 技術スタック詳細

### バックエンド

#### Google Apps Script V8 Runtime

**言語仕様:**
```javascript
// ECMAScript 2015 (ES6) サポート
- Arrow Functions: ✓
- Classes: ✓
- Template Literals: ✓
- Destructuring: ✓
- Spread Operator: ✓
- Default Parameters: ✓
- Promises: ✓
- Async/Await: ✗ (未サポート)
- Modules (import/export): ✗ (未サポート)
```

**使用可能なGlobal Objects:**
```javascript
// Google Apps Script Services
- SpreadsheetApp
- HtmlService
- PropertiesService
- CacheService (注: PropertiesServiceで代替実装)
- Utilities
- Session
- Logger
- console

// Standard JavaScript Objects
- Object, Array, String, Number, Boolean, Date, Math, JSON
- Set, Map (ES6)
- Promise (ES6)
```

**制約事項:**
- `eval()` 使用不可
- `Function()` コンストラクタ使用不可
- 外部ライブラリのロードは限定的
- DOM API使用不可（サーバーサイド）

#### データベース: Google Sheets

**SpreadsheetApp API:**
```javascript
// 主要なメソッド
SpreadsheetApp.openById(id)                  // スプレッドシート取得
spreadsheet.getSheetByName(name)              // シート取得
sheet.getDataRange()                          // データ範囲取得
sheet.getRange(row, col, numRows, numCols)   // 範囲取得
range.getValues()                             // 値の一括取得
range.setValues(values)                       // 値の一括設定

// パフォーマンス特性
getRange().getValue()      // 遅い: 個別API呼び出し
getRange().getValues()     // 速い: バッチ取得（推奨）

// クォータ制限
- Read/Write operations: 無制限（実質的）
- API呼び出し頻度: 推奨100回/分以下
```

### フロントエンド

#### HTML5

**使用機能:**
```html
<!-- Semantic HTML -->
<nav>, <header>, <main>, <section>, <article>, <footer>

<!-- Form Elements -->
<input type="text|email|tel|number|date|datetime-local|checkbox|radio|range">
<select>, <textarea>, <button>

<!-- Attributes -->
required, placeholder, pattern, min, max, step
data-* (Custom Data Attributes)
aria-* (Accessibility Attributes)
```

#### CSS3

**使用機能:**
```css
/* Layout */
- Flexbox: display: flex
- Grid: 使用なし（Flexboxで十分）
- Position: sticky (Step Indicator用)

/* Animations */
- transition: all 300ms cubic-bezier(...)
- animation: @keyframes
- transform: translate, scale, rotate

/* Responsive */
- Media Queries: @media (max-width: ...)
- Viewport Units: vw, vh, vmin, vmax

/* Modern CSS */
- Custom Properties (CSS Variables): var(--md-primary)
- calc(): calc(100vh - 160px)
- Filters: blur(), brightness()
```

**Material Design 3 カラーシステム:**
```css
:root {
  /* Dynamic Color Tokens */
  --md-primary: #1A73E8;
  --md-on-primary: #FFFFFF;
  --md-primary-container: #D3E3FD;
  --md-on-primary-container: #001C3A;

  /* Surface Tokens */
  --md-surface: #FEFBFF;
  --md-on-surface: #1C1B1F;
  --md-surface-container: #F3EDF7;

  /* State Layers */
  --md-state-layer-opacity-hover: 0.08;
  --md-state-layer-opacity-focus: 0.12;
  --md-state-layer-opacity-pressed: 0.16;
}

/* Dark Theme Override */
[data-bs-theme="dark"], .dark-mode {
  --md-primary: #8AB4F8;
  --md-surface: #121212;
  --md-on-surface: #E3E2E6;
}
```

#### JavaScript (ES6+)

**コーディング規約:**
```javascript
// 1. 変数宣言
const CONSTANT_VALUE = 'immutable';  // 定数: UPPER_SNAKE_CASE
let mutableValue = 0;                 // 変数: camelCase
// var は使用禁止

// 2. 関数定義
function functionName(param1, param2) { }  // 名前付き関数
const arrowFunc = (param) => { };          // アロー関数
// function式は使用禁止

// 3. クラス定義
class ClassName {                    // PascalCase
  constructor() { }
  methodName() { }                   // camelCase
}

// 4. 非同期処理
// google.script.runはコールバックベース
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onFailure)
  .serverFunction(params);

// 5. エラーハンドリング
try {
  // コード
} catch (error) {
  console.error('Error:', error);
  showToast('error', error.message);
}
```

#### Bootstrap 5.3.3

**使用コンポーネント:**
```html
<!-- Layout -->
.container, .row, .col-*

<!-- Utilities -->
.d-*, .flex-*, .justify-*, .align-*
.m-*, .p-*, .mt-*, .mb-*, .ms-*, .me-*
.text-*, .bg-*, .border-*

<!-- Components -->
.card, .card-header, .card-body, .card-footer
.btn, .btn-primary, .btn-secondary
.form-control, .form-select, .form-label
.modal, .toast, .alert

<!-- NOT USED (Material Design 3で代替) -->
.btn-outline-* (カスタム実装)
.badge (カスタム実装)
.accordion (カスタム実装)
```

---

## データベーススキーマ

### Templates シート

**カラム定義:**

| 列 | カラム名 | データ型 | 制約 | 説明 |
|---|---|---|---|---|
| A | template_id | String | PRIMARY KEY, NOT NULL, UNIQUE | テンプレート一意識別子 |
| B | category | String | NOT NULL, INDEX | カテゴリ名（例: "再審査"） |
| C | subcategory | String | NOT NULL | サブカテゴリ名（例: "承認済み（誤審）"） |
| D | template_name | String | NOT NULL | テンプレート表示名 |
| E | template_content | Text | NOT NULL | テンプレート本文（最大100KB） |
| F | required_variables | JSON Array | NOT NULL | 必須変数リスト（例: ["contactName", "myName"]） |
| G | optional_variables | JSON Array | NOT NULL | オプション変数リスト（例: ["footer"]） |
| H | is_active | Boolean | NOT NULL, DEFAULT TRUE | アクティブフラグ |
| I | created_at | DateTime | NOT NULL | 作成日時 |
| J | updated_at | DateTime | NOT NULL | 更新日時 |
| K | created_by | String | | 作成者 |
| L | notes | Text | | 備考 |

**データ検証ルール:**
```javascript
// H列: is_active
Data Validation: List from range
- Values: [TRUE, FALSE]
- Show dropdown: Yes
- Reject invalid: Yes

// F列, G列: JSON配列
Custom Validation (アプリケーション層):
- JSON.parse() でパース可能
- Array.isArray() === true
- 各要素が Variables シートに存在する
```

**インデックス戦略:**
```javascript
// 論理インデックス（アプリケーション層で実装）
Index: template_id (PRIMARY KEY)
  - 検索頻度: 非常に高い
  - ユニーク: Yes
  - 最適化: Map構造でO(1)検索

Index: category
  - 検索頻度: 高い
  - ユニーク: No
  - 最適化: キャッシュ利用

Index: (category, is_active)
  - 検索頻度: 非常に高い
  - ユニーク: No
  - 最適化: 複合キャッシュ
```

### Variables シート

**カラム定義:**

| 列 | カラム名 | データ型 | 制約 | 説明 |
|---|---|---|---|---|
| A | variable_name | String | PRIMARY KEY, NOT NULL, UNIQUE | 変数名（例: "contactName"） |
| B | display_name | String | NOT NULL | 表示名（例: "連絡先名"） |
| C | variable_type | Enum | NOT NULL | 変数タイプ |
| D | is_required | Boolean | NOT NULL | 必須フラグ（テンプレート依存） |
| E | default_value | String | | デフォルト値 |
| F | validation_rule | String | | 検証ルール（正規表現） |
| G | placeholder | String | | プレースホルダーテキスト |
| H | help_text | String | | ヘルプテキスト |
| I | sort_order | Integer | NOT NULL, DEFAULT 999 | 表示順序 |
| J | is_active | Boolean | NOT NULL, DEFAULT TRUE | アクティブフラグ |

**variable_type 列挙型:**
```javascript
enum VariableType {
  'text',              // 単一行テキスト
  'email',             // メールアドレス
  'tel',               // 電話番号
  'number',            // 数値
  'textarea',          // 複数行テキスト
  'select',            // セレクトボックス（Options連携）
  'date',              // 日付
  'datetime-local',    // 日時
  'checkbox',          // チェックボックス
  'radio',             // ラジオボタン（Options連携）
  'range'              // スライダー
}
```

**データ検証ルール:**
```javascript
// C列: variable_type
Data Validation: List from range
- Values: ['text', 'email', 'tel', 'number', 'textarea',
           'select', 'date', 'datetime-local', 'checkbox',
           'radio', 'range']
- Show dropdown: Yes
- Reject invalid: Yes

// D列, J列: Boolean
Data Validation: List from range
- Values: [TRUE, FALSE]
- Show dropdown: Yes
- Reject invalid: Yes

// I列: sort_order
Data Validation: Number
- Min: 0
- Max: 9999
- Allow invalid: No
```

### Options シート

**カラム定義:**

| 列 | カラム名 | データ型 | 制約 | 説明 |
|---|---|---|---|---|
| A | variable_name | String | FOREIGN KEY, NOT NULL | 変数名（Variables.variable_name） |
| B | option_value | String | NOT NULL | オプション値（内部値） |
| C | option_label | String | NOT NULL | オプションラベル（表示値） |
| D | sort_order | Integer | NOT NULL, DEFAULT 999 | 表示順序 |
| E | is_active | Boolean | NOT NULL, DEFAULT TRUE | アクティブフラグ |
| F | condition | String | | 表示条件（JavaScript式） |

**複合主キー:**
```javascript
PRIMARY KEY: (variable_name, option_value)
```

**外部キー制約（論理）:**
```javascript
FOREIGN KEY: variable_name
  REFERENCES Variables(variable_name)
  ON DELETE CASCADE
  ON UPDATE CASCADE
```

### Footers シート

**カラム定義:**

| 列 | カラム名 | データ型 | 制約 | 説明 |
|---|---|---|---|---|
| A | footer_id | String | PRIMARY KEY, NOT NULL, UNIQUE | フッターID |
| B | footer_name | String | NOT NULL | フッター名 |
| C | footer_content | Text | NOT NULL | フッター本文 |
| D | is_active | Boolean | NOT NULL, DEFAULT FALSE | アクティブフラグ（1つのみTRUE） |
| E | created_at | DateTime | NOT NULL | 作成日時 |
| F | updated_at | DateTime | NOT NULL | 更新日時 |
| G | notes | Text | | 備考 |

**ユニーク制約（論理）:**
```javascript
UNIQUE: is_active = TRUE
  - 同時に複数のフッターをアクティブにできない
  - アプリケーション層で検証
```

---

## テンプレートエンジン仕様

### 構文仕様

#### 1. 基本変数置換

**構文:**
```
{{variableName}}
```

**動作:**
- 変数名に対応する値で置換
- 変数が存在しない場合は空文字に置換
- null, undefined の場合は空文字に置換

**例:**
```javascript
// テンプレート
"こんにちは、{{contactName}}様"

// 変数
{ contactName: "田中" }

// 結果
"こんにちは、田中様"
```

#### 2. 条件分岐（比較演算子）

**構文:**
```
{{if variableName operator "value"}}
  ... 真の場合の内容 ...
{{endif}}
```

**サポート演算子:**
- `==`: 等しい
- `!=`: 等しくない
- `>`: より大きい
- `<`: より小さい
- `>=`: 以上
- `<=`: 以下

**例:**
```javascript
// テンプレート
"{{if status == "制限付き"}}
制限付きステータスの処理内容
{{endif}}"

// 変数
{ status: "制限付き" }

// 結果
"制限付きステータスの処理内容"
```

#### 3. 条件分岐（存在チェック）

**構文:**
```
{{if variableName}}
  ... 変数が存在する場合 ...
{{endif}}
```

**動作:**
- 変数が存在し、かつ空でない場合に真
- null, undefined, '', 0, false の場合は偽

**例:**
```javascript
// テンプレート
"{{if footer}}
{{footer}}
{{endif}}"

// 変数（フッターあり）
{ footer: "年末年始のご案内..." }

// 結果
"年末年始のご案内..."
```

#### 4. ループ処理

**構文:**
```
{{for item in listName}}
  ... {{item}} または {{item.property}} ...
{{endfor}}
```

**動作:**
- listName が配列の場合、各要素を繰り返し処理
- item はループ変数（任意の名前）
- オブジェクト配列の場合、プロパティアクセス可能

**例:**
```javascript
// テンプレート
"{{for url in violatingUrls}}
- {{url}}
{{endfor}}"

// 変数
{ violatingUrls: ['example.com', 'test.com'] }

// 結果
"- example.com
- test.com"
```

#### 5. 関数呼び出し

**構文:**
```
{{functionName(variableName)}}
```

**サポート関数:**

**formatDate(variableName):**
```javascript
// 日付を「M月d日」形式にフォーマット
{{formatDate(replyDate)}}
// 例: "11月15日"
```

**formatECID(variableName):**
```javascript
// ECIDを「123-456-7890」形式にフォーマット
{{formatECID(ecid)}}
// 例: "123-456-7890"
```

**upper(variableName):**
```javascript
// 大文字に変換
{{upper(certName)}}
// 例: "CERTIFICATION"
```

**lower(variableName):**
```javascript
// 小文字に変換
{{lower(certName)}}
// 例: "certification"
```

#### 6. リンク処理

**構文:**
```
[リンクテキスト](URL)
```

**動作:**
- Markdown形式のリンクを内部形式に変換
- 最終的にHTMLでレンダリング時にクリック可能なリンクに変換

**例:**
```javascript
// テンプレート
"詳細は[ヘルプページ](https://support.google.com)をご覧ください"

// 結果（内部形式）
"詳細は{{LINK:ヘルプページ::https://support.google.com}}をご覧ください"

// 結果（HTML）
'詳細は<a href="https://support.google.com">ヘルプページ</a>をご覧ください'
```

#### 7. 特殊変数

**システム提供変数:**

```javascript
{{today}}           // 今日の日付（M月d日形式）
{{now}}             // 現在時刻（ISO 8601形式）
{{timestamp}}       // UNIXタイムスタンプ
{{nextBusinessDay}} // 次の営業日（M月d日形式）
{{version}}         // アプリケーションバージョン
{{appName}}         // アプリケーション名
```

### 処理順序

**重要: テンプレート処理は以下の順序で実行されます**

```javascript
1. リンク処理: [text](url) → {{LINK:text::url}}
2. 基本変数置換: {{variableName}} → 値
3. 条件分岐処理: {{if}}...{{endif}}
4. ループ処理: {{for}}...{{endfor}}
5. 関数呼び出し: {{function()}}
6. 特殊変数処理: {{today}}, {{now}}, etc.
7. 後処理: 空行整理、トリミング
```

**処理順序が重要な理由:**
```javascript
// ❌ 誤った順序（条件分岐 → 変数置換）
"{{if status == "{{statusValue}}"}}..."  // statusValueが置換されない

// ✓ 正しい順序（変数置換 → 条件分岐）
"{{if status == "制限付き"}}..."  // 変数は事前に置換済み
```

### パフォーマンス特性

**テンプレート処理時間:**
```javascript
- 小規模テンプレート（<1KB, 変数<10個）: ~50ms
- 中規模テンプレート（1-5KB, 変数10-30個）: ~100ms
- 大規模テンプレート（5-10KB, 変数30+個）: ~200ms

// 条件分岐・ループの影響
- 条件分岐なし: ベースライン
- 条件分岐1-3個: +10-20ms
- ループ処理（10要素）: +30-50ms
```

---

## バリデーション仕様

### クライアント側バリデーション

**実装箇所:** `script.html`

#### 必須項目バリデーション

```javascript
function validateRequiredFields(formData, requiredVars) {
  const missing = [];

  for (const varName of requiredVars) {
    const value = formData[varName];

    // 空値判定
    if (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(`必須項目が未入力です: ${missing.join(', ')}`);
  }
}
```

#### ECID バリデーション

```javascript
function validateECID(ecid) {
  // ハイフンを除去
  const cleaned = ecid.replace(/-/g, '');

  // 10桁の数字チェック
  if (!/^\d{10}$/.test(cleaned)) {
    throw new Error(
      'ECIDは10桁の数字で入力してください（例: 1234567890 または 123-456-7890）'
    );
  }

  return cleaned;
}
```

#### 日付バリデーション

```javascript
function validateDate(dateString) {
  const date = new Date(dateString);

  // 有効な日付チェック
  if (isNaN(date.getTime())) {
    throw new Error('有効な日付を選択してください');
  }

  // 過去日チェック（オプション）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    throw new Error('過去の日付は選択できません');
  }

  return date;
}
```

#### メールアドレスバリデーション

```javascript
function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!pattern.test(email)) {
    throw new Error('有効なメールアドレスを入力してください');
  }

  return email;
}
```

### サーバー側バリデーション

**実装箇所:** `Templates.js` - `TemplateEngine.validateVariables()`

#### 二重バリデーション

```javascript
class TemplateEngine {
  validateVariables(template, variables) {
    // 1. 必須変数チェック
    const requiredVars = JSON.parse(template.required_variables || '[]');
    const missing = [];

    for (const varName of requiredVars) {
      const value = variables[varName];

      if (
        value === null ||
        value === undefined ||
        (typeof value !== 'boolean' && value.toString().trim() === '')
      ) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Required variables missing: ${missing.join(', ')}`);
    }

    // 2. 変数値の詳細バリデーション
    this.validateVariableValues(variables);
  }

  validateVariableValues(variables) {
    for (const [key, value] of Object.entries(variables)) {
      // ECID特別バリデーション
      if (key === 'ecid' && value) {
        const ecidDigits = value.toString().replace(/-/g, '');

        if (!/^\d{10}$/.test(ecidDigits)) {
          throw new Error(
            `Invalid ECID format: ${value}. Must be 10 digits.`
          );
        }
      }

      // 日付フィールドバリデーション
      if ((key.includes('date') || key.includes('Date')) && value) {
        if (!this.isValidDate(value)) {
          throw new Error(`Invalid date format: ${value}`);
        }
      }

      // 文字列長制限（DoS対策）
      if (typeof value === 'string' && value.length > 10000) {
        throw new Error(
          `Variable ${key} exceeds maximum length (10000 characters)`
        );
      }
    }
  }
}
```

---

## パフォーマンス仕様

### 目標値

**初期ロード:**
- 目標: < 2秒
- 現状: ~1.2秒
- 達成率: ✓ 達成

**テンプレート選択:**
- 目標: < 500ms
- 現状: ~300ms
- 達成率: ✓ 達成

**ライブプレビュー更新:**
- 目標: < 300ms（debounce後）
- 現状: ~200ms
- 達成率: ✓ 達成

**メール生成:**
- 目標: < 1秒
- 現状: ~400ms
- 達成率: ✓ 達成

### 最適化手法

#### 1. キャッシュ戦略

**L1: Sheet Data Cache（10分）**
```javascript
cache_sheet_data_templates
cache_sheet_data_variables
cache_sheet_data_options
cache_sheet_data_footers
```

**L2: Processed Data Cache（15-30分）**
```javascript
cache_template_categories (30分)
cache_templates_by_category_X (15分)
cache_variables_by_template_X (30分)
cache_options_by_variable_X (30分)
```

**L3: Entity Cache（60分）**
```javascript
cache_template_X
cache_footer_X
cache_initial_data
```

#### 2. バッチ操作

```javascript
// ❌ 悪い例: ループで個別取得
for (let i = 0; i < 100; i++) {
  const value = sheet.getRange(i + 1, 1).getValue();
  // 処理
}
// API呼び出し: 100回

// ✓ 良い例: 一括取得
const values = sheet.getRange(1, 1, 100, 1).getValues();
for (let i = 0; i < values.length; i++) {
  const value = values[i][0];
  // 処理
}
// API呼び出し: 1回（100倍高速）
```

#### 3. Set構造による高速検索

```javascript
// ❌ 悪い例: Array.includes() - O(n)
const allVars = ['var1', 'var2', 'var3', ...];
for (let i = 0; i < data.length; i++) {
  if (allVars.includes(data[i][0])) {  // O(n)
    // 処理
  }
}
// 全体: O(n²)

// ✓ 良い例: Set.has() - O(1)
const varSet = new Set(allVars);
for (let i = 0; i < data.length; i++) {
  if (varSet.has(data[i][0])) {  // O(1)
    // 処理
  }
}
// 全体: O(n)（n²倍高速）
```

#### 4. Debounce（入力遅延）

```javascript
// フロントエンド: script.html
let debounceTimer;

function updateLivePreview() {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    // API呼び出し
    google.script.run
      .withSuccessHandler(displayPreview)
      .generateEmail(templateId, variables);
  }, 300); // 300ms遅延
}

// 効果: タイピング中のAPI呼び出しを抑制
// Before: 1文字ごとにAPI呼び出し（10回/秒）
// After: 入力停止後のみAPI呼び出し（1回/3秒）
```

---

## セキュリティ仕様

### 認証・認可

**Google OAuth 2.0:**
```javascript
// appsscript.json
{
  "webapp": {
    "executeAs": "USER_DEPLOYING",  // デプロイユーザーとして実行
    "access": "DOMAIN"               // 同一ドメインのみアクセス可能
  },
  "oauthScopes": [
    // 最小権限の原則
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/spreadsheets"
  ]
}
```

### 機密情報の保護

**PropertiesService:**
```javascript
// Code.js
function getSpreadsheetId() {
  const scriptProps = PropertiesService.getScriptProperties();
  let id = scriptProps.getProperty('SPREADSHEET_ID');

  if (!id) {
    // フォールバック（初回セットアップのみ）
    id = '1Eo_piCwA517O7j_rgNLQ-j08nhKTaPcy0Qcgh57n2sk';
    scriptProps.setProperty('SPREADSHEET_ID', id);
  }

  return id;
}
```

### 入力サニタイゼーション

**XSS対策:**
```javascript
// Utils.js
function sanitizeString(text, options = {}) {
  let sanitized = text.toString();

  // HTMLタグ除去
  if (options.removeHtml !== false) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // 制御文字除去
  if (options.removeControlChars !== false) {
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  }

  // 長さ制限（DoS対策）
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized.trim();
}
```

### レート制限

```javascript
// Utils.js
function checkRateLimit(key, limit = 100, windowMinutes = 60) {
  const cache = new CacheService();
  const rateLimitKey = `rate_limit_${key}`;

  let requests = cache.get(rateLimitKey) || [];
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;

  // 古いリクエストを削除
  requests = requests.filter(timestamp => now - timestamp < windowMs);

  // 制限チェック
  if (requests.length >= limit) {
    return false;  // レート制限超過
  }

  // 新しいリクエストを追加
  requests.push(now);
  cache.set(rateLimitKey, requests, windowMinutes);

  return true;
}
```

---

## エラーハンドリング仕様

### エラー分類

**1. クライアント側エラー（4xx相当）:**
- 必須項目未入力
- バリデーションエラー
- 不正なフォーマット

**2. サーバー側エラー（5xx相当）:**
- データベース接続エラー
- テンプレート取得失敗
- 内部処理エラー

### エラーレスポンス形式

```javascript
// 成功レスポンス
{
  success: true,
  content: "生成されたメール内容",
  metadata: {
    templateId: "review_approved",
    templateName: "再審査→承認済み（誤審）",
    processedAt: "2025-11-10T12:34:56.789Z"
  }
}

// エラーレスポンス
{
  success: false,
  error: "Required variables missing: contactName, myName",
  errorCode: "VALIDATION_ERROR",
  timestamp: "2025-11-10T12:34:56.789Z"
}
```

### エラーログ形式

```javascript
// Utils.js - logError()
function logError(message, error) {
  const logEntry = {
    level: 'ERROR',
    timestamp: new Date().toISOString(),
    message: message,
    error: {
      message: error.message,
      stack: error.stack,
      lineNumber: error.lineNumber
    },
    user: Session.getActiveUser().getEmail(),
    context: {
      function: message.split('()')[0],
      spreadsheetId: SPREADSHEET_ID
    }
  };

  console.error(JSON.stringify(logEntry));
}
```

---

**最終更新日**: 2025-11-10
**バージョン**: 2.0.0
**メンテナ**: PolicyPlayBook Team
