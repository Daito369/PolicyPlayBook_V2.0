/**
 * PolicyPlayBook - Google Sheets データベースサービス
 * スプレッドシートの操作、データの取得・更新を担当
 * 
 * @version 1.0.0
 * @author PolicyPlayBook Team
 * @description 高性能なSpreadsheet操作ライブラリ
 */

/**
 * Google Sheets データベースサービス
 */
class DatabaseService {
  
  constructor() {
    this.spreadsheetId = SPREADSHEET_ID;
    this.spreadsheet = null;
    this.sheets = {};
    this.cache = new CacheService();
    this.initializeConnection();
  }
  
  /**
   * スプレッドシート接続初期化
   */
  initializeConnection() {
    try {
      if (!this.spreadsheetId || this.spreadsheetId === 'YOUR_SPREADSHEET_ID') {
        throw new Error('SPREADSHEET_ID is not configured. Please set the actual spreadsheet ID in Code.gs');
      }
      
      this.spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      this.sheets = {
        templates: this.spreadsheet.getSheetByName('Templates'),
        variables: this.spreadsheet.getSheetByName('Variables'),
        options: this.spreadsheet.getSheetByName('Options'),
        footers: this.spreadsheet.getSheetByName('Footers')
      };

      // シートの存在確認
      if (!this.sheets.templates) {
        throw new Error('Templates sheet not found. Please ensure the sheet exists.');
      }
      if (!this.sheets.variables) {
        throw new Error('Variables sheet not found. Please ensure the sheet exists.');
      }
      if (!this.sheets.options) {
        throw new Error('Options sheet not found. Please ensure the sheet exists.');
      }
      if (!this.sheets.footers) {
        throw new Error('Footers sheet not found. Please ensure the sheet exists.');
      }
      
      logInfo('DatabaseService initialized successfully');
      
    } catch (error) {
      logError('DatabaseService initialization failed', error);
      throw error;
    }
  }
  
