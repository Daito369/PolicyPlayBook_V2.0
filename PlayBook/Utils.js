/**
 * PolicyPlayBook - ユーティリティ関数
 * 汎用的な機能、日付処理、キャッシュ、ログ出力等を提供
 * 
 * @version 1.0.0
 * @author PolicyPlayBook Team
 * @description 拡張性の高いユーティリティライブラリ
 */

// 共通の祝日リスト（2024-2035年）
const HOLIDAY_LIST = [
      // 2024年
      '2024-01-01', '2024-01-08', '2024-02-11', '2024-02-12', '2024-02-23',
      '2024-03-20', '2024-04-29', '2024-05-03', '2024-05-04', '2024-05-05',
      '2024-05-06', '2024-07-15', '2024-08-11', '2024-08-12', '2024-09-16',
      '2024-09-22', '2024-09-23', '2024-10-14', '2024-11-03', '2024-11-04',
      '2024-11-23',
      
      // 2025年
      '2025-01-01', '2025-01-13', '2025-02-11', '2025-02-23', '2025-03-20',
      '2025-04-29', '2025-05-03', '2025-05-04', '2025-05-05', '2025-05-06',
      '2025-07-21', '2025-08-11', '2025-09-15', '2025-09-23', '2025-10-13',
      '2025-11-03', '2025-11-23', '2025-11-24',
      
      // 2026年
      '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20',
      '2026-04-29', '2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06',
      '2026-07-20', '2026-08-11', '2026-09-21', '2026-09-22', '2026-10-12',
      '2026-11-03', '2026-11-23',
      
      // 2027年
      '2027-01-01', '2027-01-11', '2027-02-11', '2027-02-23', '2027-03-21',
      '2027-04-29', '2027-05-03', '2027-05-04', '2027-05-05', '2027-07-19',
      '2027-08-11', '2027-09-20', '2027-09-23', '2027-10-11', '2027-11-03',
      '2027-11-23',
      
      // 2028年
      '2028-01-01', '2028-01-10', '2028-02-11', '2028-02-23', '2028-03-20',
      '2028-04-29', '2028-05-03', '2028-05-04', '2028-05-05', '2028-07-17',
      '2028-08-11', '2028-09-18', '2028-09-22', '2028-10-09', '2028-11-03',
      '2028-11-23',
      
      // 2029年
      '2029-01-01', '2029-01-08', '2029-02-11', '2029-02-12', '2029-02-23',
      '2029-03-20', '2029-04-29', '2029-05-03', '2029-05-04', '2029-05-05',
      '2029-05-06', '2029-07-16', '2029-08-11', '2029-09-17', '2029-09-23',
      '2029-09-24', '2029-10-08', '2029-11-03', '2029-11-23',
      
      // 2030年
      '2030-01-01', '2030-01-14', '2030-02-11', '2030-02-23', '2030-02-24',
      '2030-03-20', '2030-04-29', '2030-05-03', '2030-05-04', '2030-05-05',
      '2030-05-06', '2030-07-15', '2030-08-11', '2030-08-12', '2030-09-16',
      '2030-09-23', '2030-10-14', '2030-11-03', '2030-11-04', '2030-11-23',
      
      // 2031年
      '2031-01-01', '2031-01-13', '2031-02-11', '2031-02-23', '2031-03-20',
      '2031-04-29', '2031-05-03', '2031-05-04', '2031-05-05', '2031-05-06',
      '2031-07-21', '2031-08-11', '2031-09-15', '2031-09-23', '2031-10-13',
      '2031-11-03', '2031-11-23', '2031-11-24',
      
      // 2032年
      '2032-01-01', '2032-01-12', '2032-02-11', '2032-02-23', '2032-03-20',
      '2032-04-29', '2032-05-03', '2032-05-04', '2032-05-05', '2032-07-19',
      '2032-08-11', '2032-09-20', '2032-09-23', '2032-10-11', '2032-11-03',
      '2032-11-23',
      
      // 2033年
      '2033-01-01', '2033-01-10', '2033-02-11', '2033-02-23', '2033-03-20',
      '2033-04-29', '2033-05-03', '2033-05-04', '2033-05-05', '2033-07-18',
      '2033-08-11', '2033-09-19', '2033-09-23', '2033-10-10', '2033-11-03',
      '2033-11-23',
      
      // 2034年
      '2034-01-01', '2034-01-09', '2034-02-11', '2034-02-23', '2034-03-20',
      '2034-04-29', '2034-05-03', '2034-05-04', '2034-05-05', '2034-07-17',
      '2034-08-11', '2034-09-18', '2034-09-23', '2034-10-09', '2034-11-03',
      '2034-11-23',
      
      // 2035年
      '2035-01-01', '2035-01-15', '2035-02-11', '2035-02-12', '2035-02-23',
      '2035-03-20', '2035-04-29', '2035-05-03', '2035-05-04', '2035-05-05',
      '2035-07-16', '2035-08-11', '2035-09-17', '2035-09-23', '2035-09-24',
      '2035-10-08', '2035-11-03', '2035-11-23'
];

