/**
 * PolicyPlayBook - テンプレート処理エンジン
 * テンプレートの解析、変数置換、メール生成を担当
 * 
 * @version 1.0.0
 * @author PolicyPlayBook Team
 * @description 高度なテンプレート処理システム
 */

/**
 * テンプレート処理エンジン
 */
class TemplateEngine {
  
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
  }
  
  /**
   * テンプレートからメール生成
   * @param {string} templateId - テンプレートID
   * @param {Object} variables - 変数オブジェクト
   * @return {Object} 生成結果
   */
  generate(templateId, variables) {
    try {
      logInfo(`TemplateEngine.generate() called with templateId: ${templateId}`);

      // テンプレート取得
      const template = this.getTemplateWithCache(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // 変数の前処理（変換処理を先に実行）
      const processedVariables = this.preprocessVariables(variables);

      // 変数バリデーション（前処理後の変数でチェック）
      this.validateVariables(template, processedVariables);

      // テンプレート処理
      const processedContent = this.processTemplate(template.template_content, processedVariables);

      // 後処理
      const finalContent = this.postProcessContent(processedContent);

      logInfo(`TemplateEngine.generate() completed successfully for ${templateId}`);

      return {
        success: true,
        content: finalContent,
        templateId: templateId,
        templateName: template.template_name,
        category: template.category,
        subcategory: template.subcategory,
        generatedAt: new Date().toISOString(),
        variableCount: Object.keys(processedVariables).length
      };

    } catch (error) {
      logError(`TemplateEngine.generate() error for ${templateId}`, error);
      return {
        success: false,
        error: error.message,
        templateId: templateId,
        generatedAt: new Date().toISOString()
      };
    }
  }
  
  /**
   * キャッシュを使用したテンプレート取得
   * @param {string} templateId - テンプレートID
   * @return {Object|null} テンプレートオブジェクト
   */
  getTemplateWithCache(templateId) {
    const cacheKey = `template_${templateId}`;
    
    // キャッシュから取得を試行
    let template = this.cache.get(cacheKey);
    if (template) {
      logInfo(`Template ${templateId} loaded from cache`);
      return template;
    }
    
    // データベースから取得
    template = this.db.getTemplate(templateId);
    if (template) {
      // キャッシュに保存（30分）
      this.cache.set(cacheKey, template, 30);
      logInfo(`Template ${templateId} loaded from database and cached`);
    }
    
    return template;
  }
  
  /**
   * 変数バリデーション
   * @param {Object} template - テンプレートオブジェクト
   * @param {Object} variables - 変数オブジェクト
   */
  validateVariables(template, variables) {
    try {
      const requiredVars = JSON.parse(template.required_variables || '[]');
      const missingVars = [];
      
      // 必須変数チェック
      for (const varName of requiredVars) {
        const value = variables[varName];
        // 値が null または undefined、あるいは空文字列の場合のみを「未入力」と判定する
        if (value === null || value === undefined || (typeof value !== 'boolean' && value.toString().trim() === '')) {
          missingVars.push(varName);
        }
      }
      
      if (missingVars.length > 0) {
        throw new Error(`Required variables missing: ${missingVars.join(', ')}`);
      }
      
      // 変数値の基本バリデーション
      this.validateVariableValues(variables);
      
    } catch (error) {
      if (error.message.includes('Required variables missing')) {
        throw error;
      }
      throw new Error(`Variable validation failed: ${error.message}`);
    }
  }
  
  /**
   * 変数値の基本バリデーション
   * @param {Object} variables - 変数オブジェクト
   */
  validateVariableValues(variables) {
    for (const [key, value] of Object.entries(variables)) {
      // ECID特別バリデーション
      if (key === 'ecid' && value) {
        // ハイフンを削除して数字のみにする
        const ecidDigits = value.toString().replace(/-/g, '');
        // 10桁の数字かチェック
        if (!/^\d{10}$/.test(ecidDigits)) {
          throw new Error(`Invalid ECID format: ${value}. Must be 10 digits (e.g., 1234567890 or 123-456-7890).`);
        }
      }
      
      // 日付フィールドのバリデーション
      if (key.includes('date') || key.includes('Date')) {
        if (value && !this.isValidDate(value)) {
          throw new Error(`Invalid date format: ${value}`);
        }
      }
      
      // 文字列長制限チェック
      if (typeof value === 'string' && value.length > 10000) {
        throw new Error(`Variable ${key} exceeds maximum length (10000 characters)`);
      }
    }
  }
  
  /**
   * 変数の前処理
   * @param {Object} variables - 変数オブジェクト
   * @return {Object} 前処理済み変数
   */
  preprocessVariables(variables) {
    let processed = { ...variables };

    // ECID フォーマット処理
    if (processed.ecid) {
      processed.formattedECID = formatECID(processed.ecid);
    }

    // ステータス文字列化（statusとstatusTextの両方に設定）
    if (processed.status !== undefined) {
      const statusMap = { '0': '制限付き', '1': '不承認' };
      const statusText = statusMap[processed.status] || processed.status;
      processed.status = statusText;  // status自体を上書き
      processed.statusText = statusText;  // statusTextにも設定（後方互換性）
    }

    // 日付処理
    processed.today = this.formatDate(new Date());

    // 営業日計算
    if (processed.replyDate) {
      processed.formattedReplyDate = this.formatDate(new Date(processed.replyDate));
    } else {
      const nextBusinessDay = getNextBusinessDay();
      processed.formattedReplyDate = this.formatDate(nextBusinessDay);
    }

    // フッター処理（チェックボックスがtrueの場合のみフッター内容を設定）
    if (processed.footer === true || processed.footer === 'true' || processed.footer === 'TRUE') {
      const activeFooter = this.db.getActiveFooter();
      if (activeFooter && activeFooter.footer_content) {
        processed.footer = activeFooter.footer_content;
        logInfo('Footer content loaded and applied');
      } else {
        processed.footer = '';
        logWarning('Footer checkbox is checked but no active footer found');
      }
    } else {
      // チェックされていない場合は空文字に（テンプレート内の{{footer}}を空文字で置換）
      processed.footer = '';
    }

    // 選択肢テキスト変換
    processed = this.convertSelectOptionsToText(processed);

    return processed;
  }
  
  /**
   * 選択肢を表示テキストに変換（完全DB駆動版 - ハードコード削除）
   * @param {Object} variables - 変数オブジェクト
   * @return {Object} 変換済み変数
   */
  convertSelectOptionsToText(variables) {
    const processed = { ...variables };

    // ハードコーディングを完全に排除: Optionsシートから動的に取得
    // すべてのselect/checkbox/radio型変数を自動検出
    try {
      // Optionsシートから全変数名を取得（重複排除）
      const allOptionsData = this.db.getSheetData('options');
      const selectVariableNames = new Set();

      // 2行目以降（データ行）から変数名を抽出
      for (let i = 1; i < allOptionsData.length; i++) {
        const variableName = allOptionsData[i][0]; // 1列目: variable_name
        const isActive = allOptionsData[i][4]; // 5列目: is_active

        if (variableName && isActive === true) {
          selectVariableNames.add(variableName);
        }
      }

      logInfo(`Dynamic select variables detected: ${Array.from(selectVariableNames).join(', ')}`);

      // 検出された変数ごとに変換処理
      for (const varName of selectVariableNames) {
        if (processed[varName] !== undefined) {
          try {
            // DatabaseService を使って Options シートから定義を取得
            const options = this.db.getOptionsByVariable(varName);

            if (options && options.length > 0) {
              // 現在の値を正規化（Boolean → String, Number → String）
              let currentValue = processed[varName];

              // Boolean型の場合は "TRUE"/"FALSE" に変換
              if (typeof currentValue === 'boolean') {
                currentValue = currentValue ? "TRUE" : "FALSE";
              } else {
                currentValue = String(currentValue);
              }

              // option_value と一致する option を探す
              // 両方の値を大文字の文字列に変換して比較（データ型の違いを吸収）
              const matchedOption = options.find(opt =>
                String(opt.value).toUpperCase() === currentValue.toUpperCase()
              );

              // 一致するものが見つかれば、その label に値を置き換える
              if (matchedOption) {
                processed[varName] = matchedOption.label;
                logInfo(`Converted ${varName}: ${currentValue} -> ${matchedOption.label}`);
              } else {
                logWarning(`No matching option found for ${varName}=${currentValue}`);
              }
            }
          } catch (error) {
            logWarning(`Failed to convert ${varName}: ${error.message}`);
            // エラー時は元の値を維持
          }
        }
      }
    } catch (error) {
      logError('Failed to dynamically detect select variables', error);
      // エラー時は変換をスキップして元の値を返す
    }

    return processed;
  }
  
  /**
   * テンプレート処理
   * @param {string} content - テンプレートコンテンツ
   * @param {Object} variables - 変数オブジェクト
   * @return {string} 処理済みコンテンツ
   */
  processTemplate(content, variables) {
    let processed = content;

    // 0. リンク処理 [text](url) 形式 → {{LINK:text::url}} 形式に変換
    processed = this.processLinks(processed);

    // 1. 基本変数置換 {{variableName}} 形式
    processed = this.replaceBasicVariables(processed, variables);

    // 2. 条件分岐処理 {{if condition}}...{{endif}} 形式
    processed = this.processConditionals(processed, variables);

    // 3. ループ処理 {{for item in list}}...{{endfor}} 形式
    processed = this.processLoops(processed, variables);

    // 4. 関数呼び出し {{function(params)}} 形式
    processed = this.processFunctions(processed, variables);

    // 5. 特殊変数処理
    processed = this.processSpecialVariables(processed, variables);

    return processed;
  }

  /**
   * マークダウン形式のリンクを内部形式に変換
   * [text](url) → {{LINK:text::url}}
   * @param {string} content - コンテンツ
   * @return {string} 処理済みコンテンツ
   */
  processLinks(content) {
    // マークダウン形式のリンク: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    return content.replace(linkRegex, (match, text, url) => {
      // URLの妥当性チェック（簡易版）
      const validUrl = url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        // 相対URLまたは無効なURLの場合はそのまま返す
        return match;
      }

      // 内部形式に変換
      return `{{LINK:${text}::${validUrl}}}`;
    });
  }
  
  /**
   * 基本変数置換
   * @param {string} content - コンテンツ
   * @param {Object} variables - 変数オブジェクト
   * @return {string} 置換済みコンテンツ
   */
  replaceBasicVariables(content, variables) {
    let processed = content;
    
    // 変数置換 {{variableName}} 形式
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const replacement = value !== null && value !== undefined ? value.toString() : '';
      processed = processed.replace(regex, replacement);
    }
    
    return processed;
  }
  
  /**
   * 条件分岐処理
   * @param {string} content - コンテンツ
   * @param {Object} variables - 変数オブジェクト
   * @return {string} 処理済みコンテンツ
   */
  processConditionals(content, variables) {
    let processed = content;
    
    // {{if variableName == "value"}}...{{endif}} 形式の処理
    const conditionalRegex = /{{if\s+(\w+)\s*(==|!=|>|<|>=|<=)\s*"([^"]+)"}}(.*?){{endif}}/gs;
    
    processed = processed.replace(conditionalRegex, (match, varName, operator, value, innerContent) => {
      const varValue = variables[varName];
      let condition = false;
      
      switch (operator) {
        case '==':
          condition = varValue == value;
          break;
        case '!=':
          condition = varValue != value;
          break;
        case '>':
          condition = Number(varValue) > Number(value);
          break;
        case '<':
          condition = Number(varValue) < Number(value);
          break;
        case '>=':
          condition = Number(varValue) >= Number(value);
          break;
        case '<=':
          condition = Number(varValue) <= Number(value);
          break;
      }
      
      return condition ? innerContent : '';
    });
    
    // {{if variableName}}...{{endif}} 形式（存在チェック）
    const existenceRegex = /{{if\s+(\w+)}}(.*?){{endif}}/gs;
    processed = processed.replace(existenceRegex, (match, varName, innerContent) => {
      const varValue = variables[varName];
      return varValue && varValue.toString().trim() !== '' ? innerContent : '';
    });
    
    return processed;
  }
  
  /**
   * ループ処理
   * @param {string} content - コンテンツ
   * @param {Object} variables - 変数オブジェクト
   * @return {string} 処理済みコンテンツ
   */
  processLoops(content, variables) {
    let processed = content;
    
    // {{for item in listName}}...{{endfor}} 形式
    const loopRegex = /{{for\s+(\w+)\s+in\s+(\w+)}}(.*?){{endfor}}/gs;
    
    processed = processed.replace(loopRegex, (match, itemVar, listVar, innerContent) => {
      const list = variables[listVar];
      if (!Array.isArray(list)) {
        return '';
      }
      
      return list.map(item => {
        let itemContent = innerContent;
        // アイテム変数を置換
        const itemRegex = new RegExp(`{{\\s*${itemVar}\\s*}}`, 'g');
        itemContent = itemContent.replace(itemRegex, item.toString());
        
        // オブジェクトの場合はプロパティアクセス
        if (typeof item === 'object' && item !== null) {
          for (const [key, value] of Object.entries(item)) {
            const propRegex = new RegExp(`{{\\s*${itemVar}\\.${key}\\s*}}`, 'g');
            itemContent = itemContent.replace(propRegex, value.toString());
          }
        }
        
        return itemContent;
      }).join('');
    });
    
    return processed;
  }
  
  /**
   * 関数呼び出し処理
   * @param {string} content - コンテンツ
   * @param {Object} variables - 変数オブジェクト
   * @return {string} 処理済みコンテンツ
   */
  processFunctions(content, variables) {
    let processed = content;
    
    // {{formatDate(variableName)}} 形式
    const formatDateRegex = /{{formatDate\((\w+)\)}}/g;
    processed = processed.replace(formatDateRegex, (match, varName) => {
      const dateValue = variables[varName];
      if (dateValue) {
        return this.formatDate(new Date(dateValue));
      }
      return '';
    });
    
    // {{formatECID(variableName)}} 形式
    const formatECIDRegex = /{{formatECID\((\w+)\)}}/g;
    processed = processed.replace(formatECIDRegex, (match, varName) => {
      const ecidValue = variables[varName];
      if (ecidValue) {
        return formatECID(ecidValue);
      }
      return '';
    });
    
    // {{upper(variableName)}} 形式
    const upperRegex = /{{upper\((\w+)\)}}/g;
    processed = processed.replace(upperRegex, (match, varName) => {
      const value = variables[varName];
      return value ? value.toString().toUpperCase() : '';
    });
    
    // {{lower(variableName)}} 形式
    const lowerRegex = /{{lower\((\w+)\)}}/g;
    processed = processed.replace(lowerRegex, (match, varName) => {
      const value = variables[varName];
      return value ? value.toString().toLowerCase() : '';
    });
    
    return processed;
  }
  
  /**
   * 特殊変数処理
   * @param {string} content - コンテンツ
   * @param {Object} variables - 変数オブジェクト
   * @return {string} 処理済みコンテンツ
   */
  processSpecialVariables(content, variables) {
    let processed = content;
    
    // 日付関連の特殊変数
    const today = new Date();
    processed = processed.replace(/{{today}}/g, this.formatDate(today));
    processed = processed.replace(/{{now}}/g, today.toISOString());
    processed = processed.replace(/{{timestamp}}/g, today.getTime().toString());
    
    // 営業日関連
    const nextBusinessDay = getNextBusinessDay();
    processed = processed.replace(/{{nextBusinessDay}}/g, this.formatDate(nextBusinessDay));
    
    // システム情報
    processed = processed.replace(/{{version}}/g, getConfig('version'));
    processed = processed.replace(/{{appName}}/g, getConfig('title'));
    
    return processed;
  }
  
  /**
   * コンテンツ後処理
   * @param {string} content - コンテンツ
   * @return {string} 後処理済みコンテンツ
   */
  postProcessContent(content) {
    let processed = content;
    
    // 空行の整理
    processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // 先頭末尾の空白削除
    processed = processed.trim();
    
    // HTMLエスケープ（必要な場合）
    // processed = this.escapeHtml(processed);
    
    return processed;
  }
  
  /**
   * 日付フォーマット
   * @param {Date} date - 日付オブジェクト
   * @return {string} フォーマット済み日付
   */
  formatDate(date) {
    if (!date || !this.isValidDate(date)) {
      return '';
    }
    
    const d = new Date(date);
    return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  }
  
  /**
   * 日付妥当性チェック
   * @param {any} date - 日付値
   * @return {boolean} 妥当な日付かどうか
   */
  isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }
  
  /**
   * HTMLエスケープ
   * @param {string} text - テキスト
   * @return {string} エスケープ済みテキスト
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  /**
   * テンプレート解析
   * @param {string} content - テンプレートコンテンツ
   * @return {Object} 解析結果
   */
  analyzeTemplate(content) {
    const analysis = {
      variables: [],
      conditionals: [],
      loops: [],
      functions: [],
      complexity: 0
    };
    
    // 変数抽出
    const varRegex = /{{([^}]+)}}/g;
    let match;
    while ((match = varRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!analysis.variables.includes(variable)) {
        analysis.variables.push(variable);
      }
    }
    
    // 条件分岐抽出
    const conditionalRegex = /{{if\s+([^}]+)}}/g;
    while ((match = conditionalRegex.exec(content)) !== null) {
      analysis.conditionals.push(match[1].trim());
    }
    
    // ループ抽出
    const loopRegex = /{{for\s+([^}]+)}}/g;
    while ((match = loopRegex.exec(content)) !== null) {
      analysis.loops.push(match[1].trim());
    }
    
    // 関数抽出
    const functionRegex = /{{(\w+)\([^}]*\)}/g;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      if (!analysis.functions.includes(functionName)) {
        analysis.functions.push(functionName);
      }
    }
    
    // 複雑度計算
    analysis.complexity = analysis.variables.length + 
                         analysis.conditionals.length * 2 + 
                         analysis.loops.length * 3 + 
                         analysis.functions.length;
    
    return analysis;
  }
}