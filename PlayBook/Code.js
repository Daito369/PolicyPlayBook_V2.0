/**
 * PolicyPlayBook - Google Apps Script メインコントローラー
 * 完全無料でのGoogle Sheets + HTML Service活用
 * 
 * @version 1.0.0
 * @author PolicyPlayBook Team
 * @description 既存1522行HTMLファイルから130テンプレート対応システムへの移行
 */

// スプレッドシートID取得関数（セキュリティ強化）
function getSpreadsheetId() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    let id = scriptProps.getProperty('SPREADSHEET_ID');

    // フォールバック: スクリプトプロパティに設定されていない場合
    if (!id) {
      logWarning('SPREADSHEET_ID not found in Script Properties. Using fallback.');
      // 初回セットアップ時のみ許容
      id = '1Eo_piCwA517O7j_rgNLQ-j08nhKTaPcy0Qcgh57n2sk';
      // 自動的にScript Propertiesに保存
      scriptProps.setProperty('SPREADSHEET_ID', id);
      logInfo('SPREADSHEET_ID saved to Script Properties');
    }

    return id;
  } catch (error) {
    logError('Failed to retrieve SPREADSHEET_ID', error);
    throw new Error('SPREADSHEET_ID configuration error. Please run setup-automation.js first.');
  }
}

// スプレッドシートID（PropertiesServiceから安全に取得）
const SPREADSHEET_ID = getSpreadsheetId();

// アプリケーション設定
const APP_CONFIG = {
  title: 'PolicyPlayBook - Auto Email Generator',
  version: '1.0.0',
  description: 'Google広告ポリシー対応メール自動生成システム',
  maxCacheMinutes: 60,
  debugMode: false
};

/**
 * HTML Service エントリーポイント（エラーハンドリング強化版）
 * @return {HtmlOutput} HTML出力オブジェクト
 */
function doGet() {
  const errorContext = {
    function: 'doGet',
    timestamp: new Date().toISOString(),
    user: Session.getActiveUser().getEmail()
  };

  try {
    logInfo('doGet() called - アプリケーション開始', errorContext);

    // スプレッドシート接続確認
    try {
      const testConnection = SpreadsheetApp.openById(SPREADSHEET_ID);
      if (!testConnection) {
        throw new Error('Failed to connect to spreadsheet');
      }
    } catch (connectionError) {
      logError('Spreadsheet connection failed', connectionError);
      return createErrorPage('データベース接続エラー',
        'スプレッドシートに接続できません。管理者に連絡してください。',
        connectionError.message);
    }

    const template = HtmlService.createTemplateFromFile('index');

    // 初期データを HTML テンプレートに渡す
    template.appConfig = APP_CONFIG;

    // 初期データの取得（エラー時はデフォルト値を使用）
    try {
      template.initialData = getInitialData();
    } catch (initError) {
      logError('Failed to load initial data, using defaults', initError);
      template.initialData = {
        categories: {},
        systemStatus: {
          status: 'warning',
          message: 'Initial data load failed',
          error: initError.message
        },
        timestamp: new Date().toISOString()
      };
    }

    const output = template.evaluate()
      .setTitle(APP_CONFIG.title);

    // XFrameOptionsの設定（利用可能な場合のみ）
    try {
      if (HtmlService.XFrameOptionsMode && HtmlService.XFrameOptionsMode.SAMEORIGIN) {
        output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.SAMEORIGIN);
      }
    } catch (frameError) {
      logWarning('XFrameOptionsMode.SAMEORIGIN not supported, using default settings');
    }

    logInfo('doGet() completed successfully');
    return output;

  } catch (error) {
    logError('doGet() critical error', error);

    // 詳細なエラーログを記録
    try {
      const errorLog = {
        ...errorContext,
        error: error.message,
        stack: error.stack,
        spreadsheetId: SPREADSHEET_ID
      };
      logError('Detailed error context', errorLog);
    } catch (logError) {
      console.error('Failed to log error details', logError);
    }

    return createErrorPage('システムエラー',
      'アプリケーションの初期化に失敗しました。',
      error.message);
  }
}