/**
 * 営業日計算（日本の祝日対応）
 * @param {Date} startDate - 開始日（省略時は今日）
 * @param {number} addDays - 追加日数（省略時は1）
 * @return {Date} 営業日
 */
function getNextBusinessDay(startDate = null, addDays = 1) {
  try {
    const holidayDates = HOLIDAY_LIST.map(date => new Date(date));
    let date = startDate ? new Date(startDate) : new Date();
    
    // 指定された日数を加算
    date.setDate(date.getDate() + addDays);
    
    // 土日祝日を除外
    while (date.getDay() === 0 || date.getDay() === 6 || 
           holidayDates.some(holiday => holiday.toDateString() === date.toDateString())) {
      date.setDate(date.getDate() + 1);
    }
    
    return date;
    
  } catch (error) {
    logError('getNextBusinessDay() error', error);
    // エラー時は翌日を返す
    const fallbackDate = startDate ? new Date(startDate) : new Date();
    fallbackDate.setDate(fallbackDate.getDate() + addDays);
    return fallbackDate;
  }
}

/**
 * 営業日かどうかを判定
 * @param {Date} date - 判定対象の日付
 * @return {boolean} 営業日かどうか
 */
function isBusinessDay(date) {
  try {
    const checkDate = new Date(date);
    
    // 土日チェック
    if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      return false;
    }
    
    // 祝日チェック
    const dateString = formatDateForHoliday(checkDate);
    
    return !HOLIDAY_LIST.includes(dateString);
    
  } catch (error) {
    logError('isBusinessDay() error', error);
    return false;
  }
}

/**
 * 祝日リスト取得
 * @return {Array} 祝日リスト
 */
function getHolidayList() {
  // 共通の祝日リストを使用
  return HOLIDAY_LIST;
}

/**
 * 祝日用日付フォーマット
 * @param {Date} date - 日付
 * @return {string} YYYY-MM-DD形式の文字列
 */
function formatDateForHoliday(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ECID フォーマット
 * @param {string} ecid - ECIDの文字列
 * @return {string} フォーマット済みECID
 */
function formatECID(ecid) {
  try {
    if (!ecid) return '';
    
    const cleanEcid = ecid.toString().replace(/[^0-9]/g, '');
    
    if (cleanEcid.length !== 10) {
      logError(`Invalid ECID length: ${cleanEcid.length}. Expected 10 digits.`);
      return ecid; // 元の値を返す
    }
    
    return `${cleanEcid.slice(0, 3)}-${cleanEcid.slice(3, 6)}-${cleanEcid.slice(6)}`;
    
  } catch (error) {
    logError('formatECID() error', error);
    return ecid;
  }
}

/**
 * 日本語日付フォーマット
 * @param {Date} date - 日付オブジェクト
 * @param {string} format - フォーマット形式
 * @return {string} フォーマット済み日付
 */
function formatJapaneseDate(date, format = 'M月d日') {
  try {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '';
    }
    
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
    
    // フォーマットパターン置換
    return format
      .replace('YYYY', year)
      .replace('MM', String(month).padStart(2, '0'))
      .replace('M', month)
      .replace('DD', String(day).padStart(2, '0'))
      .replace('D', day)
      .replace('W', dayOfWeek);
      
  } catch (error) {
    logError('formatJapaneseDate() error', error);
    return '';
  }
}

