/**
 * ============================================
 * BUCKS MANAGER
 * Control de Gastos - Google Apps Script
 * ============================================
 */

/**
 * Punto de entrada para la aplicación web
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
      .setTitle('Bucks Manager')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Incluye archivos HTML externos
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

/**
 * Obtiene la hoja por nombre con manejo de errores
 */
function getSheetByName(name) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      console.error('Hoja no encontrada: ' + name);
    }
    return sheet;
  } catch (e) {
    console.error('Error al obtener hoja ' + name + ': ' + e.toString());
    return null;
  }
}

/**
 * Formatea un objeto Date a string 'dd-MMM-yy' (ej: 02-feb-26)
 */
function formatDateForSheet(dateObj) {
  var months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var day = dateObj.getDate();
  var month = months[dateObj.getMonth()];
  var year = dateObj.getFullYear().toString().substr(-2);
  
  if (day < 10) day = '0' + day;
  
  return day + '-' + month + '-' + year;
}

/**
 * Obtiene transacciones filtradas por mes y año
 * @param {number} month - 0 (Ene) a 11 (Dic)
 * @param {number} year - Año de 4 dígitos
 * @returns {Array} Lista de transacciones
 */
function getTransactions(month, year) {
  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) {
    throw new Error("No se encontró la hoja 'INGRESOS Y GASTOS'");
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  // Obtener datos A2:D
  var range = sheet.getRange(2, 1, lastRow - 1, 4);
  var data = range.getValues();
  var formulas = sheet.getRange(2, 2, lastRow - 1, 1).getFormulas();
  
  var filtered = [];
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var rawDate = row[0];
    var dateObj = null;

    // Parsear fecha
    if (Object.prototype.toString.call(rawDate) === '[object Date]') {
       dateObj = rawDate;
    } else if (typeof rawDate === 'string') {
       var monthsSpan = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
       var parts = rawDate.split('-');
       if (parts.length === 3) {
           var mIndex = monthsSpan.indexOf(parts[1].toLowerCase());
           if (mIndex > -1) {
               var y = parseInt(parts[2]);
               if (y < 100) y += 2000;
               dateObj = new Date(y, mIndex, parseInt(parts[0]));
           } else {
               var d = new Date(rawDate);
               if (!isNaN(d.getTime())) dateObj = d;
           }
       }
    }

    if (!dateObj || isNaN(dateObj.getTime())) continue;
    
    // Filtrar por mes y año
    if (dateObj.getMonth() === month && dateObj.getFullYear() === year) {
       var formula = formulas[i][0];
       
       filtered.push({
         rowId: i + 2,
         date: formatDateForSheet(dateObj),
         rawDate: dateObj.toISOString(),
         amount: row[1],
         formula: formula,
         detail: row[2] || '',
         type: row[3] || 'GASTO NO FRECUENTE'
       });
    }
  }
  
  // Ordenar por ID de fila descendente (más reciente primero)
  filtered.sort(function(a, b) {
    return b.rowId - a.rowId;
  });
  
  return filtered;
}

/**
 * Agrega una nueva transacción
 * @param {Object} transactionData - Datos de la transacción
 */
function addTransaction(transactionData) {
  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) throw new Error("No se encontró la hoja 'INGRESOS Y GASTOS'");
  
  var parts = transactionData.date.split('-');
  var dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  
  sheet.appendRow([
    dateObj,
    transactionData.amount,
    transactionData.detail,
    transactionData.type
  ]);
  
  return { success: true, message: 'Transacción agregada correctamente' };
}

/**
 * Agrega transacción optimizado - retorna datos formateados
 * @param {Object} transactionData - Datos de la transacción
 * @param {number} month - Mes actual
 * @param {number} year - Año actual
 */