/**
 * エラーページ生成（ユーザーフレンドリー）
 * @param {string} title - エラータイトル
 * @param {string} message - エラーメッセージ
 * @param {string} details - エラー詳細
 * @return {HtmlOutput} エラーページ
 */
function createErrorPage(title, message, details) {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - PolicyPlayBook</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .error-container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 600px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          text-align: center;
        }
        .error-icon {
          font-size: 64px;
          color: #dc3545;
          margin-bottom: 20px;
        }
        h1 {
          color: #333;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        p {
          color: #666;
          line-height: 1.6;
          margin: 10px 0;
        }
        .error-details {
          background: #f8f9fa;
          border-left: 4px solid #dc3545;
          padding: 15px;
          margin: 20px 0;
          text-align: left;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          color: #495057;
          word-break: break-word;
        }
        .actions {
          margin-top: 30px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 5px;
          transition: background 0.3s;
        }
        .btn:hover {
          background: #5568d3;
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="error-details">
          <strong>エラー詳細:</strong><br>
          ${details || '詳細情報なし'}
        </div>
        <div class="actions">
          <a href="javascript:window.location.reload()" class="btn">再読み込み</a>
          <a href="mailto:support@example.com" class="btn">サポートに連絡</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          PolicyPlayBook v${APP_CONFIG.version}<br>
          エラー発生時刻: ${new Date().toLocaleString('ja-JP')}
        </p>
      </div>
    </body>
    </html>
  `);
}

/**
 * POST リクエスト処理
 * @param {Object} e - リクエストイベントオブジェクト
 * @return {Object} レスポンスオブジェクト
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    logInfo(`doPost() called with action: ${action}`);
    
    // アクション別処理
    switch (action) {
      case 'getTemplates':
        return getTemplatesByCategory(e.parameter.category);
        
      case 'getVariables':
        return getVariablesByTemplate(e.parameter.templateId);
        
      case 'getOptions':
        return getOptions(e.parameter);

      case 'getTemplateContent':
        return getTemplateContent(e.parameter.templateId);

      case 'generateEmail':
        const variablesParam = e.parameter.variables;
        if (!variablesParam) {
          throw new Error('Variables parameter is required');
        }
        return generateEmailFromTemplate(
          e.parameter.templateId, 
          JSON.parse(variablesParam)
        );
        
      case 'getTemplateCategories':
        return getTemplateCategories();
        
      case 'validateTemplate':
        return validateTemplate(e.parameter.templateId);
        
      case 'getSystemStatus':
        return getSystemStatus();
        
      default:
        throw new Error(`Invalid action: ${action}`);
    }
    
  } catch (error) {
    logError('doPost() error', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * HTML ファイルインクルード
 * @param {string} filename - ファイル名
 * @return {string} HTMLコンテンツ
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    logError(`include() error for file: ${filename}`, error);
    return `<!-- Error loading ${filename}: ${error.message} -->`;
  }
}

/**
 * 初期データ取得
 * @return {Object} 初期データオブジェクト
 */
function getInitialData() {
  try {
    const cacheService = new CacheService();
    const cacheKey = 'initial_data';

    // キャッシュから取得を試行
    let data = cacheService.get(cacheKey);
    if (data) {
      logInfo('Initial data loaded from cache');
      return data;
    }

    // データベースから取得
    const db = new DatabaseService();
    data = {
      categories: db.getTemplateCategories(),
      activeFooter: db.getActiveFooter(),  // アクティブなフッター情報を追加
      systemStatus: getSystemStatus(),
      timestamp: new Date().toISOString()
    };

    // キャッシュに保存
    cacheService.set(cacheKey, data, 30); // 30分間キャッシュ

    logInfo('Initial data loaded from database');
    return data;

  } catch (error) {
    logError('getInitialData() error', error);
    return {
      categories: {},
      activeFooter: null,
      systemStatus: { status: 'error', message: error.message },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * テンプレートカテゴリ取得
 * @return {Object} カテゴリオブジェクト
 */
function getTemplateCategories() {
  try {
    const db = new DatabaseService();
    const categories = db.getTemplateCategories();
    
    logInfo(`getTemplateCategories() returned ${Object.keys(categories).length} categories`);
    return {
      success: true,
      data: categories,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logError('getTemplateCategories() error', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * カテゴリ別テンプレート取得
 * @param {string} category - カテゴリ名
 * @return {Object} テンプレートリスト
 */
function getTemplatesByCategory(category) {
  try {
    if (!category) {
      throw new Error('Category parameter is required');
    }
    
    const db = new DatabaseService();
    const templates = db.getTemplatesByCategory(category);
    
    logInfo(`getTemplatesByCategory(${category}) returned ${templates.length} templates`);
    return {
      success: true,
      data: templates,
      category: category,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logError('getTemplatesByCategory() error', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * テンプレート別変数取得
 * @param {string} templateId - テンプレートID
 * @return {Object} 変数リスト
 */
function getVariablesByTemplate(templateId) {
  try {
    if (!templateId) {
      throw new Error('Template ID parameter is required');
    }
    
    const db = new DatabaseService();
    const variables = db.getVariablesByTemplate(templateId);
    
    logInfo(`getVariablesByTemplate(${templateId}) returned ${variables.length} variables`);
    return {
      success: true,
      data: variables,
      templateId: templateId,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logError('getVariablesByTemplate() error', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 変数別オプション取得
 * @param {Object} params - パラメータ {variableName: string}
 * @return {Object} オプションリスト
 */
function getOptions(params) {
  try {
    const variableName = params.variableName;
    if (!variableName) {
      throw new Error('Variable name parameter is required');
    }

    const db = new DatabaseService();
    const options = db.getOptionsByVariable(variableName);

    logInfo(`getOptions(${variableName}) returned ${options.length} options`);
    return {
      success: true,
      data: options,
      variableName: variableName,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logError('getOptionsByVariable() error', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * テンプレートコンテンツ取得（ライブプレビュー用）
 * @param {string} templateId - テンプレートID
 * @return {Object} テンプレートコンテンツ
 */
function getTemplateContent(templateId) {
  try {
    if (!templateId) {
      throw new Error('Template ID parameter is required');
    }

    const db = new DatabaseService();
    const template = db.getTemplate(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    logInfo(`getTemplateContent(${templateId}) returned template content`);
    return {
      success: true,
      content: template.template_content || '',
      templateId: templateId,
      templateName: template.template_name,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logError('getTemplateContent() error', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * テンプレート取得（エイリアス）
 * フロントエンドから呼び出される短縮名
 * @param {Object} params - パラメータオブジェクト
 * @return {Object} テンプレートリスト
 */
function getTemplates(params) {
  return getTemplatesByCategory(params.category);
}

/**
 * 全テンプレートデータ取得（検索機能用）
 * カテゴリとcontent_nameの組み合わせを全件取得
 * @return {Object} 全テンプレートデータ
 */
function getAllTemplatesData() {
  try {
    const db = new DatabaseService();
    const templatesData = db.getSheetData('templates');

    if (!templatesData || templatesData.length <= 1) {
      throw new Error('No templates data found');
    }

    // ヘッダー行を取得
    const headers = templatesData[0];
    const categoryIndex = headers.indexOf('category');
    const contentNameIndex = headers.indexOf('content_name');
    const templateIdIndex = headers.indexOf('template_id');
    const isActiveIndex = headers.indexOf('is_active');

    if (categoryIndex === -1 || contentNameIndex === -1 || templateIdIndex === -1) {
      throw new Error('Required columns not found in Templates sheet');
    }

    // データ行を処理（ヘッダー行をスキップ）
    const templates = [];
    for (let i = 1; i < templatesData.length; i++) {
      const row = templatesData[i];

      // is_activeがfalseの場合はスキップ
      if (isActiveIndex !== -1 && row[isActiveIndex] === false) {
        continue;
      }

      const category = row[categoryIndex];
      const contentName = row[contentNameIndex];
      const templateId = row[templateIdIndex];

      // 必須データがある行のみ追加
      if (category && contentName && templateId) {
        templates.push({
          category: category,
          contentName: contentName,
          templateId: templateId
        });
      }
    }

    logInfo(`getAllTemplatesData() returned ${templates.length} templates`);

    return {
      success: true,
      data: templates,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logError('getAllTemplatesData() error', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 変数取得（エイリアス）
 * フロントエンドから呼び出される短縮名
 * @param {Object} params - パラメータオブジェクト
 * @return {Object} 変数リスト
 */
function getVariables(params) {
  return getVariablesByTemplate(params.templateId);
}

/**
 * メール生成（エイリアス）
 * フロントエンドから呼び出される短縮名
 * @param {Object} params - パラメータオブジェクト
 * @return {Object} 生成結果
 */
function generateEmail(params) {
  return generateEmailFromTemplate(params.templateId, params.variables);
}

/**
 * メール生成
 * @param {string} templateId - テンプレートID
 * @param {Object} variables - 変数オブジェクト
 * @return {Object} 生成結果
 */
function generateEmailFromTemplate(templateId, variables) {
  try {
    if (!templateId) {
      throw new Error('Template ID parameter is required');
    }
    
    if (!variables || typeof variables !== 'object') {
      throw new Error('Variables parameter is required and must be an object');
    }
    
    const templateEngine = new TemplateEngine();
    const result = templateEngine.generate(templateId, variables);
    
    logInfo(`generateEmailFromTemplate(${templateId}) completed`);
    return {
      ...result,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logError('generateEmailFromTemplate() error', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * テンプレートバリデーション
 * @param {string} templateId - テンプレートID
 * @return {Object} バリデーション結果
 */
function validateTemplate(templateId) {
  try {
    if (!templateId) {
      throw new Error('Template ID parameter is required');
    }
    
    const db = new DatabaseService();
    const template = db.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const validationResult = {
      templateId: templateId,
      isValid: true,
      issues: []
    };
    
    // 必須変数チェック
    try {
      const requiredVars = JSON.parse(template.required_variables || '[]');
      if (!Array.isArray(requiredVars)) {
        validationResult.issues.push('required_variables must be an array');
        validationResult.isValid = false;
      }
    } catch (e) {
      validationResult.issues.push('Invalid required_variables JSON format');
      validationResult.isValid = false;
    }
    
    // テンプレートコンテンツチェック
    if (!template.template_content || template.template_content.trim() === '') {
      validationResult.issues.push('Template content is empty');
      validationResult.isValid = false;
    }
    
    logInfo(`validateTemplate(${templateId}) completed with ${validationResult.issues.length} issues`);
    return {
      success: true,
      data: validationResult,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logError('validateTemplate() error', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * システムステータス取得
 * @return {Object} システムステータス
 */
function getSystemStatus() {
  try {
    const db = new DatabaseService();
    const status = {
      status: 'healthy',
      spreadsheetId: SPREADSHEET_ID,
      sheets: {
        templates: { exists: false, rowCount: 0 },
        variables: { exists: false, rowCount: 0 },
        options: { exists: false, rowCount: 0 }
      },
      timestamp: new Date().toISOString()
    };
    
    // 各シートの存在確認
    try {
      const templatesSheet = db.getTemplatesSheet();
      status.sheets.templates.exists = true;
      status.sheets.templates.rowCount = templatesSheet.getLastRow() - 1; // ヘッダー行を除く
    } catch (e) {
      status.sheets.templates.error = e.message;
    }
    
    try {
      const variablesSheet = db.getVariablesSheet();
      status.sheets.variables.exists = true;
      status.sheets.variables.rowCount = variablesSheet.getLastRow() - 1;
    } catch (e) {
      status.sheets.variables.error = e.message;
    }
    
    try {
      const optionsSheet = db.getOptionsSheet();
      status.sheets.options.exists = true;
      status.sheets.options.rowCount = optionsSheet.getLastRow() - 1;
    } catch (e) {
      status.sheets.options.error = e.message;
    }
    
    // 全体ステータス判定
    const allSheetsExist = status.sheets.templates.exists && 
                          status.sheets.variables.exists && 
                          status.sheets.options.exists;
    
    if (!allSheetsExist) {
      status.status = 'warning';
      status.message = 'Some required sheets are missing';
    }
    
    return status;
    
  } catch (error) {
    logError('getSystemStatus() error', error);
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 設定値取得
 * @param {string} key - 設定キー
 * @return {any} 設定値
 */
function getConfig(key) {
  return APP_CONFIG[key];
}

/**
 * デバッグモード判定
 * @return {boolean} デバッグモードかどうか
 */
function isDebugMode() {
  return APP_CONFIG.debugMode;
}

/**
 * アプリケーションバージョン取得
 * @return {string} バージョン文字列
 */
function getVersion() {
  return APP_CONFIG.version;
}

/**
 * デバッグ: スプレッドシートから直接テンプレートデータを確認
 * @param {string} templateId - テンプレートID（例: "appeal_approved"）
 */
function debugDirectTemplateData(templateId) {
  try {
    const spreadsheetId = SPREADSHEET_ID;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const templatesSheet = spreadsheet.getSheetByName('Templates');

    if (!templatesSheet) {
      Logger.log('❌ Templates sheet not found!');
      return;
    }

    const data = templatesSheet.getDataRange().getValues();
    Logger.log('===== Direct Spreadsheet Check =====');
    Logger.log(`Total rows in Templates sheet: ${data.length - 1}`);

    // ヘッダー行を確認
    Logger.log('\nHeader row:');
    data[0].forEach((header, index) => {
      Logger.log(`  [${index}] ${header}`);
    });

    // 指定されたテンプレートを検索
    const tid = templateId || 'appeal_approved';
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === tid) {
        Logger.log(`\n===== Template '${tid}' found at row ${i + 1} =====`);
        Logger.log(`[0] template_id: "${data[i][0]}"`);
        Logger.log(`[1] category: "${data[i][1]}"`);
        Logger.log(`[2] subcategory: "${data[i][2]}"`);
        Logger.log(`[3] content_name: "${data[i][3]}"`);
        Logger.log(`[4] template_content (length): ${(data[i][4] || '').length} chars`);
        Logger.log(`[5] required_variables: "${data[i][5]}"`);
        Logger.log(`[6] optional_variables: "${data[i][6]}"`);
        Logger.log(`[7] is_active: ${data[i][7]}`);

        // JSONパース確認
        try {
          const required = JSON.parse(data[i][5] || '[]');
          const optional = JSON.parse(data[i][6] || '[]');
          Logger.log('\nParsed JSON:');
          Logger.log(`  Required (${required.length}): ${JSON.stringify(required)}`);
          Logger.log(`  Optional (${optional.length}): ${JSON.stringify(optional)}`);

          if (optional.includes('footer')) {
            Logger.log('  ✅ "footer" is in optional_variables!');
          } else {
            Logger.log('  ❌ "footer" is NOT in optional_variables!');
          }
        } catch (err) {
          Logger.log('❌ JSON parse error: ' + err.message);
        }

        return {
          success: true,
          row: i + 1,
          data: data[i]
        };
      }
    }

    Logger.log(`\n❌ Template '${tid}' not found in spreadsheet`);
    return { success: false, message: 'Template not found' };

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    Logger.log(error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * デバッグ: テンプレートの変数リストを確認
 * @param {string} templateId - テンプレートID（例: "appeal_approved"）
 */
function debugTemplateVariables(templateId) {
  try {
    const db = new DatabaseService();
    const template = db.getTemplate(templateId || 'appeal_approved');

    Logger.log('===== Template Debug =====');
    Logger.log('Template ID: ' + template.template_id);
    Logger.log('Required Variables: ' + template.required_variables);
    Logger.log('Optional Variables: ' + template.optional_variables);

    const variables = db.getVariablesByTemplate(templateId || 'appeal_approved');
    Logger.log('\n===== Variables List =====');
    Logger.log('Total variables: ' + variables.length);

    variables.forEach((v, index) => {
      Logger.log(`\n[${index + 1}] ${v.variableName}`);
      Logger.log(`  - Display Name: ${v.displayName}`);
      Logger.log(`  - Type: ${v.variableType}`);
      Logger.log(`  - Required: ${v.isRequired}`);
      Logger.log(`  - Default Value: "${v.defaultValue}"`);
      Logger.log(`  - Sort Order: ${v.sortOrder}`);
    });

    Logger.log('\n===== Footer Variable Check =====');
    const footerVar = variables.find(v => v.variableName === 'footer');
    if (footerVar) {
      Logger.log('✅ Footer variable found!');
      Logger.log(JSON.stringify(footerVar, null, 2));
    } else {
      Logger.log('❌ Footer variable NOT found!');
    }

    // 直接Variablesシートを確認
    Logger.log('\n===== Direct Variables Sheet Check =====');
    const variablesData = db.getSheetData('variables');
    Logger.log('Total rows in Variables sheet: ' + (variablesData.length - 1));

    for (let i = 1; i < variablesData.length; i++) {
      if (variablesData[i][0] === 'footer') {
        Logger.log('Footer row found at index: ' + i);
        Logger.log('Row data:');
        Logger.log(`  [0] variable_name: "${variablesData[i][0]}"`);
        Logger.log(`  [1] display_name: "${variablesData[i][1]}"`);
        Logger.log(`  [2] variable_type: "${variablesData[i][2]}"`);
        Logger.log(`  [3] is_required: ${variablesData[i][3]}`);
        Logger.log(`  [4] default_value: "${variablesData[i][4]}"`);
        Logger.log(`  [9] is_active: ${variablesData[i][9]}`);
        break;
      }
    }

    return {
      success: true,
      template: template,
      variables: variables,
      footerFound: !!footerVar
    };

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    Logger.log(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 全キャッシュを手動でクリアする（デバッグ用）
 * Google Apps Script エディターから直接実行可能
 */
function clearAllCacheManually() {
  try {
    // PropertiesService から直接すべてのキャッシュを削除
    const props = PropertiesService.getScriptProperties();
    const allProps = props.getProperties();
    let deletedCount = 0;

    Logger.log('===== Clearing All Caches =====');
    Logger.log(`Total properties found: ${Object.keys(allProps).length}`);

    Object.keys(allProps).forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          props.deleteProperty(key);
          deletedCount++;
          Logger.log(`✅ Deleted: ${key}`);
        } catch (err) {
          Logger.log(`⚠️ Failed to delete: ${key}`);
        }
      }
    });

    logInfo(`Manual cache clear: ${deletedCount} properties cleared`);
    Logger.log('\n===== Summary =====');
    Logger.log(`✅ Successfully cleared ${deletedCount} cache entries`);
    Logger.log('All caches have been cleared. Please refresh your web app.');

    return {
      success: true,
      message: `${deletedCount} cache properties cleared`,
      deletedCount: deletedCount,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logError('clearAllCacheManually() error', error);
    Logger.log('❌ Error clearing caches: ' + error.message);
    Logger.log(error.stack);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * スプレッドシート編集時の自動キャッシュクリア（最適化版 - 選択的削除）
 * onEdit シンプルトリガー
 * Templates, Variables, Options, Footers のいずれかのシートで編集があった場合に関連キャッシュのみをクリア
 * @param {Object} e - 編集イベントオブジェクト
 */
function onEdit(e) {
  try {
    if (!e || !e.source || !e.range) {
      return; // イベント情報がない場合は何もしない
    }

    const sheet = e.range.getSheet();
    const sheetName = sheet.getName();
    const editedRow = e.range.getRow();
    const editedColumn = e.range.getColumn();

    // Templates, Variables, Options, Footers シートのいずれかが編集された場合
    if (['Templates', 'Variables', 'Options', 'Footers'].includes(sheetName)) {
      logInfo(`onEdit triggered: ${sheetName} sheet edited at row ${editedRow}, column ${editedColumn}`);

      const cache = CacheService.getScriptCache();
      const keysToDelete = [];

      // シートごとに選択的にキャッシュを削除
      if (sheetName === 'Templates' && editedRow > 1) {
        // テンプレートシートの場合
        try {
          const templateId = sheet.getRange(editedRow, 1).getValue();

          keysToDelete.push(
            `cache_template_${templateId}`,
            `cache_templates_by_category_${sheet.getRange(editedRow, 2).getValue()}`,
            'cache_template_categories',
            'cache_initial_data',
            'cache_sheet_data_templates'
          );
        } catch (err) {
          logWarning('Failed to get template ID, clearing all template caches', err);
          keysToDelete.push(
            'cache_template_categories',
            'cache_initial_data',
            'cache_sheet_data_templates'
          );
        }
      } else if (sheetName === 'Variables' && editedRow > 1) {
        // 変数シートの場合
        try {
          // 変数が変更された場合、関連するテンプレートキャッシュをクリア
          keysToDelete.push(
            'cache_sheet_data_variables',
            'cache_initial_data'
          );
        } catch (err) {
          logWarning('Failed to clear variable caches', err);
          keysToDelete.push('cache_sheet_data_variables', 'cache_initial_data');
        }
      } else if (sheetName === 'Options' && editedRow > 1) {
        // オプションシートの場合
        try {
          const variableName = sheet.getRange(editedRow, 1).getValue();

          keysToDelete.push(
            `cache_options_by_variable_${variableName}`,
            'cache_sheet_data_options'
          );
        } catch (err) {
          logWarning('Failed to get option variable name, clearing option caches', err);
          keysToDelete.push('cache_sheet_data_options');
        }
      } else if (sheetName === 'Footers' && editedRow > 1) {
        // フッターシートの場合
        try {
          const footerId = sheet.getRange(editedRow, 1).getValue();

          keysToDelete.push(
            `cache_footer_${footerId}`,
            'cache_active_footer',
            'cache_sheet_data_footers',
            'cache_initial_data'  // 初期データにフッター情報が含まれるため
          );
        } catch (err) {
          logWarning('Failed to get footer ID, clearing all footer caches', err);
          keysToDelete.push(
            'cache_active_footer',
            'cache_sheet_data_footers',
            'cache_initial_data'
          );
        }
      } else if (editedRow === 1) {
        // ヘッダー行が編集された場合（重大な変更の可能性）
        logWarning(`Header row edited in ${sheetName}, clearing all related caches`);
        keysToDelete.push(
          'cache_template_categories',
          'cache_initial_data',
          `cache_sheet_data_${sheetName.toLowerCase()}`
        );
      }

      // キャッシュを削除
      if (keysToDelete.length > 0) {
        keysToDelete.forEach(key => {
          try {
            cache.remove(key);
          } catch (err) {
            logWarning(`Failed to remove cache key: ${key}`, err);
          }
        });
        logInfo(`Selective cache cleared: ${keysToDelete.length} keys deleted for ${sheetName} row ${editedRow}`);
      }
    }
  } catch (error) {
    logError('onEdit() error', error);
    // エラーがあっても編集操作自体は妨げない
  }
}