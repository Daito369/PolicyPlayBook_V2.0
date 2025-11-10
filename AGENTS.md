# PolicyPlayBook V2.0 - AI Agents 専門知識ガイド

## 概要

このドキュメントは、PolicyPlayBook V2.0プロジェクトにおいて、異なる役割を持つAIエージェントや専門家が効率的にタスクを実行するための専門知識をまとめたものです。

各エージェントは、特定のドメイン知識とタスクに特化しており、このガイドを参照することで、プロジェクトの特定の側面に迅速かつ正確に対応できます。

---

## Agent 1: フロントエンド開発エージェント

### 担当領域
- UI/UXデザイン
- Material Design 3 実装
- フロントエンド JavaScript
- レスポンシブデザイン
- アクセシビリティ

### 必要な知識

#### Material Design 3 実装標準

**カラーシステム:**
```css
/* Primary - Google Blue */
--md-primary: #1A73E8;
--md-on-primary: #FFFFFF;

/* Tertiary - Google Green */
--md-tertiary: #34A853;

/* Error - Google Red */
--md-error: #EA4335;

/* ダークモード対応 */
.dark-mode {
  --md-primary: #8AB4F8;
  --md-surface: #121212;
}
```

**コンポーネント設計:**
```javascript
// Filled Text Field（推奨）
<input class="form-control"
       style="background-color: var(--md-surface-container-highest);
              border-bottom: 2px solid var(--md-outline);">

// Filled Button（Primary Action）
<button class="btn btn-primary"
        style="border-radius: var(--md-shape-corner-full);
               box-shadow: var(--md-elevation-0);">

// Card（Surface Container）
<div class="card"
     style="background-color: var(--md-surface-container-highest);
            border-radius: var(--md-shape-corner-large);
            box-shadow: var(--md-elevation-1);">
```

#### 4ステップウィザードの実装

**ステップ管理:**
```javascript
const steps = {
  1: 'category-selection',
  2: 'template-selection',
  3: 'input-form',
  4: 'preview-copy'
};

function activateStep(stepNumber) {
  // 前のステップを非アクティブ化
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active');
  });

  // 指定ステップをアクティブ化
  const step = document.getElementById(`step-${stepNumber}`);
  step.classList.add('active');

  // 完了ステップにマークを付ける
  for (let i = 1; i < stepNumber; i++) {
    document.getElementById(`step-${i}`).classList.add('completed');
  }
}
```

#### ライブプレビュー実装

**Debounce パターン:**
```javascript
let debounceTimer;
function updateLivePreview() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const formData = collectFormData();
    google.script.run
      .withSuccessHandler(displayPreview)
      .withFailureHandler(handleError)
      .generateEmail({
        templateId: currentTemplateId,
        variables: formData
      });
  }, 300); // 300ms遅延
}

// すべての入力フィールドにイベントリスナーを追加
document.querySelectorAll('#emailForm input, #emailForm textarea, #emailForm select')
  .forEach(field => {
    field.addEventListener('input', updateLivePreview);
    field.addEventListener('change', updateLivePreview);
  });
```

#### レスポンシブデザイン

**ブレークポイント:**
```css
/* Desktop First Approach */
@media (max-width: 1200px) {
  /* Large tablets */
  .step-label { font-size: 10px; }
}

@media (max-width: 768px) {
  /* Tablets & Mobile */
  .steps-indicator { flex-direction: column; }
  #livePreviewCard { position: relative; }
}

@media (max-width: 576px) {
  /* Mobile only */
  #copyBtn span { display: none; }
  #copyBtn::after { content: 'コピー'; }
}
```

### よくあるタスク

**1. 新しい入力フィールドタイプを追加**
```javascript
// script.html内のrenderDynamicFields()関数に追加

case 'range':
  html += `
    <label class="form-label">${displayName}</label>
    <input type="range"
           class="form-range"
           id="var_${varName}"
           min="0" max="100" step="1"
           value="${defaultValue || 50}">
    <div class="text-muted small">現在の値: <span id="range_${varName}_value">50</span></div>
  `;
  break;
```

