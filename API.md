# PolicyPlayBook V2.0 - API仕様書

## 目次

1. [概要](#概要)
2. [認証・認可](#認証認可)
3. [サーバーサイドAPI](#サーバーサイドapi)
4. [クライアントサイドAPI](#クライアントサイドapi)
5. [データモデル](#データモデル)
6. [エラーハンドリング](#エラーハンドリング)
7. [レート制限](#レート制限)
8. [コード例](#コード例)

---

## 概要

PolicyPlayBook V2.0は、Google Apps Script (GAS)で構築されたWebアプリケーションです。このAPIドキュメントでは、サーバーサイド（GAS）とクライアントサイド（HTML/JavaScript）間の通信仕様を定義します。

### アーキテクチャ

```
┌─────────────────────────────────────┐
│  Client-Side (HTML/JavaScript)      │
│  - google.script.run API            │
│  - Asynchronous callbacks           │
└─────────────────────────────────────┘
              ↕
        google.script.run
              ↕
┌─────────────────────────────────────┐
│  Server-Side (Google Apps Script)   │
│  - doGet() - HTML Service           │
│  - doPost() - JSON API              │
│  - Public functions                 │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│  Data Layer (Google Sheets)         │
│  - Templates                        │
│  - Variables                        │
│  - Options                          │
│  - Footers                          │
└─────────────────────────────────────┘
```

### エンドポイント一覧

| エンドポイント | メソッド | 説明 |
|------------|---------|------|
| `/exec` | GET | Webアプリケーションの初期化とHTMLページの提供 |
| `/exec` | POST | JSON APIエンドポイント（複数アクション対応） |

### 通信プロトコル

- **プロトコル**: HTTPS
- **データ形式**: JSON
- **文字エンコーディング**: UTF-8
- **タイムゾーン**: Asia/Tokyo (JST)

---

## 認証・認可

### OAuth 2.0スコープ

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

### アクセス制御

**Webアプリケーション設定:**
- **実行ユーザー**: `USER_DEPLOYING` (デプロイしたユーザー権限で実行)
- **アクセス権限**: `DOMAIN` (同一Google Workspaceドメイン内のユーザーのみ)

**セキュリティポリシー:**
- 外部ドメインからのアクセスは拒否
- OAuth 2.0による認証が必須
- セッション管理はGoogle側で自動処理

---

## サーバーサイドAPI

### 1. doGet() - HTMLサービス

Webアプリケーションの初期ページを提供します。

#### エンドポイント

```
GET /exec
```

#### リクエスト

パラメータなし（URLパラメータは無視されます）

#### レスポンス

**成功時（200 OK）:**

```html
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
  <head>
    <title>PolicyPlayBook V2.0</title>
    <!-- Material Design 3 UI -->
  </head>
  <body>
    <!-- アプリケーション本体 -->
  </body>
</html>
```

**エラー時（500 Internal Server Error）:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>エラー - PolicyPlayBook</title>
  </head>
  <body>
    <h1>接続エラー</h1>
    <p>データベースに接続できませんでした。</p>
  </body>
</html>
```

#### 実装例

```javascript
/**
 * Webアプリケーションのエントリーポイント
 * @return {HtmlOutput} HTMLページ
 */
function doGet() {
  try {
    // スプレッドシート接続確認
    const db = new DatabaseService();
    db.initializeConnection();

    // HTMLテンプレート読み込み
    const template = HtmlService.createTemplateFromFile('index');

    // 初期データ取得
    template.initialData = JSON.stringify(getInitialData());

    // HTMLページ生成
    return template.evaluate()
      .setTitle('PolicyPlayBook V2.0 - Google広告ポリシー対応メール生成')
      .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/apps_script_48dp.png')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    logError('doGet() error', error);
    return createErrorPage(error);
  }
}
```

---

### 2. doPost() - JSON API

POSTリクエストを処理し、JSON形式でレスポンスを返します。

#### エンドポイント

```
POST /exec
```

#### リクエスト形式

**Content-Type**: `application/json`

```json
{
  "action": "string",
  "data": {
    // アクション固有のパラメータ
  }
}
```

#### 共通レスポンス形式

**成功時:**

```json
{
  "success": true,
  "data": {
    // アクション固有のデータ
  },
  "timestamp": "2025-11-10T10:30:45+09:00"
}
```

**エラー時:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {
      // エラー詳細（オプション）
    }
  },
  "timestamp": "2025-11-10T10:30:45+09:00"
}
```

---

### 3. 公開API関数一覧

以下の関数は、`google.script.run`を通じてクライアントから呼び出し可能です。

#### 3.1 getTemplateCategories()

テンプレートカテゴリ一覧を取得します。

**パラメータ:** なし

**戻り値:**

```javascript
{
  "success": true,
  "data": [
    {
      "category": "審査関連",
      "count": 25,
      "subcategories": ["不承認", "制限付き", "審査中"]
    },
    {
      "category": "アカウント管理",
      "count": 15,
      "subcategories": ["停止", "再開", "設定変更"]
    }
    // ...
  ]
}
```

**エラーコード:**
- `DB_CONNECTION_ERROR`: データベース接続エラー
- `CACHE_ERROR`: キャッシュ取得エラー

**使用例:**

```javascript
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onFailure)
  .getTemplateCategories();
```

---

#### 3.2 getTemplatesByCategory(category)

指定カテゴリのテンプレート一覧を取得します。

**パラメータ:**

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| category | string | ✓ | カテゴリ名（例: "審査関連"） |

**戻り値:**

```javascript
{
  "success": true,
  "data": [
    {
      "template_id": "review_approved",
      "template_name": "審査承認通知",
      "subcategory": "承認",
      "description": "広告審査が承認された際の通知テンプレート",
      "required_variables": ["ecid", "replyDate"],
      "optional_variables": ["additionalNotes"],
      "is_active": true
    }
    // ...
  ]
}
```

**エラーコード:**
- `INVALID_CATEGORY`: 無効なカテゴリ名
- `NO_TEMPLATES_FOUND`: テンプレートが見つからない
- `DB_READ_ERROR`: データベース読み取りエラー

**使用例:**

```javascript
google.script.run
  .withSuccessHandler(displayTemplates)
  .withFailureHandler(showError)
  .getTemplatesByCategory('審査関連');
```

---

#### 3.3 getTemplate(templateId)

テンプレート詳細を取得します。

**パラメータ:**

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| templateId | string | ✓ | テンプレートID（例: "review_approved"） |

**戻り値:**

```javascript
{
  "success": true,
  "data": {
    "template_id": "review_approved",
    "category": "審査関連",
    "subcategory": "承認",
    "template_name": "審査承認通知",
    "template_content": "お世話になっております。\n\nECID: {{ecid}}\n...",
    "required_variables": ["ecid", "replyDate"],
    "optional_variables": ["additionalNotes"],
    "is_active": true,
    "created_at": "2025-01-15T09:00:00+09:00",
    "updated_at": "2025-01-20T14:30:00+09:00",
    "notes": "標準的な承認通知テンプレート"
  }
}
```

**エラーコード:**
- `TEMPLATE_NOT_FOUND`: テンプレートが見つからない
- `TEMPLATE_INACTIVE`: テンプレートが無効化されている
- `INVALID_TEMPLATE_ID`: 無効なテンプレートID

**使用例:**

```javascript
google.script.run
  .withSuccessHandler(loadTemplate)
  .withFailureHandler(handleError)
  .getTemplate('review_approved');
```

---

#### 3.4 getVariablesByTemplate(templateId)

テンプレートで使用される変数一覧を取得します。

**パラメータ:**

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| templateId | string | ✓ | テンプレートID |

**戻り値:**

```javascript
{
  "success": true,
  "data": {
    "required": [
      {
        "variable_name": "ecid",
        "display_name": "ECID（お客様ID）",
        "variable_type": "text",
        "is_required": true,
        "validation_rule": "^[0-9]{10}$",
        "placeholder": "1234567890",
        "help_text": "10桁の数字を入力してください"
      },
      {
        "variable_name": "replyDate",
        "display_name": "回答期限日",
        "variable_type": "date",
        "is_required": true,
        "default_value": "{{nextBusinessDay}}",
        "help_text": "次の営業日が自動設定されます"
      }
    ],
    "optional": [
      {
        "variable_name": "additionalNotes",
        "display_name": "追加メモ",
        "variable_type": "textarea",
        "is_required": false,
        "placeholder": "必要に応じて追加情報を入力"
      }
    ]
  }
}
```

**エラーコード:**
- `TEMPLATE_NOT_FOUND`: テンプレートが見つからない
- `NO_VARIABLES_DEFINED`: 変数が定義されていない

**使用例:**

```javascript
google.script.run
  .withSuccessHandler(generateForm)
  .withFailureHandler(showError)
  .getVariablesByTemplate('review_approved');
```

---

#### 3.5 getOptionsByVariable(variableName)

変数のオプション一覧を取得します（セレクトボックス用）。

**パラメータ:**

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| variableName | string | ✓ | 変数名（例: "status"） |

**戻り値:**

```javascript
{
  "success": true,
  "data": [
    {
      "option_value": "0",
      "option_label": "制限付き",
      "sort_order": 1,
      "is_active": true
    },
    {
      "option_value": "1",
      "option_label": "不承認",
      "sort_order": 2,
      "is_active": true
    },
    {
      "option_value": "2",
      "option_label": "審査中",
      "sort_order": 3,
      "is_active": true
    }
  ]
}
```

**エラーコード:**
- `VARIABLE_NOT_FOUND`: 変数が見つからない
- `NO_OPTIONS_AVAILABLE`: オプションが定義されていない

**使用例:**

```javascript
google.script.run
  .withSuccessHandler(populateSelect)
  .withFailureHandler(handleError)
  .getOptionsByVariable('status');
```

---

#### 3.6 generateEmail(templateId, variables)

テンプレートからメールを生成します。

**パラメータ:**

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| templateId | string | ✓ | テンプレートID |
| variables | Object | ✓ | 変数オブジェクト |

**variablesオブジェクト例:**

```javascript
{
  "ecid": "1234567890",
  "status": "0",
  "replyDate": "2025-11-15",
  "additionalNotes": "追加の確認事項があります",
  "footer": true
}
```

**戻り値:**

```javascript
{
  "success": true,
  "data": {
    "content": "お世話になっております。\n\nECID: 123-456-7890\n\n審査結果: 制限付き\n\n回答期限: 2025年11月15日（金）\n\n追加の確認事項があります\n\n--\nGoogle広告サポートチーム",
    "variables_used": {
      "ecid": "1234567890",
      "formattedECID": "123-456-7890",
      "status": "0",
      "statusText": "制限付き",
      "replyDate": "2025-11-15",
      "formattedReplyDate": "2025年11月15日（金）",
      "today": "2025-11-10",
      "footer": "Google広告サポートチーム"
    },
    "template_id": "review_approved",
    "generated_at": "2025-11-10T10:30:45+09:00"
  }
}
```

**エラーコード:**
- `TEMPLATE_NOT_FOUND`: テンプレートが見つからない
- `VALIDATION_ERROR`: バリデーションエラー
- `MISSING_REQUIRED_VARIABLE`: 必須変数が未入力
- `INVALID_VARIABLE_FORMAT`: 変数フォーマットが不正
- `PROCESSING_ERROR`: テンプレート処理エラー

**エラーレスポンス例:**

```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "必須変数が入力されていません",
    "details": {
      "missing_variables": ["ecid", "replyDate"],
      "invalid_formats": [
        {
          "variable": "ecid",
          "value": "123",
          "expected": "10桁の数字"
        }
      ]
    }
  }
}
```

**使用例:**

```javascript
const variables = {
  ecid: document.getElementById('ecid').value,
  status: document.getElementById('status').value,
  replyDate: document.getElementById('replyDate').value,
  footer: true
};

google.script.run
  .withSuccessHandler(displayPreview)
  .withFailureHandler(showValidationErrors)
  .generateEmail('review_approved', variables);
```

---

#### 3.7 getActiveFooter()

アクティブなフッターを取得します。

**パラメータ:** なし

**戻り値:**

```javascript
{
  "success": true,
  "data": {
    "footer_id": "default_footer",
    "footer_name": "標準フッター",
    "footer_content": "--\nGoogle広告サポートチーム\nEmail: support@example.com",
    "is_active": true,
    "created_at": "2025-01-10T09:00:00+09:00"
  }
}
```

**エラーコード:**
- `NO_ACTIVE_FOOTER`: アクティブなフッターが見つからない

---

#### 3.8 validateTemplate(templateId, variables)

テンプレートと変数をバリデーションします（メール生成なし）。

**パラメータ:**

| 名前 | 型 | 必須 | 説明 |
|------|-----|------|------|
| templateId | string | ✓ | テンプレートID |
| variables | Object | ✓ | 変数オブジェクト |

**戻り値:**

**バリデーション成功時:**

```javascript
{
  "success": true,
  "data": {
    "valid": true,
    "message": "すべての検証に合格しました"
  }
}
```

**バリデーション失敗時:**

```javascript
{
  "success": true,
  "data": {
    "valid": false,
    "errors": [
      {
        "variable": "ecid",
        "error": "10桁の数字を入力してください",
        "current_value": "123"
      },
      {
        "variable": "replyDate",
        "error": "必須項目です",
        "current_value": null
      }
    ]
  }
}
```

**使用例:**

```javascript
// フォーム送信前のバリデーション
google.script.run
  .withSuccessHandler(function(result) {
    if (result.data.valid) {
      proceedToGeneration();
    } else {
      displayValidationErrors(result.data.errors);
    }
  })
  .validateTemplate('review_approved', variables);
```

---

#### 3.9 getSystemStatus()

システムステータスとヘルスチェックを実行します。

**パラメータ:** なし

**戻り値:**

```javascript
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "connected": true,
      "spreadsheet_id": "1Eo_piCwA517O7j_rgNLQ-j08nhKTaPcy0Qcgh57n2sk",
      "sheets": {
        "Templates": { "exists": true, "rows": 130 },
        "Variables": { "exists": true, "rows": 45 },
        "Options": { "exists": true, "rows": 87 },
        "Footers": { "exists": true, "rows": 3 }
      }
    },
    "cache": {
      "available": true,
      "entries": 15,
      "hit_rate": 0.85
    },
    "performance": {
      "avg_response_time_ms": 234,
      "last_24h_requests": 1250
    },
    "version": "2.0.0",
    "timestamp": "2025-11-10T10:30:45+09:00"
  }
}
```

**エラーコード:**
- `SYSTEM_DEGRADED`: システムが部分的に利用不可
- `SYSTEM_DOWN`: システムが完全に利用不可

---

#### 3.10 getInitialData()

アプリケーション初期化に必要なデータを一括取得します。

**パラメータ:** なし

**戻り値:**

```javascript
{
  "categories": [
    { "category": "審査関連", "count": 25 },
    { "category": "アカウント管理", "count": 15 }
  ],
  "activeFooter": {
    "footer_id": "default_footer",
    "footer_content": "--\nGoogle広告サポートチーム"
  },
  "config": {
    "version": "2.0.0",
    "timezone": "Asia/Tokyo",
    "default_language": "ja"
  },
  "timestamp": "2025-11-10T10:30:45+09:00"
}
```

**キャッシュ:** 60分

---

## クライアントサイドAPI

### google.script.run

Google Apps Scriptの`google.script.run` APIを使用してサーバー関数を非同期に呼び出します。

#### 基本構文

```javascript
google.script.run
  .withSuccessHandler(successCallback)
  .withFailureHandler(failureCallback)
  .withUserObject(userObject)
  .serverFunction(arg1, arg2, ...);
```

#### パラメータ

| メソッド | 説明 |
|---------|------|
| `withSuccessHandler(callback)` | 成功時のコールバック関数を設定 |
| `withFailureHandler(callback)` | 失敗時のコールバック関数を設定 |
| `withUserObject(object)` | コールバックに渡すユーザーオブジェクト |

#### 使用例

**基本的な呼び出し:**

```javascript
google.script.run
  .withSuccessHandler(function(result) {
    console.log('Success:', result);
  })
  .withFailureHandler(function(error) {
    console.error('Error:', error);
  })
  .getTemplateCategories();
```

**ユーザーオブジェクト付き:**

```javascript
google.script.run
  .withSuccessHandler(function(result, element) {
    element.innerHTML = result.data.content;
  })
  .withFailureHandler(function(error, element) {
    element.innerHTML = 'エラー: ' + error.message;
  })
  .withUserObject(document.getElementById('preview'))
  .generateEmail(templateId, variables);
```

**Promise化:**

```javascript
function runServerFunction(functionName, ...args) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [functionName](...args);
  });
}

// 使用例
try {
  const result = await runServerFunction('generateEmail', templateId, variables);
  displayPreview(result);
} catch (error) {
  showError(error);
}
```

---

## データモデル

### Template（テンプレート）

```typescript
interface Template {
  template_id: string;          // 一意識別子（例: "review_approved"）
  category: string;             // カテゴリ（例: "審査関連"）
  subcategory: string;          // サブカテゴリ（例: "承認"）
  template_name: string;        // テンプレート名
  template_content: string;     // テンプレート本文（変数含む）
  required_variables: string[]; // 必須変数配列（JSON）
  optional_variables: string[]; // オプション変数配列（JSON）
  is_active: boolean;           // 有効/無効フラグ
  created_at: string;           // 作成日時（ISO 8601）
  updated_at: string;           // 更新日時（ISO 8601）
  created_by: string;           // 作成者
  notes: string;                // 備考
}
```

### Variable（変数）

```typescript
interface Variable {
  variable_name: string;        // 変数名（例: "ecid"）
  display_name: string;         // 表示名（例: "ECID（お客様ID）"）
  variable_type: VariableType;  // 変数タイプ
  is_required: boolean;         // 必須フラグ
  default_value: string | null; // デフォルト値
  validation_rule: string | null; // 検証ルール（正規表現）
  placeholder: string | null;   // プレースホルダー
  help_text: string | null;     // ヘルプテキスト
  sort_order: number;           // 表示順序
  is_active: boolean;           // 有効/無効フラグ
}

type VariableType =
  | 'text'          // テキスト入力
  | 'textarea'      // 複数行テキスト
  | 'number'        // 数値
  | 'date'          // 日付
  | 'select'        // セレクトボックス
  | 'checkbox'      // チェックボックス
  | 'radio';        // ラジオボタン
```

### Option（オプション）

```typescript
interface Option {
  variable_name: string;        // 関連する変数名
  option_value: string;         // オプション値
  option_label: string;         // オプションラベル
  sort_order: number;           // 表示順序
  is_active: boolean;           // 有効/無効フラグ
  condition: string | null;     // 表示条件（オプション）
}
```

### Footer（フッター）

```typescript
interface Footer {
  footer_id: string;            // フッターID
  footer_name: string;          // フッター名
  footer_content: string;       // フッター内容
  is_active: boolean;           // 有効/無効フラグ
  created_at: string;           // 作成日時（ISO 8601）
  updated_at: string;           // 更新日時（ISO 8601）
  notes: string | null;         // 備考
}
```

---

## エラーハンドリング

### エラーコード一覧

| コード | HTTP相当 | 説明 | 対処方法 |
|-------|---------|------|---------|
| `SUCCESS` | 200 | 成功 | - |
| `TEMPLATE_NOT_FOUND` | 404 | テンプレートが見つからない | テンプレートIDを確認 |
| `TEMPLATE_INACTIVE` | 403 | テンプレートが無効 | 別のテンプレートを選択 |
| `VALIDATION_ERROR` | 400 | バリデーションエラー | 入力内容を修正 |
| `MISSING_REQUIRED_VARIABLE` | 400 | 必須変数未入力 | 必須項目を入力 |
| `INVALID_VARIABLE_FORMAT` | 400 | 変数フォーマット不正 | フォーマットを修正 |
| `INVALID_CATEGORY` | 400 | 無効なカテゴリ | カテゴリ名を確認 |
| `INVALID_TEMPLATE_ID` | 400 | 無効なテンプレートID | IDを確認 |
| `DB_CONNECTION_ERROR` | 503 | データベース接続エラー | 管理者に連絡 |
| `DB_READ_ERROR` | 500 | データベース読み取りエラー | リトライまたは管理者に連絡 |
| `CACHE_ERROR` | 500 | キャッシュエラー | キャッシュクリア後リトライ |
| `PROCESSING_ERROR` | 500 | 処理エラー | エラー詳細を確認 |
| `NO_TEMPLATES_FOUND` | 404 | テンプレートが見つからない | カテゴリを変更 |
| `NO_VARIABLES_DEFINED` | 404 | 変数が定義されていない | テンプレート設定を確認 |
| `NO_OPTIONS_AVAILABLE` | 404 | オプションが定義されていない | 変数設定を確認 |
| `NO_ACTIVE_FOOTER` | 404 | アクティブなフッターがない | フッターを有効化 |
| `SYSTEM_DEGRADED` | 503 | システム部分障害 | しばらく待ってリトライ |
| `SYSTEM_DOWN` | 503 | システム完全障害 | 管理者に連絡 |

### エラーレスポンス形式

```javascript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "ユーザー向けエラーメッセージ",
    "details": {
      // エラー固有の詳細情報
    },
    "timestamp": "2025-11-10T10:30:45+09:00",
    "request_id": "uuid-v4-string" // ログトレース用
  }
}
```

### クライアントサイドエラーハンドリング例

```javascript
function handleApiError(error) {
  console.error('API Error:', error);

  // エラーコード別の処理
  switch (error.code) {
    case 'VALIDATION_ERROR':
      displayValidationErrors(error.details);
      break;

    case 'TEMPLATE_NOT_FOUND':
      showErrorMessage('テンプレートが見つかりません');
      redirectToTemplateList();
      break;

    case 'DB_CONNECTION_ERROR':
      showErrorMessage('データベースに接続できません。しばらくしてから再度お試しください。');
      break;

    default:
      showErrorMessage('エラーが発生しました: ' + error.message);
  }
}

// 使用例
google.script.run
  .withSuccessHandler(displayResult)
  .withFailureHandler(handleApiError)
  .generateEmail(templateId, variables);
```

---

## レート制限

### Google Apps Scriptの制限

| リソース | 無料版 | Workspace版 |
|---------|-------|------------|
| 実行時間 | 6分/実行 | 6分/実行 |
| トリガー実行時間 | 90分/日 | 無制限 |
| URLFetch呼び出し | 20,000回/日 | 100,000回/日 |
| メール送信 | 100通/日 | 1,500通/日 |
| スプレッドシート読み取り | 無制限 | 無制限 |
| スプレッドシート書き込み | 無制限 | 無制限 |

### アプリケーションレベルの制限

**キャッシュTTL:**
- L1キャッシュ（生データ）: 10分
- L2キャッシュ（処理済み）: 15-30分
- L3キャッシュ（エンティティ）: 60分

**同時接続:**
- 制限なし（Google側で自動管理）

**リクエストサイズ:**
- 最大リクエストサイズ: 50MB
- 推奨リクエストサイズ: 10MB以下

---

## コード例

### 完全な実装例（クライアント側）

```javascript
/**
 * PolicyPlayBook V2.0 - クライアントサイドAPI使用例
 */

// ========================================
// 1. アプリケーション初期化
// ========================================

async function initializeApp() {
  showLoadingScreen();

  try {
    // 初期データ取得
    const initialData = await callServerFunction('getInitialData');

    // カテゴリ一覧を表示
    renderCategories(initialData.categories);

    // グローバル設定を保存
    window.appConfig = initialData.config;

    hideLoadingScreen();

  } catch (error) {
    handleError(error);
  }
}

// ========================================
// 2. カテゴリ選択
// ========================================

async function selectCategory(category) {
  showLoadingIndicator('カテゴリ');

  try {
    // カテゴリ別テンプレート取得
    const result = await callServerFunction('getTemplatesByCategory', category);

    // テンプレート一覧を表示
    renderTemplateList(result.data);

    // 次のステップに進む
    goToStep(2);

  } catch (error) {
    handleError(error);
  } finally {
    hideLoadingIndicator();
  }
}

// ========================================
// 3. テンプレート選択
// ========================================

async function selectTemplate(templateId) {
  showLoadingIndicator('テンプレート');

  try {
    // テンプレート詳細と変数を並列取得
    const [templateResult, variablesResult] = await Promise.all([
      callServerFunction('getTemplate', templateId),
      callServerFunction('getVariablesByTemplate', templateId)
    ]);

    // グローバルに保存
    window.currentTemplate = templateResult.data;
    window.currentVariables = variablesResult.data;

    // 動的フォーム生成
    generateForm(variablesResult.data);

    // 次のステップに進む
    goToStep(3);

  } catch (error) {
    handleError(error);
  } finally {
    hideLoadingIndicator();
  }
}

// ========================================
// 4. 動的フォーム生成
// ========================================

async function generateForm(variablesData) {
  const formContainer = document.getElementById('variablesForm');
  formContainer.innerHTML = '';

  // 必須変数
  for (const variable of variablesData.required) {
    const formGroup = await createFormField(variable, true);
    formContainer.appendChild(formGroup);
  }

  // オプション変数
  if (variablesData.optional.length > 0) {
    const optionalHeader = document.createElement('h6');
    optionalHeader.textContent = 'オプション項目';
    optionalHeader.className = 'mt-4 mb-3';
    formContainer.appendChild(optionalHeader);

    for (const variable of variablesData.optional) {
      const formGroup = await createFormField(variable, false);
      formContainer.appendChild(formGroup);
    }
  }

  // イベントリスナー追加
  attachFormListeners();
}

async function createFormField(variable, isRequired) {
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group mb-3';

  // ラベル
  const label = document.createElement('label');
  label.textContent = variable.display_name;
  if (isRequired) {
    label.innerHTML += ' <span class="text-danger">*</span>';
  }
  label.className = 'form-label';
  formGroup.appendChild(label);

  // 入力フィールド
  let inputElement;

  switch (variable.variable_type) {
    case 'select':
      inputElement = await createSelectField(variable);
      break;

    case 'textarea':
      inputElement = createTextareaField(variable);
      break;

    case 'date':
      inputElement = createDateField(variable);
      break;

    case 'text':
    default:
      inputElement = createTextField(variable);
  }

  inputElement.id = variable.variable_name;
  inputElement.name = variable.variable_name;
  inputElement.className = 'form-control';

  if (isRequired) {
    inputElement.required = true;
  }

  if (variable.placeholder) {
    inputElement.placeholder = variable.placeholder;
  }

  formGroup.appendChild(inputElement);

  // ヘルプテキスト
  if (variable.help_text) {
    const helpText = document.createElement('small');
    helpText.className = 'form-text text-muted';
    helpText.textContent = variable.help_text;
    formGroup.appendChild(helpText);
  }

  return formGroup;
}

async function createSelectField(variable) {
  const select = document.createElement('select');

  // オプション取得
  const result = await callServerFunction('getOptionsByVariable', variable.variable_name);

  // 空のオプション
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '選択してください';
  select.appendChild(emptyOption);

  // オプション追加
  for (const option of result.data) {
    const optionElement = document.createElement('option');
    optionElement.value = option.option_value;
    optionElement.textContent = option.option_label;
    select.appendChild(optionElement);
  }

  return select;
}

// ========================================
// 5. ライブプレビュー
// ========================================

let previewDebounceTimer;

function attachFormListeners() {
  const form = document.getElementById('variablesForm');
  const inputs = form.querySelectorAll('input, select, textarea');

  inputs.forEach(input => {
    input.addEventListener('input', debouncedPreviewUpdate);
    input.addEventListener('change', debouncedPreviewUpdate);
  });
}

function debouncedPreviewUpdate() {
  clearTimeout(previewDebounceTimer);
  previewDebounceTimer = setTimeout(updatePreview, 300);
}

async function updatePreview() {
  const variables = collectFormData();
  const previewArea = document.getElementById('emailPreview');

  try {
    // プレビュー生成
    const result = await callServerFunction('generateEmail', window.currentTemplate.template_id, variables);

    // プレビュー表示
    previewArea.innerHTML = formatPreviewContent(result.data.content);

    // 変数ハイライト
    highlightVariables(result.data.variables_used);

  } catch (error) {
    // エラー時はプレビューエリアにエラー表示
    if (error.code === 'VALIDATION_ERROR') {
      previewArea.innerHTML = '<div class="alert alert-warning">入力内容を確認してください</div>';
    } else {
      console.error('Preview error:', error);
    }
  }
}

function collectFormData() {
  const form = document.getElementById('variablesForm');
  const formData = new FormData(form);
  const variables = {};

  for (const [key, value] of formData.entries()) {
    variables[key] = value;
  }

  // フッター追加
  variables.footer = document.getElementById('includeFooter')?.checked || true;

  return variables;
}

// ========================================
// 6. メール生成（最終）
// ========================================

async function generateFinalEmail() {
  const variables = collectFormData();

  // クライアント側バリデーション
  if (!validateForm()) {
    showValidationMessage();
    return;
  }

  showLoadingIndicator('生成');

  try {
    // メール生成
    const result = await callServerFunction('generateEmail', window.currentTemplate.template_id, variables);

    // 結果表示
    displayFinalEmail(result.data);

    // 次のステップに進む
    goToStep(4);

  } catch (error) {
    handleError(error);
  } finally {
    hideLoadingIndicator();
  }
}

function displayFinalEmail(emailData) {
  const finalPreview = document.getElementById('finalEmailPreview');
  finalPreview.innerHTML = formatPreviewContent(emailData.content);

  // コピーボタンにデータ設定
  document.getElementById('copyEmailBtn').onclick = () => {
    copyToClipboard(emailData.content);
  };
}

// ========================================
// 7. ユーティリティ関数
// ========================================

function callServerFunction(functionName, ...args) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [functionName](...args);
  });
}

function handleError(error) {
  console.error('Error:', error);

  let message = 'エラーが発生しました';

  if (error.code) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        message = '入力内容に誤りがあります';
        displayValidationErrors(error.details);
        return;

      case 'DB_CONNECTION_ERROR':
        message = 'データベースに接続できません。しばらくしてから再度お試しください。';
        break;

      default:
        message = error.message || message;
    }
  }

  showErrorDialog(message);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showSuccessToast('クリップボードにコピーしました');
  }).catch(err => {
    console.error('Copy failed:', err);
    showErrorToast('コピーに失敗しました');
  });
}

// ========================================
// 8. 初期化実行
// ========================================

document.addEventListener('DOMContentLoaded', initializeApp);
```

### サーバーサイド実装例

```javascript
/**
 * PolicyPlayBook V2.0 - サーバーサイドAPI実装例
 */

// ========================================
// 1. generateEmail() - 完全実装
// ========================================

/**
 * テンプレートからメール生成
 * @param {string} templateId - テンプレートID
 * @param {Object} variables - 変数オブジェクト
 * @return {Object} 生成結果
 */
function generateEmail(templateId, variables) {
  const startTime = new Date();

  try {
    logInfo('generateEmail() called', { templateId, variableCount: Object.keys(variables).length });

    // 入力バリデーション
    if (!templateId || typeof templateId !== 'string') {
      throw new Error('無効なテンプレートIDです');
    }

    if (!variables || typeof variables !== 'object') {
      throw new Error('変数オブジェクトが不正です');
    }

    // テンプレート取得
    const db = new DatabaseService();
    const template = db.getTemplate(templateId);

    if (!template) {
      return createErrorResponse('TEMPLATE_NOT_FOUND', 'テンプレートが見つかりません');
    }

    if (!template.is_active) {
      return createErrorResponse('TEMPLATE_INACTIVE', 'このテンプレートは現在利用できません');
    }

    // テンプレートエンジンで生成
    const engine = new TemplateEngine();
    const result = engine.generate(templateId, variables);

    // パフォーマンスログ
    const duration = new Date() - startTime;
    logInfo('generateEmail() completed', { duration: duration + 'ms' });

    // 成功レスポンス
    return {
      success: true,
      data: {
        content: result.content,
        variables_used: result.variables_used,
        template_id: templateId,
        generated_at: new Date().toISOString()
      }
    };

  } catch (error) {
    logError('generateEmail() error', error);

    // エラータイプ判定
    if (error.message.includes('必須変数')) {
      return createErrorResponse('MISSING_REQUIRED_VARIABLE', error.message, {
        missing_variables: error.missingVariables
      });
    }

    if (error.message.includes('フォーマット')) {
      return createErrorResponse('INVALID_VARIABLE_FORMAT', error.message, {
        invalid_formats: error.invalidFormats
      });
    }

    return createErrorResponse('PROCESSING_ERROR', 'メール生成中にエラーが発生しました', {
      error_message: error.message
    });
  }
}

// ========================================
// 2. ヘルパー関数
// ========================================

function createErrorResponse(code, message, details = null) {
  return {
    success: false,
    error: {
      code: code,
      message: message,
      details: details,
      timestamp: new Date().toISOString(),
      request_id: Utilities.getUuid()
    }
  };
}

function logInfo(message, data = null) {
  const logEntry = {
    level: 'INFO',
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify(logEntry));
}

function logError(message, error) {
  const logEntry = {
    level: 'ERROR',
    message: message,
    error: {
      message: error.message,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  };
  console.error(JSON.stringify(logEntry));
}
```

---

## 付録

### A. テンプレート構文リファレンス

```
基本変数:        {{variableName}}
条件分岐:        {{if condition}}...{{endif}}
等価チェック:    {{if status == "制限付き"}}...{{endif}}
存在チェック:    {{if variableName}}...{{endif}}
ループ:          {{for item in list}}...{{endfor}}
日付フォーマット: {{formatDate(replyDate)}}
ECID フォーマット: {{formatECID(ecid)}}
リンク:          [テキスト](https://example.com)
特殊変数:        {{today}}, {{nextBusinessDay}}, {{version}}
```

### B. バージョン履歴

| バージョン | リリース日 | 変更内容 |
|----------|----------|---------|
| 2.0.0 | 2025-11-10 | 初版リリース |

### C. サポート

**技術サポート:**
- GitHub Issues: https://github.com/your-org/policyplaybook/issues
- Email: support@example.com

**ドキュメント:**
- CLAUDE.md: プロジェクト概要とガイド
- AGENTS.md: Agent別専門知識
- ARCHITECTURE.md: アーキテクチャドキュメント
- TECHNICAL_SPECS.md: 技術仕様書
- API.md: このドキュメント

---

**最終更新日**: 2025-11-10
**バージョン**: 2.0.0
**メンテナ**: PolicyPlayBook Team