/**
 * 時間フォーマット
 * @param {Date} date - 日付オブジェクト
 * @param {boolean} includeSeconds - 秒を含めるか
 * @return {string} フォーマット済み時間
 */
function formatTime(date, includeSeconds = false) {
  try {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '';
    }
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
    
  } catch (error) {
    logError('formatTime() error', error);
    return '';
  }
}

/**
 * 文字列サニタイズ
 * @param {string} text - 入力文字列
 * @param {Object} options - サニタイズオプション
 * @return {string} サニタイズ済み文字列
 */
function sanitizeString(text, options = {}) {
  try {
    if (!text) return '';
    
    let sanitized = text.toString();
    
    // HTMLタグ除去
    if (options.removeHtml !== false) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    
    // 制御文字除去
    if (options.removeControlChars !== false) {
      sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    }
    
    // 先頭末尾空白除去
    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }
    
    // 長さ制限
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    return sanitized;
    
  } catch (error) {
    logError('sanitizeString() error', error);
    return '';
  }
}

/**
 * 文字列検証
 * @param {string} value - 検証対象の値
 * @param {string} pattern - 検証パターン（正規表現）
 * @return {boolean} 検証結果
 */
function validateString(value, pattern) {
  try {
    if (!value || !pattern) return false;
    
    const regex = new RegExp(pattern);
    return regex.test(value.toString());
    
  } catch (error) {
    logError('validateString() error', error);
    return false;
  }
}

/**
 * メールアドレス検証
 * @param {string} email - メールアドレス
 * @return {boolean} 有効なメールアドレスかどうか
 */
function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validateString(email, emailPattern);
}

/**
 * URL検証
 * @param {string} url - URL
 * @return {boolean} 有効なURLかどうか
 */
function validateUrl(url) {
  const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  return validateString(url, urlPattern);
}

/**
 * 電話番号検証（日本形式）
 * @param {string} phone - 電話番号
 * @return {boolean} 有効な電話番号かどうか
 */
function validatePhoneNumber(phone) {
  const phonePattern = /^(\+81|0)[0-9]{1,4}-?[0-9]{1,4}-?[0-9]{3,4}$/;
  return validateString(phone, phonePattern);
}

/**
 * ログ出力（情報）
 * @param {string} message - ログメッセージ
 * @param {any} data - 追加データ
 */
function logInfo(message, data = null) {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[INFO] ${timestamp} - ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
    
    // デバッグモードの場合、より詳細なログを出力
    if (isDebugMode && isDebugMode()) {
      console.log(`[DEBUG] Stack trace:`, new Error().stack);
    }
    
  } catch (error) {
    console.error('logInfo() error:', error);
  }
}

/**
 * ログ出力（エラー）
 * @param {string} message - ログメッセージ
 * @param {Error} error - エラーオブジェクト
 */
function logError(message, error = null) {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[ERROR] ${timestamp} - ${message}`;
    
    if (error) {
      console.error(logMessage, error);
      
      // エラーの詳細情報を出力
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      
      // 追加情報があれば出力
      if (error.lineNumber) {
        console.error('Line number:', error.lineNumber);
      }
      
    } else {
      console.error(logMessage);
    }
    
  } catch (logError) {
    console.error('logError() error:', logError);
  }
}

/**
 * ログ出力（警告）
 * @param {string} message - ログメッセージ
 * @param {any} data - 追加データ
 */
function logWarning(message, data = null) {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[WARNING] ${timestamp} - ${message}`;
    
    if (data) {
      console.warn(logMessage, data);
    } else {
      console.warn(logMessage);
    }
    
  } catch (error) {
    console.error('logWarning() error:', error);
  }
}

/**
 * パフォーマンス測定開始
 * @param {string} label - 測定ラベル
 */
function startPerformanceTimer(label) {
  try {
    const startTime = new Date().getTime();
    PropertiesService.getScriptProperties().setProperty(`perf_${label}`, startTime.toString());
    logInfo(`Performance timer started: ${label}`);
    
  } catch (error) {
    logError('startPerformanceTimer() error', error);
  }
}

/**
 * パフォーマンス測定終了
 * @param {string} label - 測定ラベル
 * @return {number} 実行時間（ミリ秒）
 */