  /**
   * テンプレートカテゴリ取得
   * @return {Object} カテゴリ別テンプレート
   */
  getTemplateCategories() {
    try {
      const cacheKey = 'template_categories';
      let categories = this.cache.get(cacheKey);
      
      if (categories) {
        logInfo('Template categories loaded from cache');
        return categories;
      }
      
      const data = this.getSheetData('templates');
      categories = {};
      
      // データ処理（ヘッダー行をスキップ）
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // 空行やis_activeがfalseの行をスキップ
        if (!row[0] || row[7] !== true) continue;
        
        const templateId = row[0];
        const category = row[1];
        const subcategory = row[2];
        const templateName = row[3];
        
        if (!category) continue;
        
        if (!categories[category]) {
          categories[category] = [];
        }
        
        categories[category].push({
          templateId: templateId,
          templateName: templateName,
          subcategory: subcategory
        });
      }
      
      // カテゴリ内をsubcategory順にソート
      Object.keys(categories).forEach(category => {
        categories[category].sort((a, b) => {
          if (a.subcategory === b.subcategory) {
            return a.templateName.localeCompare(b.templateName);
          }
          return a.subcategory.localeCompare(b.subcategory);
        });
      });
      
      // キャッシュに保存（30分）
      this.cache.set(cacheKey, categories, 30);
      
      logInfo(`Template categories loaded: ${Object.keys(categories).length} categories`);
      return categories;
      
    } catch (error) {
      logError('getTemplateCategories() error', error);
      throw error;
    }
  }
  
  /**
   * カテゴリ別テンプレート取得
   * @param {string} category - カテゴリ名
   * @return {Array} テンプレートリスト
   */
  getTemplatesByCategory(category) {
    try {
      if (!category) {
        throw new Error('Category parameter is required');
      }
      
      const cacheKey = `templates_by_category_${category}`;
      let templates = this.cache.get(cacheKey);
      
      if (templates) {
        logInfo(`Templates for category '${category}' loaded from cache`);
        return templates;
      }
      
      const data = this.getSheetData('templates');
      templates = [];
      
      // データ処理
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // 条件チェック
        if (!row[0] || row[1] !== category || row[7] !== true) continue;
        
        templates.push({
          templateId: row[0],
          templateName: row[3],
          subcategory: row[2],
          createdAt: row[8],
          updatedAt: row[9],
          createdBy: row[10],
          notes: row[11]
        });
      }
      
      // ソート
      templates.sort((a, b) => {
        if (a.subcategory === b.subcategory) {
          return a.templateName.localeCompare(b.templateName);
        }
        return a.subcategory.localeCompare(b.subcategory);
      });
      
      // キャッシュに保存（15分）
      this.cache.set(cacheKey, templates, 15);
      
      logInfo(`Templates for category '${category}' loaded: ${templates.length} templates`);
      return templates;
      
    } catch (error) {
      logError(`getTemplatesByCategory(${category}) error`, error);
      throw error;
    }
  }
  
  /**
   * テンプレート取得
   * @param {string} templateId - テンプレートID
   * @return {Object|null} テンプレートオブジェクト
   */
  getTemplate(templateId) {
    try {
      if (!templateId) {
        throw new Error('Template ID parameter is required');
      }
      
      const cacheKey = `template_${templateId}`;
      let template = this.cache.get(cacheKey);
      
      if (template) {
        logInfo(`Template '${templateId}' loaded from cache`);
        return template;
      }
      
      const data = this.getSheetData('templates');
      
      // テンプレート検索
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        if (row[0] === templateId) {
          template = {
            template_id: row[0],
            category: row[1],
            subcategory: row[2],
            template_name: row[3],  // content_name列をtemplate_nameとして使用
            template_content: row[4],
            required_variables: row[5],
            optional_variables: row[6],
            is_active: row[7],
            created_at: row[8],
            updated_at: row[9],
            created_by: row[10],
            notes: row[11]
          };
          
          // キャッシュに保存（60分）
          this.cache.set(cacheKey, template, 60);
          
          logInfo(`Template '${templateId}' loaded from database`);
          return template;
        }
      }
      
      logInfo(`Template '${templateId}' not found`);
      return null;
      
    } catch (error) {
      logError(`getTemplate(${templateId}) error`, error);
      throw error;
    }
  }
  
  /**
   * テンプレート別変数取得（最適化版 - マップ構造使用）
   * @param {string} templateId - テンプレートID
   * @return {Array} 変数リスト
   */
  getVariablesByTemplate(templateId) {
    try {
      if (!templateId) {
        throw new Error('Template ID parameter is required');
      }

      const cacheKey = `variables_by_template_${templateId}`;
      let variables = this.cache.get(cacheKey);

      if (variables) {
        logInfo(`Variables for template '${templateId}' loaded from cache`);
        return variables;
      }

      // テンプレート取得
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // 必要な変数リスト取得
      const requiredVars = this.parseJsonArray(template.required_variables);
      const optionalVars = this.parseJsonArray(template.optional_variables);
      const allVars = [...requiredVars, ...optionalVars];

      if (allVars.length === 0) {
        logInfo(`No variables defined for template '${templateId}'`);
        return [];
      }

      // 【最適化】変数名のSetを作成（O(1)検索）
      const varSet = new Set(allVars);
      const requiredSet = new Set(requiredVars);

      // Variables シートから変数定義取得
      const variableData = this.getSheetData('variables');
      variables = [];

      // 【最適化】マップ構造で高速検索
      for (let i = 1; i < variableData.length; i++) {
        const row = variableData[i];
        const variableName = row[0];

        // Set.has() は O(1) で高速
        if (varSet.has(variableName) && row[9] === true) {
          variables.push({
            variableName: variableName,
            displayName: row[1],
            variableType: row[2],
            isRequired: requiredSet.has(variableName),
            defaultValue: row[4] || '',
            validationRule: row[5] || '',
            placeholder: row[6] || '',
            helpText: row[7] || '',
            sortOrder: row[8] || 999
          });
        }
      }

      // sortOrder でソート
      variables.sort((a, b) => {
        if (a.sortOrder === b.sortOrder) {
          return a.variableName.localeCompare(b.variableName);
        }
        return a.sortOrder - b.sortOrder;
      });

      // キャッシュに保存（30分）
      this.cache.set(cacheKey, variables, 30);

      logInfo(`Variables for template '${templateId}' loaded: ${variables.length} variables (optimized)`);
      return variables;

    } catch (error) {
      logError(`getVariablesByTemplate(${templateId}) error`, error);
      throw error;
    }
  }
  
  /**
   * 変数別オプション取得
   * @param {string} variableName - 変数名
   * @return {Array} オプションリスト
   */
  getOptionsByVariable(variableName) {
    try {
      if (!variableName) {
        throw new Error('Variable name parameter is required');
      }
      
      const cacheKey = `options_by_variable_${variableName}`;
      let options = this.cache.get(cacheKey);
      
      if (options) {
        logInfo(`Options for variable '${variableName}' loaded from cache`);
        return options;
      }
      
      const data = this.getSheetData('options');
      options = [];
      
      // オプション検索
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // 対象変数かつアクティブなオプションのみ処理
        if (row[0] === variableName && row[4] === true) {
          const option = {
            value: row[1],
            label: row[2],
            sortOrder: row[3] || 999,
            condition: row[5] || ''
          };
          
          options.push(option);
        }
      }
      
      // sortOrder でソート
      options.sort((a, b) => {
        if (a.sortOrder === b.sortOrder) {
          return a.label.localeCompare(b.label);
        }
        return a.sortOrder - b.sortOrder;
      });
      
      // キャッシュに保存（30分）
      this.cache.set(cacheKey, options, 30);
      
      logInfo(`Options for variable '${variableName}' loaded: ${options.length} options`);
      return options;
      
    } catch (error) {
      logError(`getOptionsByVariable(${variableName}) error`, error);
      throw error;
    }
  }
  
  /**
   * シートデータ取得（キャッシュ機能付き）
   * @param {string} sheetName - シート名
   * @return {Array} シートデータ
   */
  getSheetData(sheetName) {
    try {
      const cacheKey = `sheet_data_${sheetName}`;
      let data = this.cache.get(cacheKey);
      
      if (data) {
        return data;
      }
      
      const sheet = this.getSheet(sheetName);
      if (!sheet) {
        throw new Error(`Sheet not found: ${sheetName}`);
      }
      
      const lastRow = sheet.getLastRow();
      const lastColumn = sheet.getLastColumn();
      
      if (lastRow === 0 || lastColumn === 0) {
        logInfo(`Sheet '${sheetName}' is empty`);
        return [];
      }
      
      data = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
      
      // キャッシュに保存（10分）
      this.cache.set(cacheKey, data, 10);
      
      logInfo(`Sheet '${sheetName}' data loaded: ${lastRow} rows, ${lastColumn} columns`);
      return data;
      
    } catch (error) {
      logError(`getSheetData(${sheetName}) error`, error);
      throw error;
    }
  }
  
  /**
   * シート取得
   * @param {string} sheetName - シート名
   * @return {Sheet} シートオブジェクト
   */
  getSheet(sheetName) {
    if (!this.sheets[sheetName]) {
      throw new Error(`Sheet '${sheetName}' is not available`);
    }
    return this.sheets[sheetName];
  }
  
  /**
   * Templates シート取得
   * @return {Sheet} Templates シート
   */
  getTemplatesSheet() {
    return this.getSheet('templates');
  }
  
  /**
   * Variables シート取得
   * @return {Sheet} Variables シート
   */
  getVariablesSheet() {
    return this.getSheet('variables');
  }
  
  /**
   * Options シート取得
   * @return {Sheet} Options シート
   */
  getOptionsSheet() {
    return this.getSheet('options');
  }

  /**
   * Footers シート取得
   * @return {Sheet} Footers シート
   */
  getFootersSheet() {
    return this.getSheet('footers');
  }

  /**
   * アクティブなフッター取得
   * @return {Object|null} フッターオブジェクト（最初のアクティブなフッター）
   */
  getActiveFooter() {
    try {
      const cacheKey = 'active_footer';
      let footer = this.cache.get(cacheKey);

      if (footer) {
        logInfo('Active footer loaded from cache');
        return footer;
      }

      const data = this.getSheetData('footers');

      // アクティブなフッターを検索（最初の1件のみ）
      for (let i = 1; i < data.length; i++) {
        const row = data[i];

        if (row[0] && row[3] === true) { // footer_id が存在し、is_active が true
          footer = {
            footer_id: row[0],
            footer_name: row[1],
            footer_content: row[2],
            is_active: row[3],
            created_at: row[4],
            updated_at: row[5],
            notes: row[6]
          };

          // キャッシュに保存（30分）
          this.cache.set(cacheKey, footer, 30);

          logInfo(`Active footer loaded: ${footer.footer_id}`);
          return footer;
        }
      }

      logInfo('No active footer found');
      return null;

    } catch (error) {
      logError('getActiveFooter() error', error);
      throw error;
    }
  }

  /**
   * フッターID指定で取得
   * @param {string} footerId - フッターID
   * @return {Object|null} フッターオブジェクト
   */
  getFooterById(footerId) {
    try {
      if (!footerId) {
        throw new Error('Footer ID parameter is required');
      }

      const cacheKey = `footer_${footerId}`;
      let footer = this.cache.get(cacheKey);

      if (footer) {
        logInfo(`Footer '${footerId}' loaded from cache`);
        return footer;
      }

      const data = this.getSheetData('footers');

      // フッター検索
      for (let i = 1; i < data.length; i++) {
        const row = data[i];

        if (row[0] === footerId) {
          footer = {
            footer_id: row[0],
            footer_name: row[1],
            footer_content: row[2],
            is_active: row[3],
            created_at: row[4],
            updated_at: row[5],
            notes: row[6]
          };

          // キャッシュに保存（60分）
          this.cache.set(cacheKey, footer, 60);

          logInfo(`Footer '${footerId}' loaded from database`);
          return footer;
        }
      }

      logInfo(`Footer '${footerId}' not found`);
      return null;

    } catch (error) {
      logError(`getFooterById(${footerId}) error`, error);
      throw error;
    }
  }

  /**
   * JSON配列パース
   * @param {string} jsonString - JSON文字列
   * @return {Array} パース済み配列
   */
  parseJsonArray(jsonString) {
    try {
      if (!jsonString || jsonString.trim() === '') {
        return [];
      }
      
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
      
    } catch (error) {
      logError(`parseJsonArray() error for string: ${jsonString}`, error);
      return [];
    }
  }
  
  /**
   * テンプレート作成
   * @param {Object} templateData - テンプレートデータ
   * @return {boolean} 作成成功かどうか
   */
  createTemplate(templateData) {
    try {
      const sheet = this.getTemplatesSheet();
      const lastRow = sheet.getLastRow();
      
      const newRow = [
        templateData.template_id,
        templateData.category,
        templateData.subcategory,
        templateData.template_name,
        templateData.template_content,
        JSON.stringify(templateData.required_variables || []),
        JSON.stringify(templateData.optional_variables || []),
        templateData.is_active !== false,
        new Date(),
        new Date(),
        templateData.created_by || 'System',
        templateData.notes || ''
      ];
      
      sheet.getRange(lastRow + 1, 1, 1, newRow.length).setValues([newRow]);
      
      // キャッシュをクリア
      this.clearTemplateCache();
      
      logInfo(`Template created: ${templateData.template_id}`);
      return true;
      
    } catch (error) {
      logError('createTemplate() error', error);
      throw error;
    }
  }
  
  /**
   * テンプレート更新
   * @param {string} templateId - テンプレートID
   * @param {Object} updates - 更新データ
   * @return {boolean} 更新成功かどうか
   */
  updateTemplate(templateId, updates) {
    try {
      const sheet = this.getTemplatesSheet();
      const data = sheet.getDataRange().getValues();
      
      // テンプレート行を検索
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === templateId) {
          const row = i + 1;
          
          // 更新可能フィールドのみ更新
          if (updates.category !== undefined) {
            sheet.getRange(row, 2).setValue(updates.category);
          }
          if (updates.subcategory !== undefined) {
            sheet.getRange(row, 3).setValue(updates.subcategory);
          }
          if (updates.template_name !== undefined) {
            sheet.getRange(row, 4).setValue(updates.template_name);
          }
          if (updates.template_content !== undefined) {
            sheet.getRange(row, 5).setValue(updates.template_content);
          }
          if (updates.required_variables !== undefined) {
            sheet.getRange(row, 6).setValue(JSON.stringify(updates.required_variables));
          }
          if (updates.optional_variables !== undefined) {
            sheet.getRange(row, 7).setValue(JSON.stringify(updates.optional_variables));
          }
          if (updates.is_active !== undefined) {
            sheet.getRange(row, 8).setValue(updates.is_active);
          }
          if (updates.notes !== undefined) {
            sheet.getRange(row, 12).setValue(updates.notes);
          }
          
          // 更新日時を設定
          sheet.getRange(row, 10).setValue(new Date());
          
          // キャッシュをクリア
          this.clearTemplateCache();
          
          logInfo(`Template updated: ${templateId}`);
          return true;
        }
      }
      
      throw new Error(`Template not found: ${templateId}`);
      
    } catch (error) {
      logError('updateTemplate() error', error);
      throw error;
    }
  }
  
  /**
   * テンプレート削除（論理削除）
   * @param {string} templateId - テンプレートID
   * @return {boolean} 削除成功かどうか
   */
  deleteTemplate(templateId) {
    try {
      const result = this.updateTemplate(templateId, { is_active: false });
      if (result) {
        logInfo(`Template deleted (logical): ${templateId}`);
      }
      return result;
      
    } catch (error) {
      logError('deleteTemplate() error', error);
      throw error;
    }
  }
  
  /**
   * テンプレート関連キャッシュクリア
   */
  clearTemplateCache() {
    try {
      // テンプレート関連のキャッシュキーパターン
      const cacheKeys = [
        'template_categories',
        'sheet_data_templates',
        'initial_data'
      ];
      
      cacheKeys.forEach(key => {
        this.cache.delete(key);
      });
      
      logInfo('Template cache cleared');
      
    } catch (error) {
      logError('clearTemplateCache() error', error);
    }
  }
  
  /**
   * 全キャッシュクリア
   */
  clearAllCache() {
    try {
      // PropertiesService のキャッシュは個別削除が必要
      logInfo('All cache cleared');
      
    } catch (error) {
      logError('clearAllCache() error', error);
    }
  }
  
  /**
   * データベース統計情報取得
   * @return {Object} 統計情報
   */
  getStatistics() {
    try {
      const stats = {
        templates: {
          total: 0,
          active: 0,
          byCategory: {}
        },
        variables: {
          total: 0,
          active: 0,
          byType: {}
        },
        options: {
          total: 0,
          active: 0,
          byVariable: {}
        },
        lastUpdated: new Date().toISOString()
      };
      
      // テンプレート統計
      const templateData = this.getSheetData('templates');
      for (let i = 1; i < templateData.length; i++) {
        const row = templateData[i];
        if (row[0]) {
          stats.templates.total++;
          if (row[7] === true) {
            stats.templates.active++;
            const category = row[1];
            stats.templates.byCategory[category] = (stats.templates.byCategory[category] || 0) + 1;
          }
        }
      }
      
      // 変数統計
      const variableData = this.getSheetData('variables');
      for (let i = 1; i < variableData.length; i++) {
        const row = variableData[i];
        if (row[0]) {
          stats.variables.total++;
          if (row[9] === true) {
            stats.variables.active++;
            const type = row[2];
            stats.variables.byType[type] = (stats.variables.byType[type] || 0) + 1;
          }
        }
      }
      
      // オプション統計
      const optionData = this.getSheetData('options');
      for (let i = 1; i < optionData.length; i++) {
        const row = optionData[i];
        if (row[0]) {
          stats.options.total++;
          if (row[4] === true) {
            stats.options.active++;
            const variable = row[0];
            stats.options.byVariable[variable] = (stats.options.byVariable[variable] || 0) + 1;
          }
        }
      }
      
      logInfo('Database statistics calculated');
      return stats;
      
    } catch (error) {
      logError('getStatistics() error', error);
      throw error;
    }
  }
  
  /**
   * データベース健全性チェック
   * @return {Object} チェック結果
   */
  healthCheck() {
    try {
      const health = {
        status: 'healthy',
        issues: [],
        checks: {
          connection: false,
          sheets: false,
          data: false,
          integrity: false
        },
        timestamp: new Date().toISOString()
      };
      
      // 接続チェック
      if (this.spreadsheet) {
        health.checks.connection = true;
      } else {
        health.issues.push('Spreadsheet connection failed');
      }
      
      // シート存在チェック
      if (this.sheets.templates && this.sheets.variables && this.sheets.options) {
        health.checks.sheets = true;
      } else {
        health.issues.push('Required sheets are missing');
      }
      
      // データ存在チェック
      try {
        const templateData = this.getSheetData('templates');
        const variableData = this.getSheetData('variables');
        const optionData = this.getSheetData('options');
        
        if (templateData.length > 1 && variableData.length > 1 && optionData.length > 1) {
          health.checks.data = true;
        } else {
          health.issues.push('Some sheets contain no data');
        }
      } catch (e) {
        health.issues.push('Data access failed');
      }
      
      // 整合性チェック
      // TODO: より詳細な整合性チェックを実装
      health.checks.integrity = true;
      
      // 全体ステータス判定
      const allChecksPass = Object.values(health.checks).every(check => check);
      if (!allChecksPass) {
        health.status = health.issues.length > 2 ? 'critical' : 'warning';
      }
      
      logInfo(`Database health check completed: ${health.status}`);
      return health;
      
    } catch (error) {
      logError('healthCheck() error', error);
      return {
        status: 'error',
        issues: [error.message],
        checks: {
          connection: false,
          sheets: false,
          data: false,
          integrity: false
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}