function addTransactionOptimized(transactionData, month, year) {
  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) throw new Error("No se encontró la hoja 'INGRESOS Y GASTOS'");
  
  var parts = transactionData.date.split('-');
  var dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  
  sheet.appendRow([
    dateObj,
    transactionData.amount,
    transactionData.detail,
    transactionData.type
  ]);
  
  var lastRow = sheet.getLastRow();
  
  // Si coincide con el filtro actual, retornar datos
  if (dateObj.getMonth() === month && dateObj.getFullYear() === year) {
    var formula = sheet.getRange(lastRow, 2).getFormula();
    var actualAmount = sheet.getRange(lastRow, 2).getValue();
    
    return {
      rowId: lastRow,
      date: formatDateForSheet(dateObj),
      rawDate: dateObj.toISOString(),
      amount: actualAmount,
      formula: formula,
      detail: transactionData.detail,
      type: transactionData.type
    };
  }
  
  return null;
}

/**
 * Elimina una transacción
 * @param {number} rowId - ID de la fila a eliminar
 */
function deleteTransaction(rowId) {
  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) throw new Error("No se encontró la hoja 'INGRESOS Y GASTOS'");
  
  try {
    sheet.deleteRow(rowId);
    return { success: true, message: 'Transacción eliminada correctamente' };
  } catch (e) {
    throw new Error('Error al eliminar: ' + e.toString());
  }
}

function editTransaction(rowId, transactionData) {
  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) throw new Error("No se encontró la hoja 'INGRESOS Y GASTOS'");
  
  var parts = transactionData.date.split('-');
  var dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  
  try {
    rowId = parseInt(rowId);
    sheet.getRange(rowId, 1, 1, 4).setValues([[
      dateObj,
      transactionData.amount,
      transactionData.detail,
      transactionData.type
    ]]);
    
    // Obtener valores actualizados para el retorno optimizado
    var formula = sheet.getRange(rowId, 2).getFormula();
    var actualAmount = sheet.getRange(rowId, 2).getValue();
    
    return {
      rowId: rowId,
      date: formatDateForSheet(dateObj),
      rawDate: dateObj.toISOString(),
      amount: actualAmount,
      formula: formula,
      detail: transactionData.detail,
      type: transactionData.type
    };
  } catch (e) {
    throw new Error('Error al editar: ' + e.toString());
  }
}

/**
 * Obtiene datos del resumen mensual
 * @returns {Array} Resumen por mes
 */
function getMonthlySummaryData() {
  var sheet = getSheetByName('RESUMEN POR MES');
  if (!sheet) {
    console.error('Hoja RESUMEN POR MES no encontrada');
    return [];
  }
  
  var data = sheet.getDataRange().getValues();
  var headerRowIndex = -1;
  
  // Buscar fila de encabezado
  for (var i = 0; i < data.length; i++) {
    var cell = String(data[i][0]).toUpperCase().trim();
    if (cell.indexOf("MES") > -1) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    headerRowIndex = 3;
  }
  
  var summaries = [];
  for (var i = headerRowIndex + 1; i < data.length; i++) {
    var row = data[i];
    var monthVal = row[0];
    if (!monthVal && monthVal !== 0) continue;
    
    if (typeof monthVal === 'string' && monthVal.trim() !== '') {
      if (monthVal.indexOf("undefined") > -1) {
        summaries.push({
          monthYear: "Error en fecha",
          freqIncome: 0, nonFreqIncome: 0, totalIncome: 0,
          freqExpense: 0, nonFreqExpense: 0, totalExpense: 0,
          netMonthly: 0, netNoFreq: 0
        });
        continue;
      }
    }

    if (Object.prototype.toString.call(monthVal) === '[object Date]') {
      var mNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      try {
        monthVal = mNames[monthVal.getMonth()] + " " + monthVal.getFullYear();
      } catch(e) {
        monthVal = String(row[0]);
      }
    } else {
      monthVal = String(monthVal);
    }

    if (String(monthVal).trim() === "") continue;

    summaries.push({
      monthYear: monthVal,
      freqIncome: row[1] || 0,
      nonFreqIncome: row[2] || 0,
      totalIncome: row[3] || 0,
      freqExpense: row[4] || 0,
      nonFreqExpense: row[5] || 0,
      totalExpense: row[6] || 0,
      netMonthly: row[7] || 0,
      netNoFreq: row[8] || 0
    });
  }
  
  return summaries;
}