**2. カスタムバリデーションを追加**
```javascript
function validateCustomField(fieldName, value) {
  if (fieldName === 'customField') {
    // カスタムロジック
    const pattern = /^[A-Z]{3}-[0-9]{4}$/;
    if (!pattern.test(value)) {
      return {
        valid: false,
        message: 'フォーマット: ABC-1234'
      };
    }
  }
  return { valid: true };
}
```

**3. トースト通知を表示**
```javascript
function showToast(type, message) {
  // type: 'success', 'error', 'warning', 'info'
  const toastEl = document.getElementById(`${type}Toast`);
  const toastBody = document.getElementById(`${type}ToastBody`);
  toastBody.textContent = message;

  const toast = new bootstrap.Toast(toastEl, {
    animation: true,
    autohide: true,
    delay: 3000
  });
  toast.show();
}
```

---

## Agent 2: バックエンド開発エージェント（GAS）

### 担当領域
- Google Apps Script ロジック
- データベース操作（Google Sheets）
- API エンドポイント
- テンプレートエンジン
- キャッシュ管理

### 必要な知識

#### GAS V8 Runtime ベストプラクティス

**ES6+ 機能の活用:**
```javascript
// Arrow Functions
const getTemplate = (id) => db.getTemplate(id);

// Template Literals
const message = `Template ${templateId} generated successfully`;

// Destructuring
const { templateId, variables } = params;

// Spread Operator
const processedVars = { ...variables, today: new Date() };

// Classes
class TemplateEngine {
  constructor() {
    this.db = new DatabaseService();
  }
}

// Default Parameters
function getNextBusinessDay(startDate = new Date(), days = 1) {
  // ...
}
```

**避けるべきパターン:**
```javascript
// ✗ ループ内でのSpreadsheet操作
for (let i = 0; i < 100; i++) {
  sheet.getRange(i, 1).setValue(data[i]); // 100回API呼び出し
}

// ✓ バッチ操作
const values = data.map(d => [d]);
sheet.getRange(1, 1, values.length, 1).setValues(values); // 1回API呼び出し
```

#### データベース操作パターン

**CRUD操作:**
```javascript
// CREATE
function createTemplate(templateData) {
  const sheet = getTemplatesSheet();
  const newRow = [
    templateData.template_id,
    templateData.category,
    // ... 他のフィールド
    new Date(), // created_at
    new Date()  // updated_at
  ];
  sheet.appendRow(newRow);
  clearTemplateCache(); // キャッシュクリア
}

// READ（キャッシュ付き）
function getTemplate(templateId) {
  const cacheKey = `template_${templateId}`;
  let template = cache.get(cacheKey);

  if (!template) {
    template = fetchTemplateFromSheet(templateId);
    cache.set(cacheKey, template, 60); // 60分キャッシュ
  }

  return template;
}

// UPDATE
function updateTemplate(templateId, updates) {
  const sheet = getTemplatesSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === templateId) {
      // 更新処理
      if (updates.template_content !== undefined) {
        sheet.getRange(i + 1, 5).setValue(updates.template_content);
      }
      sheet.getRange(i + 1, 10).setValue(new Date()); // updated_at
      break;
    }
  }

  clearTemplateCache();
}

// DELETE（論理削除）
function deleteTemplate(templateId) {
  updateTemplate(templateId, { is_active: false });
}
```

#### テンプレートエンジン拡張

**新しい構文を追加:**
```javascript
// Templates.js の processTemplate() に追加

// 例: {{uppercase variableName}} 構文
processUppercase(content, variables) {
  const regex = /{{uppercase\s+(\w+)}}/g;
  return content.replace(regex, (match, varName) => {
    const value = variables[varName];
    return value ? value.toString().toUpperCase() : '';
  });
}

// メインパイプラインに統合
processTemplate(content, variables) {
  let processed = content;

  processed = this.replaceBasicVariables(processed, variables);
  processed = this.processConditionals(processed, variables);
  processed = this.processLoops(processed, variables);
  processed = this.processFunctions(processed, variables);
  processed = this.processUppercase(processed, variables); // 新規追加
  processed = this.processSpecialVariables(processed, variables);

  return processed;
}
```

#### キャッシュ戦略の実装

