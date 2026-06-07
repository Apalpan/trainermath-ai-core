const SPREADSHEET_ID = '1FT7gKsw5UKavMafbbtJaRianQi-Lj529Nfecq9IbVcI';

const SESSION_HEADERS = [
  'session_id',
  'created_at',
  'trainer',
  'kind',
  'level',
  'block_or_category',
  'mode',
  'amount',
  'total_time_ms',
  'avg_time_ms',
  'accuracy',
  'correct',
  'incorrect',
  'elo',
  'level_tag',
  'status',
  'weakest_topic',
  'best_topic',
  'recommendation',
];

const ANSWER_HEADERS = [
  'session_id',
  'question_index',
  'trainer',
  'category',
  'block',
  'topic',
  'microtopic',
  'question_type',
  'prompt',
  'selected_answer',
  'correct_answer',
  'is_correct',
  'response_time_ms',
  'error_type',
];

function ensureSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeaders = headers.some((header, index) => current[index] !== header);
  if (needsHeaders) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontFamily('Plus Jakarta Sans')
      .setFontWeight('bold')
      .setBackground('#040F20')
      .setFontColor('#FDFDFD');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

function rowFromObject_(headers, object) {
  return headers.map((header) => object && object[header] !== undefined ? object[header] : '');
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || '{}');
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sessionsSheet = ensureSheet_(spreadsheet, 'Sesiones', SESSION_HEADERS);
  const answersSheet = ensureSheet_(spreadsheet, 'Respuestas', ANSWER_HEADERS);

  if (!payload.session || !payload.answers) {
    throw new Error('Payload incompleto: falta session o answers.');
  }

  sessionsSheet.appendRow(rowFromObject_(SESSION_HEADERS, payload.session));
  const answerRows = payload.answers.map((answer) => rowFromObject_(ANSWER_HEADERS, answer));
  if (answerRows.length) {
    answersSheet
      .getRange(answersSheet.getLastRow() + 1, 1, answerRows.length, ANSWER_HEADERS.length)
      .setValues(answerRows);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, inserted_answers: answerRows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}