/**
 * Alias para getMonthlySummaryData (compatibilidad con gráficos)
 */
function getChartData() {
  return getMonthlySummaryData();
}

/**
 * Obtiene estadísticas del mes actual
 * @param {number} month - Mes (0-11)
 * @param {number} year - Año
 * @returns {Object} Estadísticas
 */
function getMonthStats(month, year) {
  var transactions = getTransactions(month, year);
  
  var totalIncome = 0;
  var totalExpense = 0;
  var countIncome = 0;
  var countExpense = 0;
  
  transactions.forEach(function(tx) {
    var amt = Number(tx.amount);
    if (amt > 0) {
      totalIncome += amt;
      countIncome++;
    } else {
      totalExpense += amt;
      countExpense++;
    }
  });
  
  return {
    totalIncome: totalIncome,
    totalExpense: totalExpense,
    balance: totalIncome + totalExpense,
    countIncome: countIncome,
    countExpense: countExpense,
    countTotal: transactions.length
  };
}

/**
 * Busca transacciones por texto
 * @param {string} searchText - Texto a buscar
 * @param {number} limit - Límite de resultados
 */
function searchTransactions(searchText, limit) {
  limit = limit || 50;
  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) return [];
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  var range = sheet.getRange(2, 1, lastRow - 1, 4);
  var data = range.getValues();
  
  var results = [];
  var searchLower = searchText.toLowerCase();
  
  for (var i = 0; i < data.length && results.length < limit; i++) {
    var row = data[i];
    var detail = String(row[2] || '').toLowerCase();
    var type = String(row[3] || '').toLowerCase();
    
    if (detail.indexOf(searchLower) > -1 || type.indexOf(searchLower) > -1) {
      results.push({
        rowId: i + 2,
        date: formatDateForSheet(row[0]),
        amount: row[1],
        detail: row[2],
        type: row[3]
      });
    }
  }
  
  return results;
}

/**
 * Actualiza el Ingreso Frecuente en la hoja de resumen
 * @param {string} monthStr - Nombre corto del mes o completo más año, compatible con getMonthlySummaryData
 * @param {number} amount - Nuevo monto
 */
function updateFreqIncome(monthStr, amount) {
  var sheet = getSheetByName('RESUMEN POR MES');
  if (!sheet) throw new Error('Hoja RESUMEN POR MES no encontrada');
  
  var data = sheet.getDataRange().getValues();
  var headerRowIndex = -1;
  
  // Buscar fila de encabezado
  for (var i = 0; i < data.length; i++) {
    var cell = String(data[i][0]).toUpperCase().trim();
    if (cell.indexOf("MES") > -1) {
      headerRowIndex = i;
      break;
    }
  }
  if (headerRowIndex === -1) headerRowIndex = 3;
  
  // Buscar la fila correspondiente al mes
  var rowIndexToUpdate = -1;
  for (var i = headerRowIndex + 1; i < data.length; i++) {
    var val = data[i][0];
    if (Object.prototype.toString.call(val) === '[object Date]') {
      var mNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      try {
        val = mNames[val.getMonth()] + " " + val.getFullYear();
      } catch(e) {
        val = String(val);
      }
    } else {
      val = String(val);
    }
    
    // Comparación simple, asume que from Frontend enviamos exactamente el mismo formato
    if (val === monthStr) {
      rowIndexToUpdate = i + 1; // 1-based index
      break;
    }
  }
  
  if (rowIndexToUpdate > -1) {
    sheet.getRange(rowIndexToUpdate, 2).setValue(amount); // Columna B es index 2
    return { success: true, message: 'Ingreso frecuente actualizado' };
  } else {
    throw new Error('Mes no encontrado en el resumen');
  }
}
