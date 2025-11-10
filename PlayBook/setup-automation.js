/**
 * PolicyPlayBook - 自動セットアップスクリプト
 * Google Apps Script プロジェクトの初期化と設定を自動化
 * 
 * @version 1.0.0
 * @author PolicyPlayBook Team
 * @description ワンクリックでシステム全体をセットアップ
 */

/**
 * 自動セットアップメイン関数
 * この関数を実行することで、システム全体が自動的にセットアップされます
 */
function autoSetup() {
  try {
    console.log('PolicyPlayBook 自動セットアップを開始します...');
    
    // 1. Google Sheets データベースを作成
    const spreadsheetId = createDatabase();
    
    // 2. スプレッドシートIDを設定
    updateSpreadsheetId(spreadsheetId);
    
    // 3. Web App をデプロイ
    deployWebApp();
    
    // 4. セットアップ完了通知
    showSetupComplete(spreadsheetId);
    
    console.log('PolicyPlayBook 自動セットアップが完了しました！');
    
  } catch (error) {
    console.error('自動セットアップエラー:', error);
    throw new Error(`セットアップに失敗しました: ${error.message}`);
  }
}

/**
 * Google Sheets データベースを作成
 * @return {string} 作成されたスプレッドシートのID
 */
function createDatabase() {
  try {
    console.log('Google Sheets データベースを作成中...');
    
    // 新しいスプレッドシートを作成
    const spreadsheet = SpreadsheetApp.create('PolicyPlayBook-Database');
    const spreadsheetId = spreadsheet.getId();
    
    console.log(`スプレッドシート作成完了: ${spreadsheetId}`);
    
    // Templates シートを設定
    setupTemplatesSheet(spreadsheet);
    
    // Variables シートを作成・設定
    setupVariablesSheet(spreadsheet);
    
    // Options シートを作成・設定
    setupOptionsSheet(spreadsheet);

    // Footers シートを作成・設定
    setupFootersSheet(spreadsheet);

    // 初期データを投入
    insertInitialData(spreadsheet);
    
    console.log('データベースセットアップ完了');
    return spreadsheetId;
    
  } catch (error) {
    console.error('データベース作成エラー:', error);
    throw error;
  }
}

/**
 * Templates シートを設定
 * @param {Spreadsheet} spreadsheet - スプレッドシートオブジェクト
 */