function endPerformanceTimer(label) {
  try {
    const endTime = new Date().getTime();
    const startTimeStr = PropertiesService.getScriptProperties().getProperty(`perf_${label}`);
    
    if (!startTimeStr) {
      logWarning(`Performance timer not found: ${label}`);
      return 0;
    }
    
    const startTime = parseInt(startTimeStr);
    const duration = endTime - startTime;
    
    logInfo(`Performance timer ended: ${label} - ${duration}ms`);
    
    // クリーンアップ
    PropertiesService.getScriptProperties().deleteProperty(`perf_${label}`);
    
    return duration;
    
  } catch (error) {
    logError('endPerformanceTimer() error', error);
    return 0;
  }
}

/**
 * ランダム文字列生成
 * @param {number} length - 文字列長
 * @param {string} chars - 使用文字セット
 * @return {string} ランダム文字列
 */
function generateRandomString(length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  try {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
    
  } catch (error) {
    logError('generateRandomString() error', error);
    return '';
  }
}

/**
 * UUID生成（簡易版）
 * @return {string} UUID
 */
function generateUUID() {
  try {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
  } catch (error) {
    logError('generateUUID() error', error);
    return '';
  }
}

/**
 * オブジェクトのディープコピー
 * @param {Object} obj - コピー対象オブジェクト
 * @return {Object} コピー済みオブジェクト
 */
function deepCopy(obj) {
  try {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => deepCopy(item));
    }
    
    const copied = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copied[key] = deepCopy(obj[key]);
      }
    }
    
    return copied;
    
  } catch (error) {
    logError('deepCopy() error', error);
    return obj;
  }
}

/**
 * オブジェクトのマージ
 * @param {Object} target - マージ先オブジェクト
 * @param {Object} source - マージ元オブジェクト
 * @return {Object} マージ済みオブジェクト
 */
function mergeObjects(target, source) {
  try {
    const merged = deepCopy(target);
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          merged[key] = mergeObjects(merged[key] || {}, source[key]);
        } else {
          merged[key] = source[key];
        }
      }
    }
    
    return merged;
    
  } catch (error) {
    logError('mergeObjects() error', error);
    return target;
  }
}

/**
 * キャッシュサービス
 */
class CacheService {
  
  constructor() {
    this.cache = PropertiesService.getScriptProperties();
    this.prefix = 'cache_';
  }
  
  /**
   * キャッシュから値を取得
   * @param {string} key - キー
   * @return {any} 値
   */
  get(key) {
    try {
      const cacheKey = this.prefix + key;
      const cached = this.cache.getProperty(cacheKey);
      
      if (!cached) {
        return null;
      }
      
      const data = JSON.parse(cached);
      
      // 期限チェック
      if (data.expiry && data.expiry < Date.now()) {
        this.delete(key);
        return null;
      }
      
      return data.value;
      
    } catch (error) {
      logError(`CacheService.get(${key}) error`, error);
      return null;
    }
  }
  
  /**
   * キャッシュに値を設定
   * @param {string} key - キー
   * @param {any} value - 値
   * @param {number} expiryMinutes - 有効期限（分）
   */
  set(key, value, expiryMinutes = 60) {
    try {
      const cacheKey = this.prefix + key;
      const data = {
        value: value,
        expiry: expiryMinutes ? Date.now() + (expiryMinutes * 60 * 1000) : null,
        created: Date.now()
      };
      
      this.cache.setProperty(cacheKey, JSON.stringify(data));
      
    } catch (error) {
      logError(`CacheService.set(${key}) error`, error);
    }
  }
  
  /**
   * キャッシュから値を削除
   * @param {string} key - キー
   */
  delete(key) {
    try {
      const cacheKey = this.prefix + key;
      this.cache.deleteProperty(cacheKey);
      
    } catch (error) {
      logError(`CacheService.delete(${key}) error`, error);
    }
  }
  
  /**
   * キャッシュの存在確認
   * @param {string} key - キー
   * @return {boolean} 存在するかどうか
   */
  has(key) {
    try {
      const cacheKey = this.prefix + key;
      const cached = this.cache.getProperty(cacheKey);
      
      if (!cached) {
        return false;
      }
      
      const data = JSON.parse(cached);
      
      // 期限チェック
      if (data.expiry && data.expiry < Date.now()) {
        this.delete(key);
        return false;
      }
      
      return true;
      
    } catch (error) {
      logError(`CacheService.has(${key}) error`, error);
      return false;
    }
  }
  
