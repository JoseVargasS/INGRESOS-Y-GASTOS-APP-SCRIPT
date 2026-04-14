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
  // Asegurar que el mes existe en el resumen antes de obtener datos
  try {
    ensureMonthlyRowExists(month, year);
  } catch (e) {
    console.error("Error al asegurar mes: " + e.toString());
  }

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
 * Inserta una fila de manera cronológica devolviendo el ID de fila
 */
function insertRecordChronologically(sheet, dateObj, amount, detail, type) {
  var lastRow = sheet.getLastRow();
  var targetRow = lastRow + 1;
  var targetDateMs = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
  
  if (lastRow >= 2) {
    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < data.length; i++) {
      var rowDate = data[i][0];
      if (Object.prototype.toString.call(rowDate) === '[object Date]') {
        var rDateMs = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate()).getTime();
        // Insertamos antes del primer registro que tenga una fecha estrictamente mayor
        if (rDateMs > targetDateMs) {
          targetRow = i + 2;
          break;
        }
      }
    }
  }
  
  if (targetRow <= lastRow) {
    sheet.insertRowBefore(targetRow);
  }
  
  var amountIsFormula = String(amount).startsWith('=');
  
  sheet.getRange(targetRow, 1).setValue(dateObj);
  if (amountIsFormula) {
    sheet.getRange(targetRow, 2).setFormula(amount);
  } else {
    sheet.getRange(targetRow, 2).setValue(amount);
  }
  sheet.getRange(targetRow, 3).setValue(detail);
  sheet.getRange(targetRow, 4).setValue(type);
  
  return targetRow;
}

/**
 * Agrega una nueva transacción cronológicamente
 * @param {Object} transactionData - Datos de la transacción
 */
function addTransaction(transactionData) {
  var parts = transactionData.date.split('-');
  var dateObj = new Date(parts[0], parts[1] - 1, parts[2]);

  // Asegurar que el mes existe en el resumen
  try {
    ensureMonthlyRowExists(dateObj.getMonth(), dateObj.getFullYear());
  } catch (e) {
    console.error("Error al asegurar mes al agregar: " + e.toString());
  }

  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) throw new Error("No se encontró la hoja 'INGRESOS Y GASTOS'");
  
  insertRecordChronologically(sheet, dateObj, transactionData.amount, transactionData.detail, transactionData.type);
  
  return { success: true, message: 'Transacción agregada correctamente' };
}

/**
 * Agrega transacción optimizado de forma cronológica - retorna datos formateados
 * @param {Object} transactionData - Datos de la transacción
 * @param {number} month - Mes actual
 * @param {number} year - Año actual
 */