function setupTemplatesSheet(spreadsheet) {
  try {
    console.log('Templates シートを設定中...');
    
    // 既存のSheet1を Templates に名前変更
    const sheet = spreadsheet.getSheets()[0];
    sheet.setName('Templates');
    
    // ヘッダー行を設定
    const headers = [
      'template_id', 'category', 'subcategory', 'template_name', 'template_content',
      'required_variables', 'optional_variables', 'is_active', 'created_at',
      'updated_at', 'created_by', 'notes'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // ヘッダー行をフォーマット
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    
    // 列幅を調整
    sheet.setColumnWidth(1, 150); // template_id
    sheet.setColumnWidth(2, 120); // category
    sheet.setColumnWidth(3, 120); // subcategory
    sheet.setColumnWidth(4, 200); // template_name
    sheet.setColumnWidth(5, 400); // template_content
    sheet.setColumnWidth(6, 200); // required_variables
    sheet.setColumnWidth(7, 200); // optional_variables
    sheet.setColumnWidth(8, 80);  // is_active
    sheet.setColumnWidth(9, 100); // created_at
    sheet.setColumnWidth(10, 100); // updated_at
    sheet.setColumnWidth(11, 100); // created_by
    sheet.setColumnWidth(12, 200); // notes
    
    // データ検証を設定
    const activeRange = sheet.getRange(2, 8, 1000, 1); // is_active 列
    const validation = SpreadsheetApp.newDataValidation()
      .requireValueInList(['TRUE', 'FALSE'], true)
      .build();
    activeRange.setDataValidation(validation);
    
    console.log('Templates シート設定完了');
    
  } catch (error) {
    console.error('Templates シート設定エラー:', error);
    throw error;
  }
}

/**
 * Variables シートを作成・設定
 * @param {Spreadsheet} spreadsheet - スプレッドシートオブジェクト
 */
function setupVariablesSheet(spreadsheet) {
  try {
    console.log('Variables シートを設定中...');
    
    // 新しいシートを作成
    const sheet = spreadsheet.insertSheet('Variables');
    
    // ヘッダー行を設定
    const headers = [
      'variable_name', 'display_name', 'variable_type', 'is_required', 'default_value',
      'validation_rule', 'placeholder', 'help_text', 'sort_order', 'is_active'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // ヘッダー行をフォーマット
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#34a853');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    
    // 列幅を調整
    sheet.setColumnWidth(1, 150); // variable_name
    sheet.setColumnWidth(2, 150); // display_name
    sheet.setColumnWidth(3, 120); // variable_type
    sheet.setColumnWidth(4, 100); // is_required
    sheet.setColumnWidth(5, 150); // default_value
    sheet.setColumnWidth(6, 150); // validation_rule
    sheet.setColumnWidth(7, 150); // placeholder
    sheet.setColumnWidth(8, 200); // help_text
    sheet.setColumnWidth(9, 100); // sort_order
    sheet.setColumnWidth(10, 80); // is_active
    
    // データ検証を設定
    const typeRange = sheet.getRange(2, 3, 1000, 1); // variable_type 列
    const typeValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(['text', 'email', 'tel', 'number', 'textarea', 'select', 'date', 'datetime-local', 'checkbox', 'radio', 'range'], true)
      .build();
    typeRange.setDataValidation(typeValidation);
    
    const requiredRange = sheet.getRange(2, 4, 1000, 1); // is_required 列
    const requiredValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(['TRUE', 'FALSE'], true)
      .build();
    requiredRange.setDataValidation(requiredValidation);
    
    const activeRange = sheet.getRange(2, 10, 1000, 1); // is_active 列
    const activeValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(['TRUE', 'FALSE'], true)
      .build();
    activeRange.setDataValidation(activeValidation);
    
    console.log('Variables シート設定完了');
    
  } catch (error) {
    console.error('Variables シート設定エラー:', error);
    throw error;
  }
}

/**
 * Options シートを作成・設定
 * @param {Spreadsheet} spreadsheet - スプレッドシートオブジェクト
 */
function setupOptionsSheet(spreadsheet) {
  try {
    console.log('Options シートを設定中...');

    // 新しいシートを作成
    const sheet = spreadsheet.insertSheet('Options');

    // ヘッダー行を設定
    const headers = [
      'variable_name', 'option_value', 'option_label', 'sort_order', 'is_active', 'condition'
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // ヘッダー行をフォーマット
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#ea4335');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    // 列幅を調整
    sheet.setColumnWidth(1, 150); // variable_name
    sheet.setColumnWidth(2, 150); // option_value
    sheet.setColumnWidth(3, 300); // option_label
    sheet.setColumnWidth(4, 100); // sort_order
    sheet.setColumnWidth(5, 80);  // is_active
    sheet.setColumnWidth(6, 200); // condition

    // データ検証を設定
    const activeRange = sheet.getRange(2, 5, 1000, 1); // is_active 列
    const activeValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(['TRUE', 'FALSE'], true)
      .build();
    activeRange.setDataValidation(activeValidation);

    console.log('Options シート設定完了');

  } catch (error) {
    console.error('Options シート設定エラー:', error);
    throw error;
  }
}

/**
 * Footers シートを作成・設定
 * @param {Spreadsheet} spreadsheet - スプレッドシートオブジェクト
 */
function setupFootersSheet(spreadsheet) {
  try {
    console.log('Footers シートを設定中...');

    // 新しいシートを作成
    const sheet = spreadsheet.insertSheet('Footers');

    // ヘッダー行を設定
    const headers = [
      'footer_id', 'footer_name', 'footer_content', 'is_active', 'created_at', 'updated_at', 'notes'
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // ヘッダー行をフォーマット
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#fbbc04');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    // 列幅を調整
    sheet.setColumnWidth(1, 150); // footer_id
    sheet.setColumnWidth(2, 200); // footer_name
    sheet.setColumnWidth(3, 500); // footer_content
    sheet.setColumnWidth(4, 80);  // is_active
    sheet.setColumnWidth(5, 100); // created_at
    sheet.setColumnWidth(6, 100); // updated_at
    sheet.setColumnWidth(7, 200); // notes

    // データ検証を設定
    const activeRange = sheet.getRange(2, 4, 1000, 1); // is_active 列
    const activeValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(['TRUE', 'FALSE'], true)
      .build();
    activeRange.setDataValidation(activeValidation);

    console.log('Footers シート設定完了');

  } catch (error) {
    console.error('Footers シート設定エラー:', error);
    throw error;
  }
}

/**
 * 初期データを投入
 * @param {Spreadsheet} spreadsheet - スプレッドシートオブジェクト
 */
function insertInitialData(spreadsheet) {
  try {
    console.log('初期データを投入中...');

    // Variables シートに初期データを投入
    insertVariablesData(spreadsheet);

    // Options シートに初期データを投入
    insertOptionsData(spreadsheet);

    // Footers シートに初期データを投入
    insertFootersData(spreadsheet);

    // Templates シートに初期データを投入
    insertTemplatesData(spreadsheet);

    console.log('初期データ投入完了');

  } catch (error) {
    console.error('初期データ投入エラー:', error);
    throw error;
  }
}

/**
 * Variables シートに初期データを投入
 * @param {Spreadsheet} spreadsheet - スプレッドシートオブジェクト
 */
function insertVariablesData(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('Variables');
  
  const data = [
    ['contactName', '連絡先名', 'text', true, '', '', '', '顧客の名前を入力してください', 1, true],
    ['myName', '自分の名字', 'text', true, '', '', '', '担当者の名字を入力してください', 2, true],
    ['gozaiOrmousu', '初回連絡はチェック', 'checkbox', false, false, '', '', '初回: 〇〇と申します。 / 2 回目以降: 〇〇でございます。', 3, true],
    ['opening', 'Opening', 'select', true, '0', '', '', '適切なオープニングを選択してください', 4, true],
    ['channel', 'Channel', 'select', true, '0', '', '', '問い合わせチャンネルを選択してください', 5, true],
    ['overview', 'お問い合わせ内容', 'textarea', true, '', '', '', '具体的な問い合わせ内容を記載してください', 6, true],
    ['ecid', 'ECID', 'text', true, '', '^[0-9]{10}$', '1234567890', '10桁のECIDを入力してください（ハイフンなし）', 7, true],
    ['detailedPolicy', 'ポリシー名', 'text', true, '', '', '', '対象のポリシー名を入力してください', 8, true],
    ['status', 'ステータス', 'select', true, '0', '', '', '当初のステータスを選択してください', 9, true],
    ['adtype', '広告タイプ', 'select', true, '0', '', '', 'P-MAXの場合はアセットグループを選択', 10, true],
    ['delayReason', '遅れる理由', 'select', true, '0', '', '', '遅れる理由を選択してください', 11, true],
    ['replyDate', '返信予定日', 'date', true, '', '', '', '返信予定日を選択してください', 12, true],
    ['firstOrNot', '初回でない', 'checkbox', false, 'false', '', '', 'TAT設定が初回でない場合はチェック', 13, true],
    ['selfOrNot', 'Consult返答待ち', 'checkbox', false, 'false', '', '', 'Consult返答待ちの場合はチェック', 14, true],
    ['certName', '認定の種類', 'text', true, '', '', 'オンラインギャンブル関連広告', 'サートの種類を入力（語呂が悪いサートは手動で調整してください）', 15, true],
    ['certEcid', '認定アカウント', 'text', true, '', '', '123-456-7890', '認定されたアカウントの ID を入力してください', 16, true],
    ['certDomain', '認定ドメイン', 'text', true, '', '', 'google.com', '認定されたドメインを入力してください', 17, true],
    ['footer', 'フッターを追加', 'checkbox', false, 'false', '', '', '年末年始やGWなどの営業時間を記載したフッターを追加', 18, true]
  ];

  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

/**
 * Options シートに初期データを投入
 * @param {Spreadsheet} spreadsheet - スプレッドシートオブジェクト
 */
function insertOptionsData(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('Options');

  const data = [
    ['gozaiOrmousu', true, 'と申します', '', true, ''],
    ['gozaiOrmousu', false, 'でございます', '', true, ''],
    ['opening', '0', 'お問い合わせをいただき誠にありがとうございます。', 1, true, ''],
    ['opening', '1', 'ご連絡をお待たせし申し訳ございません。', 2, true, ''],
    ['channel', '0', 'チャットにて', 1, true, ''],
    ['channel', '1', 'お電話にて', 2, true, ''],
    ['channel', '2', 'お問い合わせフォームより', 3, true, ''],
    ['channel', '3', 'メールのご返信にて', 4, true, ''],
    ['status', '0', '制限付き', 1, true, ''],
    ['status', '1', '不承認', 2, true, ''],
    ['adtype', '広告', '広告', 1, true, ''],
    ['adtype', 'アセットグループ', 'アセットグループ', 2, true, ''],
    ['delayReason', '1', '現在確認を行っておりますが、窓口混雑のため調査完了までにお時間を頂戴しております。', 1, true, ''],
    ['delayReason', '2', '現在社内で確認中の状況でございます。', 2, true, ''],
    ['delayReason', '3', '引き続き担当部署へ確認中の状況でございます。', 3, true, '']
  ];

  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

/**
 * Footers シートに初期データを投入
 * @param {Spreadsheet} spreadsheet - スプレッドシートオブジェクト
 */
function insertFootersData(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('Footers');

  const today = new Date().toISOString().split('T')[0];

  // 年末年始用のフッター例
  const newYearFooter = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【年末年始の営業時間のご案内】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

年末年始期間中の営業時間は以下の通りとなります。

■ 休業期間
12月29日（金）～ 1月3日（水）

■ 営業再開
1月4日（木）より通常営業

※上記期間中にいただいたお問い合わせにつきましては、
　営業再開後、順次ご対応させていただきます。

ご不便をおかけいたしますが、何卒ご理解賜りますよう
お願い申し上げます。`;

  const data = [
    [
      'newyear_2025',
      '年末年始の営業時間（2025年）',
      newYearFooter.trim(),
      true,
      today,
      today,
      '年末年始期間に使用するフッター'
    ]
  ];

  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

/**
 * Templates シートに初期データを投入
 * @param {Spreadsheet} spreadsheet - スプレッドシートオブジェクト
 */
function insertTemplatesData(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('Templates');
  
  const reviewApprovedTemplate = `{{contactName}} 様

平素よりお世話になっております。
Google 広告サポートチームの{{myName}}{{gozaiOrmousu}}。

この度は、{{opening}}
{{channel}}頂戴したご質問の内容について、以下のとおりご案内いたします。

【お問い合わせ】
{{overview}}

【回答】
当該アカウント（ID：{{formattedECID}}）にて「{{detailedPolicy}}」で{{statusText}}の{{adtype}}について、担当部署にて再審査を実施いたしました。
その結果、本日 {{today}}時点ですべて「承認済み」ステータスへ変更されております。
{{contactName}}様側でも、実際の承認状況をアカウント画面にてご確認いただけますと幸いです。

この度は、審査結果に不一致が生じ、ご迷惑をおかけし誠に申し訳ございません。

この問題は専門チームに報告済みであり、同様の事態が発生しないよう対策を講じております。
また、承認システムは継続的に改善を重ねており、審査方法をさらに強化し、スムーズなプロセスの構築に努めてまいります。
今後もポリシー準拠に関してお気付きの点がございましたら、お気軽にお問い合わせください。

ご案内は以上でございます。
その他、ご不明な点がございましたらお申し付けください。

何卒よろしくお願い申し上げます。

{{myName}}`;

  const tempReplyTemplate = `{{contactName}} 様

平素よりお世話になっております。
Google 広告サポートチームの{{myName}}{{gozaiOrmousu}}。

この度は、{{opening}}
{{channel}}頂戴したご質問の内容について、{{delayReason}}

お急ぎのところ恐縮ですが、改めて {{formattedReplyDate}} 20 時までにご連絡いたします。
今しばらくお待ちいただけますと幸いです。

何卒よろしくお願い申し上げます。

{{myName}}`;

 const certApprovedTemplate = `{{contactName}} 様

平素よりお世話になっております。
Google 広告サポートチームの{{myName}}{{gozaiOrmousu}}。

この度は、{{certName}}の認定をお申し込みいただきありがとうございます。
上記の承認手続きが完了しましたので、ご報告いたします。

今後、下記お客様 ID および URL にて、{{certName}}の掲載が可能となります。

お客様 ID : {{certEcid}}
表示URL（ドメイン） : {{certDomain}}

【補足】
URL のトップドメイン {{certDomain}} が一致していれば、サブドメインやディレクトリを含めた URL も、再度お申し込みいただくことなくそのままご使用いただけます。

再申し込み不要でそのままご利用いただける例 :
　example.{{certDomain}} - サブドメインの使用
　{{certDomain}}/example - ディレクトリの使用

【広告が [不承認] となっている場合】
審査を完了するためには、広告の 再審査請求のご依頼をお願いいたします。
大変お手数ですが、下記操作手順に沿ってご対応くださいませ。

1. 異議申し立てを行う広告の [ステータス] 列で、表示されている広告ステータスにカーソルを合わせ、[再審査を請求] をクリックします。
2. [再審査請求の理由] で、[判定に対して異議申し立てを行う] を選択します。
3. [次を再審査請求:] で再審査を請求する広告を選択します。
4. [送信] をクリックします。

参照ヘルプページ　[ ポリシー違反のある広告を修正する ]
※ ポリシーに関する決定への再審査請求の項目をご確認くださいませ。

ご案内は以上でございます。
その他、ご不明な点がございましたら、お気軽にお申し付けください。

何卒よろしくお願い申し上げます。

{{myName}}`;

  const today = new Date().toISOString().split('T')[0];
  
  const data = [
    [
      'review_approved',
      '再審査',
      '承認済み（誤審）',
      '再審査→承認済み（誤審）',
      reviewApprovedTemplate,
      '["contactName","myName","gozaiOrmousu","opening","channel","overview","ecid","detailedPolicy","status","adtype"]',
      '[]',
      true,
      today,
      today,
      'System',
      '最も利用頻度の高いメール生成機能'
    ],
    [
      'temp_reply',
      '一時返信',
      '標準',
      '一時返信',
      tempReplyTemplate,
      '["contactName","myName","gozaiOrmousu","opening","channel","delayReason","replyDate"]',
      '[]',
      true,
      today,
      today,
      'System',
      '業務の根幹に関わる重要機能'
    ],
    [
      'cert_approved',
      'Certification（認定）',
      'サート承認',
      '認定が承認された',
      certApprovedTemplate,
      '["contactName","myName","gozaiOrmousu","certName","certEcid","certDomain"]',
      '[]',
      true,
      today,
      today,
      'System',
      '業務の根幹に関わる重要機能'
    ]
  ];
  
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

/**
 * スプレッドシートIDをScript Propertiesに保存（セキュリティ強化版）
 * @param {string} spreadsheetId - 新しいスプレッドシートID
 */
function updateSpreadsheetId(spreadsheetId) {
  try {
    console.log('スプレッドシートIDをScript Propertiesに保存中...');

    // Script Propertiesに保存（セキュアな方法）
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.setProperty('SPREADSHEET_ID', spreadsheetId);

    console.log(`スプレッドシートID保存完了: ${spreadsheetId}`);
    console.log('Code.jsから安全にアクセス可能になりました');

  } catch (error) {
    console.error('スプレッドシートID保存エラー:', error);
    console.log(`手動でScript Propertiesに以下を設定してください:`);
    console.log(`キー: SPREADSHEET_ID`);
    console.log(`値: ${spreadsheetId}`);
  }
}

/**
 * Web App をデプロイ
 */
function deployWebApp() {
  try {
    console.log('Web App デプロイを準備中...');
    
    // 注意: 実際のデプロイはGoogle Apps Script エディターで手動実行が必要
    console.log('Web App のデプロイは以下の手順で実行してください:');
    console.log('1. Google Apps Script エディターを開く');
    console.log('2. 右上の「デプロイ」をクリック');
    console.log('3. 「新しいデプロイ」を選択');
    console.log('4. 種類を「ウェブアプリ」に設定');
    console.log('5. 説明に「PolicyPlayBook v1.0」を入力');
    console.log('6. 実行ユーザーを「自分」に設定');
    console.log('7. アクセス権限を「すべてのユーザー」に設定');
    console.log('8. 「デプロイ」をクリック');
    console.log('9. Web App URL をコピーして保存');
    
    console.log('Web App デプロイ準備完了');
    
  } catch (error) {
    console.error('Web App デプロイエラー:', error);
  }
}

/**
 * セットアップ完了通知を表示
 * @param {string} spreadsheetId - 作成されたスプレッドシートID
 */
function showSetupComplete(spreadsheetId) {
  try {
    console.log('セットアップ完了通知を表示中...');
    
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    
    // HTMLダイアログを作成
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">
          🎉 PolicyPlayBook セットアップ完了！
        </h2>
        
        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin: 0 0 10px 0;">✅ 完了した項目</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Google Sheets データベース作成</li>
            <li>Templates / Variables / Options シート設定</li>
            <li>初期データ投入</li>
            <li>フォーマット設定</li>
            <li>データ検証ルール設定</li>
          </ul>
        </div>
        
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #f57c00; margin: 0 0 10px 0;">📋 次に実行する手順</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>
              <strong>スプレッドシートを確認:</strong><br>
              <a href="${spreadsheetUrl}" target="_blank" style="color: #1a73e8; text-decoration: none;">
                📊 PolicyPlayBook-Database を開く
              </a>
            </li>
            <li>
              <strong>Web App をデプロイ:</strong><br>
              右上の「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
            </li>
            <li>
              <strong>動作確認:</strong><br>
              デプロイされたWeb App URLにアクセスして正常動作を確認
            </li>
          </ol>
        </div>
        
        <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #7b1fa2; margin: 0 0 10px 0;">💡 重要な情報</h3>
          <p style="margin: 0;"><strong>スプレッドシートID:</strong></p>
          <code style="background: #f5f5f5; padding: 5px; border-radius: 4px; font-size: 12px;">
            ${spreadsheetId}
          </code>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
            ※ このIDは自動的にCode.gsに設定されました
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="google.script.host.close()"
                  style="background: #1a73e8; color: white; border: none; padding: 10px 20px;
                         border-radius: 4px; cursor: pointer; font-size: 14px;">
            OK
          </button>
        </div>
      </div>
    `;
    
    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(650)
      .setHeight(500);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'PolicyPlayBook セットアップ完了');
    
    console.log('セットアップ完了通知表示完了');
    
  } catch (error) {
    console.error('セットアップ完了通知エラー:', error);
    
    // フォールバック: コンソールに情報を表示
    console.log('='.repeat(60));
    console.log('🎉 PolicyPlayBook セットアップ完了！');
    console.log('='.repeat(60));
    console.log(`📊 スプレッドシートURL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    console.log(`📋 スプレッドシートID: ${spreadsheetId}`);
    console.log('');
    console.log('次の手順:');
    console.log('1. Web App をデプロイ');
    console.log('2. 動作確認');
    console.log('='.repeat(60));
  }
}

/**
 * 個別テスト用関数群
 */

/**
 * データベース作成のみをテスト
 */
function testCreateDatabase() {
  try {
    console.log('データベース作成テストを開始...');
    const spreadsheetId = createDatabase();
    console.log(`テスト完了: ${spreadsheetId}`);
    return spreadsheetId;
  } catch (error) {
    console.error('データベース作成テストエラー:', error);
    throw error;
  }
}

/**
 * Templates シートのみをテスト
 */
function testTemplatesSheet() {
  try {
    console.log('Templates シートテストを開始...');
    const spreadsheet = SpreadsheetApp.create('Test-Templates');
    setupTemplatesSheet(spreadsheet);
    console.log(`テスト完了: ${spreadsheet.getId()}`);
    return spreadsheet.getId();
  } catch (error) {
    console.error('Templates シートテストエラー:', error);
    throw error;
  }
}

/**
 * Variables シートのみをテスト
 */
function testVariablesSheet() {
  try {
    console.log('Variables シートテストを開始...');
    const spreadsheet = SpreadsheetApp.create('Test-Variables');
    setupVariablesSheet(spreadsheet);
    console.log(`テスト完了: ${spreadsheet.getId()}`);
    return spreadsheet.getId();
  } catch (error) {
    console.error('Variables シートテストエラー:', error);
    throw error;
  }
}

/**
 * Options シートのみをテスト
 */
function testOptionsSheet() {
  try {
    console.log('Options シートテストを開始...');
    const spreadsheet = SpreadsheetApp.create('Test-Options');
    setupOptionsSheet(spreadsheet);
    console.log(`テスト完了: ${spreadsheet.getId()}`);
    return spreadsheet.getId();
  } catch (error) {
    console.error('Options シートテストエラー:', error);
    throw error;
  }
}

/**
 * 初期データ投入のみをテスト
 */
function testInitialData() {
  try {
    console.log('初期データテストを開始...');
    const spreadsheet = SpreadsheetApp.create('Test-InitialData');
    
    // 全シートを設定
    setupTemplatesSheet(spreadsheet);
    setupVariablesSheet(spreadsheet);
    setupOptionsSheet(spreadsheet);
    
    // 初期データを投入
    insertInitialData(spreadsheet);
    
    console.log(`テスト完了: ${spreadsheet.getId()}`);
    return spreadsheet.getId();
  } catch (error) {
    console.error('初期データテストエラー:', error);
    throw error;
  }
}

/**
 * システム全体のヘルスチェック
 */
function healthCheck() {
  try {
    console.log('システムヘルスチェックを開始...');
    
    const results = {
      spreadsheetAccess: false,
      driveAccess: false,
      htmlService: false,
      utilities: false,
      permissions: false
    };
    
    // スプレッドシートアクセステスト
    try {
      const testSheet = SpreadsheetApp.create('HealthCheck-Test');
      testSheet.getSheets()[0].getRange('A1').setValue('Test');
      DriveApp.getFileById(testSheet.getId()).setTrashed(true);
      results.spreadsheetAccess = true;
      console.log('✅ スプレッドシートアクセス: OK');
    } catch (error) {
      console.log('❌ スプレッドシートアクセス: NG');
      console.error(error);
    }
    
    // ドライブアクセステスト
    try {
      const files = DriveApp.getFiles();
      if (files.hasNext()) {
        results.driveAccess = true;
        console.log('✅ ドライブアクセス: OK');
      }
    } catch (error) {
      console.log('❌ ドライブアクセス: NG');
      console.error(error);
    }
    
    // HTMLサービステスト
    try {
      const html = HtmlService.createHtmlOutput('<p>Test</p>');
      results.htmlService = true;
      console.log('✅ HTMLサービス: OK');
    } catch (error) {
      console.log('❌ HTMLサービス: NG');
      console.error(error);
    }
    
    // ユーティリティテスト
    try {
      const date = new Date();
      const formatted = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd');
      results.utilities = true;
      console.log('✅ ユーティリティ: OK');
    } catch (error) {
      console.log('❌ ユーティリティ: NG');
      console.error(error);
    }
    
    // 権限テスト
    try {
      const user = Session.getActiveUser();
      if (user && user.getEmail()) {
        results.permissions = true;
        console.log('✅ 権限: OK');
      }
    } catch (error) {
      console.log('❌ 権限: NG');
      console.error(error);
    }
    
    console.log('ヘルスチェック完了');
    return results;
    
  } catch (error) {
    console.error('ヘルスチェックエラー:', error);
    throw error;
  }
}