  /**
   * キャッシュクリア
   * @param {string} pattern - キーパターン（省略時は全て）
   */
  clear(pattern = null) {
    try {
      const properties = this.cache.getProperties();
      
      for (const key in properties) {
        if (key.startsWith(this.prefix)) {
          if (!pattern || key.includes(pattern)) {
            this.cache.deleteProperty(key);
          }
        }
      }
      
      logInfo(`Cache cleared${pattern ? ` for pattern: ${pattern}` : ''}`);
      
    } catch (error) {
      logError('CacheService.clear() error', error);
    }
  }
  
  /**
   * キャッシュ統計取得
   * @return {Object} 統計情報
   */
  getStats() {
    try {
      const properties = this.cache.getProperties();
      const stats = {
        totalKeys: 0,
        cacheKeys: 0,
        totalSize: 0,
        expiredKeys: 0,
        validKeys: 0
      };
      
      for (const key in properties) {
        stats.totalKeys++;
        stats.totalSize += properties[key].length;
        
        if (key.startsWith(this.prefix)) {
          stats.cacheKeys++;
          
          try {
            const data = JSON.parse(properties[key]);
            if (data.expiry && data.expiry < Date.now()) {
              stats.expiredKeys++;
            } else {
              stats.validKeys++;
            }
          } catch (e) {
            // 不正なキャッシュデータ
          }
        }
      }
      
      return stats;
      
    } catch (error) {
      logError('CacheService.getStats() error', error);
      return {
        totalKeys: 0,
        cacheKeys: 0,
        totalSize: 0,
        expiredKeys: 0,
        validKeys: 0
      };
    }
  }
}

/**
 * レート制限チェック
 * @param {string} key - 制限キー
 * @param {number} limit - 制限数
 * @param {number} windowMinutes - 制限時間（分）
 * @return {boolean} 制限内かどうか
 */
function checkRateLimit(key, limit = 100, windowMinutes = 60) {
  try {
    const cache = new CacheService();
    const rateLimitKey = `rate_limit_${key}`;
    
    let requests = cache.get(rateLimitKey) || [];
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    // 古いリクエストを削除
    requests = requests.filter(timestamp => now - timestamp < windowMs);
    
    // 制限チェック
    if (requests.length >= limit) {
      return false;
    }
    
    // 新しいリクエストを追加
    requests.push(now);
    cache.set(rateLimitKey, requests, windowMinutes);
    
    return true;
    
  } catch (error) {
    logError('checkRateLimit() error', error);
    return true; // エラー時は制限しない
  }
}

/**
 * 実行時間制限チェック
 * @param {number} maxSeconds - 最大実行時間（秒）
 * @param {Date} startTime - 開始時間
 * @return {boolean} 制限内かどうか
 */
function checkExecutionTimeLimit(maxSeconds = 300, startTime = null) {
  try {
    if (!startTime) {
      startTime = new Date();
      PropertiesService.getScriptProperties().setProperty('execution_start', startTime.getTime().toString());
      return true;
    }
    
    const now = new Date();
    const elapsed = (now.getTime() - startTime.getTime()) / 1000;
    
    return elapsed < maxSeconds;
    
  } catch (error) {
    logError('checkExecutionTimeLimit() error', error);
    return true;
  }
}

/**
 * システムリソース使用量チェック
 * @return {Object} リソース使用量情報
 */
function checkSystemResources() {
  try {
    const startTime = new Date();
    
    // 簡易的なメモリ使用量チェック（オブジェクト作成による）
    const testArray = [];
    for (let i = 0; i < 1000; i++) {
      testArray.push({ id: i, data: 'test' });
    }
    
    const endTime = new Date();
    const processingTime = endTime.getTime() - startTime.getTime();
    
    return {
      processingTime: processingTime,
      memoryTest: testArray.length,
      timestamp: endTime.toISOString(),
      status: processingTime < 1000 ? 'good' : 'warning'
    };
    
  } catch (error) {
    logError('checkSystemResources() error', error);
    return {
      processingTime: -1,
      memoryTest: 0,
      timestamp: new Date().toISOString(),
      status: 'error'
    };
  }
}