function addTransactionOptimized(transactionData, month, year) {
  var parts = transactionData.date.split('-');
  var dateObj = new Date(parts[0], parts[1] - 1, parts[2]);

  // Asegurar que el mes existe en el resumen
  try {
    ensureMonthlyRowExists(dateObj.getMonth(), dateObj.getFullYear());
  } catch (e) {
    console.error("Error al asegurar mes en optimizado: " + e.toString());
  }

  var sheet = getSheetByName('INGRESOS Y GASTOS');
  
  var targetRow = insertRecordChronologically(sheet, dateObj, transactionData.amount, transactionData.detail, transactionData.type);
  
  // Si coincide con el filtro actual, retornar datos
  if (dateObj.getMonth() === month && dateObj.getFullYear() === year) {
    var formula = sheet.getRange(targetRow, 2).getFormula();
    var actualAmount = sheet.getRange(targetRow, 2).getValue();
    
    return {
      rowId: targetRow,
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
    
    // Al editar, la fecha tal vez cambie. Para simplificar, actualizamos los datos in-place en la fila dada.
    var amountIsFormula = String(transactionData.amount).startsWith('=');
    
    sheet.getRange(rowId, 1).setValue(dateObj);
    if (amountIsFormula) {
      sheet.getRange(rowId, 2).setFormula(transactionData.amount);
    } else {
      sheet.getRange(rowId, 2).setValue(transactionData.amount);
    }
    sheet.getRange(rowId, 3).setValue(transactionData.detail);
    sheet.getRange(rowId, 4).setValue(transactionData.type);
    
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
 * Funciones para mover transacciones arriba/abajo intercambiando filas
 */
function moveTransactionUp(rowId) {
  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) throw new Error("No se encontró la hoja 'INGRESOS Y GASTOS'");
  rowId = parseInt(rowId);
  var target = rowId - 1;
  // Solo se pueden mover a partir de la fila 3 (para ignorar intercambiar con cabecera en fila 1 y 2 que puede estar mal)
  // Pero la tabla de transacciones de Apps Script asume header en la 1.
  if (target < 2) return { success: false, message: 'Ya está en la primera fila' };
  
  swapRows(sheet, rowId, target);
  return { success: true, message: 'Movido arriba', newRowId: target };
}

function moveTransactionDown(rowId) {
  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) throw new Error("No se encontró la hoja 'INGRESOS Y GASTOS'");
  rowId = parseInt(rowId);
  var target = rowId + 1;
  if (target > sheet.getLastRow()) return { success: false, message: 'Ya está en la última fila' };
  
  swapRows(sheet, rowId, target);
  return { success: true, message: 'Movido abajo', newRowId: target };
}

function swapRows(sheet, rowId1, rowId2) {
  // Solo obtener y setear valores planos de Date, Amount, Detail, y Type (Columnas A - D)
  var range1 = sheet.getRange(rowId1, 1, 1, 4);
  var range2 = sheet.getRange(rowId2, 1, 1, 4);
  
  var values1 = range1.getValues()[0];
  var values2 = range2.getValues()[0];
  
  // Escribir los valores de forma plana e ignorar celdas con fórmulas dentro de las primeras 4 columnas que puedan haber existido por error
  range1.setValues([values2]);
  range2.setValues([values1]);
}

/**
 * Función para swap rápido de filas
 */
function swapTransactions(rowId1, rowId2) {
  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) throw new Error("No se encontró la hoja 'INGRESOS Y GASTOS'");
  swapRows(sheet, parseInt(rowId1), parseInt(rowId2));
  return { success: true };
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
 * Asegura que exista una fila para el mes/año en RESUMEN POR MES
 * @param {number} month - Mes (0-11)
 * @param {number} year - Año
 */
function ensureMonthlyRowExists(month, year) {
  var sheet = getSheetByName('RESUMEN POR MES');
  if (!sheet) return;

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
  if (headerRowIndex === -1) headerRowIndex = 0; // Fallback al inicio si no se encuentra

  var exists = false;
  var lastDataRow = headerRowIndex + 1;
  var insertIndex = -1;

  for (var i = headerRowIndex + 1; i < data.length; i++) {
    var val = data[i][0];
    if (Object.prototype.toString.call(val) === '[object Date]') {
      if (val.getMonth() === month && val.getFullYear() === year) {
        exists = true;
        break;
      }
      
      // Encontrar posición cronológica
      var rowDate = new Date(val.getFullYear(), val.getMonth(), 1);
      var targetDate = new Date(year, month, 1);
      
      if (rowDate.getTime() < targetDate.getTime()) {
        lastDataRow = i + 1;
      } else if (insertIndex === -1) {
        insertIndex = i + 1;
      }
    } else if (val) {
      lastDataRow = i + 1;
    }
  }

  if (!exists) {
    if (insertIndex === -1) {
      insertIndex = lastDataRow + 1;
      sheet.insertRowAfter(lastDataRow);
    } else {
      sheet.insertRowBefore(insertIndex);
    }
    
    // Establecer la fecha el primer día del mes
    var newDate = new Date(year, month, 1);
    sheet.getRange(insertIndex, 1).setValue(newDate);
    sheet.getRange(insertIndex, 2).setValue(0); // Ingreso frecuente inicial 0
    
    // Establecer fórmulas dinámicas basadas en la fecha de la Columna A
    var r = insertIndex;
    var formulas = [[
      "=SUMIFS('INGRESOS Y GASTOS'!$B:$B, 'INGRESOS Y GASTOS'!$A:$A, \">=\"&$A" + r + ", 'INGRESOS Y GASTOS'!$A:$A, \"<=\"&EOMONTH($A" + r + ", 0), 'INGRESOS Y GASTOS'!$D:$D, \"INGRESO NO FRECUENTE\")", // C (Ing. No Frec)
      "=B" + r + "+C" + r, // D (Total Ing)
      "=SUMIFS('INGRESOS Y GASTOS'!$B:$B, 'INGRESOS Y GASTOS'!$A:$A, \">=\"&$A" + r + ", 'INGRESOS Y GASTOS'!$A:$A, \"<=\"&EOMONTH($A" + r + ", 0), 'INGRESOS Y GASTOS'!$D:$D, \"GASTO FRECUENTE\")", // E (Gasto Frec)
      "=SUMIFS('INGRESOS Y GASTOS'!$B:$B, 'INGRESOS Y GASTOS'!$A:$A, \">=\"&$A" + r + ", 'INGRESOS Y GASTOS'!$A:$A, \"<=\"&EOMONTH($A" + r + ", 0), 'INGRESOS Y GASTOS'!$D:$D, \"GASTO NO FRECUENTE\")", // F (Gasto No Frec)
      "=E" + r + "+F" + r, // G (Total Gastos)
      "=D" + r + "+G" + r, // H (Neto Mensual)
      "=H" + r + "-B" + r  // I (Total sin Ing Frec)
    ]];
    sheet.getRange(r, 3, 1, 7).setFormulas(formulas);
    
    // Copiar solo el formato de la fila anterior (si existe)
    var templateRow = insertIndex > (headerRowIndex + 1) ? insertIndex - 1 : insertIndex + 1;
    if (templateRow <= sheet.getLastRow() && templateRow > headerRowIndex + 1) {
        sheet.getRange(templateRow, 1, 1, 9).copyTo(sheet.getRange(insertIndex, 1, 1, 9), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    }
  }
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
 * Realiza una búsqueda avanzada de transacciones
 * @param {Object} filters - Filtros { text, minAmount, maxAmount, startDate, endDate }
 * @returns {Array} Resultados
 */
function getAdvancedTransactions(filters) {
  var sheet = getSheetByName('INGRESOS Y GASTOS');
  if (!sheet) return [];
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var results = [];
  
  var text = (filters.text || "").toLowerCase().trim();
  var min = (filters.minAmount !== undefined && filters.minAmount !== "") ? parseFloat(filters.minAmount) : null;
  var max = (filters.maxAmount !== undefined && filters.maxAmount !== "") ? parseFloat(filters.maxAmount) : null;
  
  // Convertir fechas de string a Date si existen
  var start = filters.startDate ? new Date(filters.startDate + "T00:00:00") : null;
  var end = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null;
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var rowDate = row[0];
    var rowAmount = Math.abs(parseFloat(row[1]) || 0);
    var rowDetail = String(row[2] || "").toLowerCase();
    var rowType = String(row[3] || "").toLowerCase();
    
    // 1. Filtro de Texto (en detalle o tipo)
    if (text && rowDetail.indexOf(text) === -1 && rowType.indexOf(text) === -1) continue;
    
    // 2. Filtro de Monto (sobre valor absoluto para encontrar ingresos y gastos)
    if (min !== null && rowAmount < min) continue;
    if (max !== null && rowAmount > max) continue;
    
    // 3. Filtro de Fecha
    if (start || end) {
      var d = (rowDate instanceof Date) ? rowDate : new Date(rowDate);
      if (isNaN(d.getTime())) continue;
      
      if (start && d < start) continue;
      if (end && d > end) continue;
    }
    
    results.push({
      rowId: i + 2, // Compensar encabezado y 0-index
      date: formatDateForSheet(row[0]),
      amount: row[1],
      detail: row[2],
      type: row[3]
    });
  }
  
  // Retornar limitados a 150 para no saturar el DOM, ordenados del más reciente al más antiguo
  return results.reverse().slice(0, 150);
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