**選択的キャッシュクリア:**
```javascript
function onEdit(e) {
  if (!e || !e.source || !e.range) return;

  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const editedRow = e.range.getRow();

  const cache = CacheService.getScriptCache();

  if (sheetName === 'Templates' && editedRow > 1) {
    try {
      const templateId = sheet.getRange(editedRow, 1).getValue();
      const category = sheet.getRange(editedRow, 2).getValue();

      // 関連キャッシュのみを削除
      cache.remove(`cache_template_${templateId}`);
      cache.remove(`cache_templates_by_category_${category}`);
      cache.remove('cache_template_categories');
      cache.remove('cache_initial_data');

      logInfo(`Cache cleared for template: ${templateId}`);
    } catch (err) {
      logWarning('Failed to clear specific cache, clearing all template caches');
      // フォールバック: 全テンプレートキャッシュをクリア
      clearTemplateCache();
    }
  }
}
```

### よくあるタスク

**1. 新しいAPIエンドポイントを追加**
```javascript
// Code.js の doPost() に追加

function doPost(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case 'getTemplates':
        return getTemplatesByCategory(e.parameter.category);

      // 新しいアクションを追加
      case 'exportTemplate':
        return exportTemplateAsJson(e.parameter.templateId);

      case 'importTemplate':
        return importTemplateFromJson(JSON.parse(e.parameter.jsonData));

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    logError('doPost() error', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

**2. パフォーマンス測定**
```javascript
function measurePerformance(functionName, fn) {
  const label = `perf_${functionName}_${Date.now()}`;
  startPerformanceTimer(label);

  try {
    const result = fn();
    const duration = endPerformanceTimer(label);

    logInfo(`${functionName} completed in ${duration}ms`);
    return result;
  } catch (error) {
    endPerformanceTimer(label);
    throw error;
  }
}

// 使用例
const result = measurePerformance('generateEmail', () => {
  return generateEmailFromTemplate(templateId, variables);
});
```

---

## Agent 3: データベース設計エージェント

### 担当領域
- Google Sheets スキーマ設計
- データ整合性
- インデックス最適化
- データマイグレーション

### 必要な知識

#### スキーマ設計原則

**正規化:**
```
Templates (1) ──< (N) required_variables (JSON array)
Templates (1) ──< (N) optional_variables (JSON array)

Variables (1) ──< (N) Options (variable_name で紐付け)

Footers (1 active) ──< (N) Templates (optional)
```

**インデックス戦略:**
```javascript
// 高頻度検索フィールド
- template_id: PRIMARY KEY（一意制約）
- category: INDEX（カテゴリ別検索）
- is_active: INDEX（アクティブフィルタリング）

// 複合インデックス（論理的）
- (category, is_active): カテゴリ別アクティブテンプレート取得
- (variable_name, is_active): 変数別アクティブオプション取得
```

#### データ検証ルール

**Spreadsheet データ検証設定:**
```javascript
function setupDataValidation() {
  const sheet = spreadsheet.getSheetByName('Templates');

  // is_active 列（H列）
  const activeRange = sheet.getRange(2, 8, 1000, 1);
  const activeValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE'], true)
    .setAllowInvalid(false)
    .setHelpText('TRUE または FALSE を選択してください')
    .build();
  activeRange.setDataValidation(activeValidation);

  // variable_type 列（C列 in Variables sheet）
  const variablesSheet = spreadsheet.getSheetByName('Variables');
  const typeRange = variablesSheet.getRange(2, 3, 1000, 1);
  const typeValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'text', 'email', 'tel', 'number', 'textarea',
      'select', 'date', 'datetime-local', 'checkbox', 'radio', 'range'
    ], true)
    .setAllowInvalid(false)
    .build();
  typeRange.setDataValidation(typeValidation);
}
```

#### データ整合性チェック

**バリデーション関数:**
```javascript
function validateDatabaseIntegrity() {
  const issues = [];

  // 1. Orphaned Variables Check
  const templates = getAllTemplates();
  const variables = getAllVariables();

  templates.forEach(template => {
    const requiredVars = JSON.parse(template.required_variables || '[]');
    const optionalVars = JSON.parse(template.optional_variables || '[]');
    const allVars = [...requiredVars, ...optionalVars];

    allVars.forEach(varName => {
      if (!variables.find(v => v.variable_name === varName)) {
        issues.push({
          type: 'orphaned_variable',
          templateId: template.template_id,
          variableName: varName,
          message: `Variable "${varName}" referenced in template "${template.template_id}" does not exist`
        });
      }
    });
  });

  // 2. Duplicate ID Check
  const templateIds = templates.map(t => t.template_id);
  const duplicates = templateIds.filter((id, index) => templateIds.indexOf(id) !== index);

  if (duplicates.length > 0) {
    issues.push({
      type: 'duplicate_ids',
      ids: duplicates,
      message: `Duplicate template IDs found: ${duplicates.join(', ')}`
    });
  }

  // 3. Invalid JSON Check
  templates.forEach(template => {
    try {
      JSON.parse(template.required_variables || '[]');
      JSON.parse(template.optional_variables || '[]');
    } catch (error) {
      issues.push({
        type: 'invalid_json',
        templateId: template.template_id,
        message: `Invalid JSON in template "${template.template_id}"`
      });
    }
  });

  return {
    valid: issues.length === 0,
    issues: issues,
    timestamp: new Date().toISOString()
  };
}
```

### よくあるタスク

**1. データマイグレーション**
```javascript
function migrateV1ToV2() {
  const sheet = getTemplatesSheet();
  const data = sheet.getDataRange().getValues();

  // ヘッダー行を確認
  const headers = data[0];
  const newColumnIndex = headers.indexOf('new_column');

  if (newColumnIndex === -1) {
    // 新しい列を追加
    sheet.insertColumnAfter(headers.length);
    sheet.getRange(1, headers.length + 1).setValue('new_column');
  }

  // データ変換
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // 変換ロジック
    const newValue = transformData(row);
    sheet.getRange(i + 1, headers.length + 1).setValue(newValue);
  }

  logInfo('Migration completed successfully');
}
```

**2. バックアップ作成**
```javascript
function createBackup() {
  const sourceSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');

  // スプレッドシートを複製
  const backup = sourceSpreadsheet.copy(`PolicyPlayBook-Backup-${timestamp}`);

  // バックアップフォルダに移動
  const backupFolder = DriveApp.getFolderById('BACKUP_FOLDER_ID');
  DriveApp.getFileById(backup.getId()).moveTo(backupFolder);

  logInfo(`Backup created: ${backup.getName()}`);
  return backup.getId();
}
```

---

## Agent 4: セキュリティ & 品質保証エージェント

### 担当領域
- セキュリティ監査
- コード品質チェック
- パフォーマンステスト
- アクセシビリティ検証

### 必要な知識

#### セキュリティチェックリスト

**1. 認証・認可:**
```javascript
// ✓ appsscript.json の確認
{
  "webapp": {
    "executeAs": "USER_DEPLOYING",  // デプロイユーザーとして実行
    "access": "DOMAIN"               // 同一ドメインのみアクセス可能
  },
  "oauthScopes": [
    // 最小限のスコープのみを許可
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

**2. 機密情報の保護:**
```javascript
// ✗ ハードコーディング（悪い例）
const API_KEY = 'sk-1234567890abcdef';

// ✓ PropertiesService（良い例）
const scriptProps = PropertiesService.getScriptProperties();
const API_KEY = scriptProps.getProperty('API_KEY');
```

**3. 入力サニタイゼーション:**
```javascript
function sanitizeUserInput(input) {
  // XSS対策
  const sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')  // <script>タグ除去
    .replace(/<[^>]+>/g, '')                      // HTMLタグ除去
    .replace(/javascript:/gi, '')                 // javascript:除去
    .trim();

  // 長さ制限
  if (sanitized.length > 10000) {
    throw new Error('Input exceeds maximum length');
  }

  return sanitized;
}
```

**4. CSRF対策:**
```javascript
// GAS Web Appは同一オリジンポリシーで保護されているが、
// 追加の保護として State Token を使用可能

function generateStateToken() {
  const token = Utilities.getUuid();
  PropertiesService.getUserProperties().setProperty('state_token', token);
  return token;
}

function validateStateToken(token) {
  const storedToken = PropertiesService.getUserProperties().getProperty('state_token');
  if (!storedToken || storedToken !== token) {
    throw new Error('Invalid state token');
  }
  PropertiesService.getUserProperties().deleteProperty('state_token');
}
```

#### コード品質基準

**JSHint/ESLint 設定:**
```javascript
/* eslint-env es6, googleappsscript */
/* global SpreadsheetApp, PropertiesService, HtmlService, CacheService */

// ✓ 推奨パターン
const functionName = () => {
  'use strict';

  // 変数宣言は const/let のみ（var 禁止）
  const immutableValue = 'constant';
  let mutableValue = 0;

  // エラーハンドリング必須
  try {
    // ロジック
  } catch (error) {
    logError('functionName() error', error);
    throw error;
  }
};
```

**パフォーマンステスト:**
```javascript
function performanceTest() {
  const iterations = 100;
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    // テスト対象の関数
    generateEmailFromTemplate('review_approved', testVariables);

    const duration = Date.now() - start;
    results.push(duration);
  }

  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  const max = Math.max(...results);
  const min = Math.min(...results);

  logInfo(`Performance Test Results:
    Iterations: ${iterations}
    Average: ${avg.toFixed(2)}ms
    Max: ${max}ms
    Min: ${min}ms
  `);

  // 閾値チェック
  if (avg > 1000) {
    logWarning(`Average execution time (${avg}ms) exceeds threshold (1000ms)`);
  }
}
```

### よくあるタスク

**1. セキュリティ監査実行**
```javascript
function runSecurityAudit() {
  const issues = [];

  // 1. ハードコードされた機密情報のチェック
  const sourceFiles = ['Code.gs', 'Templates.gs', 'Database.gs', 'Utils.gs'];
  sourceFiles.forEach(file => {
    const content = fetchFileContent(file);
    if (content.match(/['"]sk-[a-zA-Z0-9]{32,}['"]/)) {
      issues.push(`Potential API key hardcoded in ${file}`);
    }
  });

  // 2. OAuth スコープの妥当性チェック
  const manifest = JSON.parse(fetchFileContent('appsscript.json'));
  const unnecessaryScopes = manifest.oauthScopes.filter(scope =>
    !REQUIRED_SCOPES.includes(scope)
  );
  if (unnecessaryScopes.length > 0) {
    issues.push(`Unnecessary OAuth scopes: ${unnecessaryScopes.join(', ')}`);
  }

  // 3. アクセス権限チェック
  if (manifest.webapp.access !== 'DOMAIN') {
    issues.push('Web app access should be restricted to DOMAIN');
  }

  return {
    passed: issues.length === 0,
    issues: issues,
    timestamp: new Date().toISOString()
  };
}
```

**2. アクセシビリティ検証**
```javascript
// フロントエンドで実行
function checkAccessibility() {
  const issues = [];

  // 1. Alt属性チェック
  document.querySelectorAll('img').forEach(img => {
    if (!img.getAttribute('alt')) {
      issues.push(`Image missing alt attribute: ${img.src}`);
    }
  });

  // 2. ラベルとフォームコントロールの紐付けチェック
  document.querySelectorAll('input, select, textarea').forEach(input => {
    const id = input.getAttribute('id');
    if (id && !document.querySelector(`label[for="${id}"]`)) {
      issues.push(`Form control missing label: ${id}`);
    }
  });

  // 3. カラーコントラスト比チェック（簡易版）
  const contrastRatio = calculateContrastRatio(
    getComputedStyle(document.body).color,
    getComputedStyle(document.body).backgroundColor
  );
  if (contrastRatio < 4.5) {
    issues.push(`Insufficient color contrast ratio: ${contrastRatio}`);
  }

  return issues;
}
```

---

## Agent 5: ドキュメンテーションエージェント

### 担当領域
- 技術ドキュメント作成
- API仕様書
- ユーザーガイド
- コードコメント

### 必要な知識

#### JSDoc 標準

**関数ドキュメント:**
```javascript
/**
 * テンプレートからメールを生成する
 *
 * @param {string} templateId - テンプレートID（例: "review_approved"）
 * @param {Object} variables - 変数オブジェクト
 * @param {string} variables.contactName - 連絡先名
 * @param {string} variables.myName - 担当者名
 * @param {string} variables.ecid - ECID（10桁）
 * @return {Object} 生成結果
 * @return {boolean} return.success - 生成成功フラグ
 * @return {string} return.content - 生成されたメール内容
 * @return {string} return.error - エラーメッセージ（失敗時のみ）
 *
 * @throws {Error} テンプレートが見つからない場合
 * @throws {Error} 必須変数が不足している場合
 *
 * @example
 * const result = generateEmailFromTemplate('review_approved', {
 *   contactName: '田中様',
 *   myName: '佐藤',
 *   ecid: '1234567890'
 * });
 *
 * if (result.success) {
 *   console.log(result.content);
 * }
 *
 * @see {@link https://docs.google.com/document/d/xxx|詳細仕様書}
 * @since 1.0.0
 */
function generateEmailFromTemplate(templateId, variables) {
  // 実装
}
```

**クラスドキュメント:**
```javascript
/**
 * テンプレートエンジンクラス
 *
 * テンプレートの解析、変数置換、条件分岐、ループ処理を担当します。
 *
 * @class
 * @classdesc 高度なテンプレート処理システム
 *
 * @property {DatabaseService} db - データベースサービスインスタンス
 * @property {CacheService} cache - キャッシュサービスインスタンス
 *
 * @example
 * const engine = new TemplateEngine();
 * const result = engine.generate('review_approved', variables);
 */
class TemplateEngine {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
  }
}
```

#### Markdown ドキュメント構造

**READMEテンプレート:**
```markdown
# モジュール名

## 概要
簡潔な説明（1-2文）

## 主な機能
- 機能1
- 機能2
- 機能3

## 使い方

### インストール/セットアップ
\`\`\`javascript
// コード例
\`\`\`

### 基本的な使用例
\`\`\`javascript
// コード例
\`\`\`

### 高度な使用例
\`\`\`javascript
// コード例
\`\`\`

## API リファレンス

### 関数名
- **説明**: 関数の説明
- **パラメータ**:
  - `param1` (type): 説明
  - `param2` (type): 説明
- **戻り値**: (type) 説明
- **例**:
  \`\`\`javascript
  // コード例
  \`\`\`

## トラブルシューティング

### 問題1
**症状**: 症状の説明
**原因**: 原因の説明
**解決方法**: 解決方法の説明

## 貢献ガイドライン
（該当する場合）

## ライセンス
（該当する場合）

## 変更履歴
- v1.0.0 (2025-11-10): 初回リリース
```

---

## エージェント間の連携

### コミュニケーションプロトコル

**1. 変更通知:**
```javascript
// フロントエンドエージェント → バックエンドエージェント
{
  type: 'API_CHANGE',
  endpoint: 'getTemplates',
  changes: {
    newParameter: 'includeInactive',
    description: 'Include inactive templates in results'
  },
  action_required: 'Update API documentation'
}
```

**2. 問題報告:**
```javascript
// セキュリティエージェント → すべてのエージェント
{
  type: 'SECURITY_ISSUE',
  severity: 'HIGH',
  issue: 'Hardcoded API key found in Code.gs',
  location: 'Code.gs:123',
  recommendation: 'Move to PropertiesService',
  deadline: '2025-11-15'
}
```

**3. 品質レポート:**
```javascript
// 品質保証エージェント → すべてのエージェント
{
  type: 'QUALITY_REPORT',
  date: '2025-11-10',
  metrics: {
    code_coverage: '87%',
    performance_tests_passed: 95,
    accessibility_score: 92
  },
  issues: [
    // 問題リスト
  ]
}
```

---

## チェックリスト

### 新機能実装チェックリスト

- [ ] **フロントエンド**: UI/UXデザイン完了
- [ ] **フロントエンド**: レスポンシブデザイン対応
- [ ] **フロントエンド**: アクセシビリティ検証
- [ ] **バックエンド**: APIエンドポイント実装
- [ ] **バックエンド**: バリデーション実装
- [ ] **バックエンド**: エラーハンドリング実装
- [ ] **データベース**: スキーマ更新
- [ ] **データベース**: データ整合性確認
- [ ] **セキュリティ**: セキュリティ監査実施
- [ ] **セキュリティ**: 脆弱性スキャン実施
- [ ] **品質保証**: ユニットテスト作成
- [ ] **品質保証**: パフォーマンステスト実施
- [ ] **ドキュメント**: API仕様書更新
- [ ] **ドキュメント**: ユーザーガイド更新

---

**最終更新日**: 2025-11-10
**バージョン**: 2.0.0
**メンテナ**: PolicyPlayBook Team
