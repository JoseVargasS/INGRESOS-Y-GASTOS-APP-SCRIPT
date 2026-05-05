# Bucks Manager

Bucks Manager es una app web de finanzas personales construida con Google Apps Script y Google Sheets. La hoja de calculo funciona como base de datos privada, mientras que la interfaz ofrece una experiencia tipo app para registrar movimientos, revisar metricas, buscar transacciones y analizar graficos mensuales/anuales.

Los datos se quedan dentro de tu cuenta de Google. No hay servidor propio, base de datos externa ni backend adicional.

## Que incluye

- Registro de ingresos y gastos desde una interfaz web.
- Edicion, eliminacion, reordenamiento y restauracion rapida de movimientos.
- Clasificacion por tipo:
  - `INGRESO FRECUENTE`
  - `INGRESO NO FRECUENTE`
  - `GASTO FRECUENTE`
  - `GASTO NO FRECUENTE`
- Tabla mensual filtrada por mes y anio.
- KPIs del mes: ingresos, gastos, balance y subtotales frecuentes/no frecuentes.
- Analisis anual e interanual con graficos Chart.js.
- Busqueda avanzada por texto, monto y rango de fechas.
- Tema claro/oscuro con fuente DM Sans.
- Optimizacion visual para escritorio y movil.
- Creacion automatica de filas mensuales en la hoja de resumen.

## Archivos del proyecto

| Archivo | Uso |
| --- | --- |
| `Code.gs` | Backend de Apps Script. Lee/escribe en Google Sheets, crea filas mensuales, calcula datos y expone funciones al frontend. |
| `Index.html` | Estructura principal de la app. Carga estilos, scripts, Chart.js, Font Awesome y Google Fonts. |
| `Styles.html` | Estilos visuales, temas, responsive layout, tabla, skeleton loaders y graficos. |
| `Scripts.html` | Logica del cliente: navegacion, formularios, tabla, busqueda, graficos, cache y llamadas a `google.script.run`. |
| `icon.png` | Icono de la app/PWA. |

## Requisitos

- Una cuenta de Google.
- Un archivo de Google Sheets.
- Acceso a `Extensiones > Apps Script`.
- Permisos para autorizar el script la primera vez.

## Estructura obligatoria de Google Sheets

La app espera dos pestanias con estos nombres exactos:

1. `INGRESOS Y GASTOS`
2. `RESUMEN POR MES`

Respeta mayusculas, espacios y tildes tal como aparecen arriba.

### Hoja `INGRESOS Y GASTOS`

Fila 1:

| A | B | C | D |
| --- | --- | --- | --- |
| Fecha | Monto | Detalle | Tipo |

Uso de columnas:

- `Fecha`: fecha real de Google Sheets. Ejemplo: `29/04/2026`.
- `Monto`: numero. Los ingresos deben ser positivos y los gastos negativos.
- `Detalle`: descripcion libre del movimiento.
- `Tipo`: uno de los cuatro tipos soportados por la app.

Ejemplo:

| Fecha | Monto | Detalle | Tipo |
| --- | ---: | --- | --- |
| 29/04/2026 | -35.00 | Pedido de suplementos | GASTO NO FRECUENTE |
| 29/04/2026 | -69.00 | Internet | GASTO FRECUENTE |
| 29/04/2026 | 176.33 | Interes prestamo | INGRESO NO FRECUENTE |

### Hoja `RESUMEN POR MES`

Fila 1 recomendada:

| A | B | C | D | E | F | G | H | I |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MES | INGRESO FRECUENTE | INGRESO NO FRECUENTE | TOTAL INGRESOS | GASTO FRECUENTE | GASTO NO FRECUENTE | TOTAL GASTOS | NETO MENSUAL | NETO SIN ING FRECUENTE |

Uso de columnas:

- `MES`: primer dia del mes como fecha real. Ejemplo: `01/04/2026`.
- `INGRESO FRECUENTE`: monto fijo mensual que editas desde la app.
- `INGRESO NO FRECUENTE`: formula automatica desde `INGRESOS Y GASTOS`.
- `TOTAL INGRESOS`: suma de ingreso frecuente + ingreso no frecuente.
- `GASTO FRECUENTE`: formula automatica desde `INGRESOS Y GASTOS`.
- `GASTO NO FRECUENTE`: formula automatica desde `INGRESOS Y GASTOS`.
- `TOTAL GASTOS`: suma de gastos frecuentes + no frecuentes.
- `NETO MENSUAL`: ingresos + gastos.
- `NETO SIN ING FRECUENTE`: neto mensual sin contar el ingreso frecuente.

La app puede crear automaticamente las filas mensuales que falten. Para que lo haga bien, la columna A debe tener una cabecera que contenga la palabra `MES`.

## Iniciar desde cero con una hoja en blanco

1. Crea un archivo nuevo en Google Sheets.
2. Renombra la primera pestania como `INGRESOS Y GASTOS`.
3. Crea una segunda pestania llamada `RESUMEN POR MES`.
4. En `INGRESOS Y GASTOS`, escribe en la fila 1:
   `Fecha`, `Monto`, `Detalle`, `Tipo`.
5. En `RESUMEN POR MES`, escribe en la fila 1:
   `MES`, `INGRESO FRECUENTE`, `INGRESO NO FRECUENTE`, `TOTAL INGRESOS`, `GASTO FRECUENTE`, `GASTO NO FRECUENTE`, `TOTAL GASTOS`, `NETO MENSUAL`, `NETO SIN ING FRECUENTE`.
6. Selecciona la columna A de ambas hojas y aplica formato de fecha.
7. Selecciona las columnas de montos y aplica formato moneda, por ejemplo soles `S/`.
8. Abre `Extensiones > Apps Script`.
9. Copia los archivos del proyecto en Apps Script:
   - `Code.gs`
   - `Index.html`
   - `Styles.html`
   - `Scripts.html`
10. Sube `icon.png` si quieres conservar el icono.
11. Guarda el proyecto.
12. Ejecuta o despliega la app web.
13. Abre la app y entra al mes actual. Si la fila del mes no existe en `RESUMEN POR MES`, el backend la crea automaticamente.
14. Registra tu primer movimiento desde la app.

Recomendacion: deja que la app cree la primera fila mensual. Es el camino mas limpio porque tambien inserta las formulas.

Si prefieres empezar con una fila ya visible en el resumen, creala completa debajo de los encabezados. Ejemplo para abril de 2026 en la fila 2:

| Columna | Valor/formula |
| --- | --- |
| A2 | `01/04/2026` |
| B2 | `0` |
| C2 | `=SUMIFS('INGRESOS Y GASTOS'!$B:$B,'INGRESOS Y GASTOS'!$A:$A,">="&$A2,'INGRESOS Y GASTOS'!$A:$A,"<="&EOMONTH($A2,0),'INGRESOS Y GASTOS'!$D:$D,"INGRESO NO FRECUENTE")` |
| D2 | `=B2+C2` |
| E2 | `=SUMIFS('INGRESOS Y GASTOS'!$B:$B,'INGRESOS Y GASTOS'!$A:$A,">="&$A2,'INGRESOS Y GASTOS'!$A:$A,"<="&EOMONTH($A2,0),'INGRESOS Y GASTOS'!$D:$D,"GASTO FRECUENTE")` |
| F2 | `=SUMIFS('INGRESOS Y GASTOS'!$B:$B,'INGRESOS Y GASTOS'!$A:$A,">="&$A2,'INGRESOS Y GASTOS'!$A:$A,"<="&EOMONTH($A2,0),'INGRESOS Y GASTOS'!$D:$D,"GASTO NO FRECUENTE")` |
| G2 | `=E2+F2` |
| H2 | `=D2+G2` |
| I2 | `=H2-B2` |

Para los meses siguientes, la app puede insertar nuevas filas con formulas automaticamente.

## Despliegue como aplicacion web

1. En Apps Script, haz clic en `Implementar > Nueva implementacion`.
2. Selecciona el tipo `Aplicacion web`.
3. Configura:
   - `Ejecutar como`: `Yo`.
   - `Quien tiene acceso`: `Solo yo` para uso privado, o la opcion que necesites.
4. Haz clic en `Implementar`.
5. Autoriza los permisos solicitados por Google.
6. Abre la URL generada.

Cada vez que cambies codigo en Apps Script, crea una nueva version de implementacion o actualiza la implementacion existente para ver los cambios en produccion.

## Flujo de uso recomendado

1. Abre la app.
2. Elige el anio y mes desde el sidebar o los controles moviles.
3. Registra ingresos y gastos desde el formulario.
4. Usa tipos frecuentes para movimientos recurrentes y tipos no frecuentes para eventos puntuales.
5. Edita el ingreso frecuente mensual desde la tarjeta de KPI correspondiente.
6. Revisa la tabla mensual para detalles.
7. Usa `Analisis` para ver comparativas anuales, graficos y tendencias.
8. Usa la busqueda avanzada para encontrar movimientos historicos.

## Convencion de montos

- Ingresos: numeros positivos. Ejemplo: `2500`.
- Gastos: numeros negativos. Ejemplo: `-35`.
- La interfaz puede ayudar a aplicar el signo segun el tipo elegido, pero la hoja debe conservar esa convencion.
- El campo monto admite formulas simples cuando se guardan como formula de Sheets. Ejemplo: `=20+15+7.5`.

## Tipos soportados

Usa exactamente estos valores en la columna `Tipo`:

| Tipo | Color/lectura en app | Uso |
| --- | --- | --- |
| `INGRESO FRECUENTE` | Verde | Sueldo u otros ingresos fijos. |
| `INGRESO NO FRECUENTE` | Verde | Intereses, devoluciones, ventas, bonos. |
| `GASTO FRECUENTE` | Rojo | Internet, suscripciones, servicios, alquiler. |
| `GASTO NO FRECUENTE` | Neutro con acento amarillo | Compras puntuales, pedidos, gastos variables. |

## Como funciona el resumen mensual

Cuando la app necesita un mes, `Code.gs` revisa `RESUMEN POR MES`.

Si el mes no existe:

- Inserta una fila en orden cronologico.
- Coloca el primer dia del mes en la columna A.
- Inicializa `INGRESO FRECUENTE` en `0`.
- Agrega formulas `SUMIFS` para calcular ingresos/gastos no frecuentes y gastos frecuentes desde `INGRESOS Y GASTOS`.
- Copia el formato de una fila cercana cuando existe.

Por eso no es necesario crear manualmente todos los meses del anio.

## Busqueda avanzada

La busqueda avanzada consulta `INGRESOS Y GASTOS` y permite filtrar por:

- Texto en detalle o tipo.
- Monto minimo y maximo usando valor absoluto.
- Fecha inicial y final.

Para proteger el rendimiento del DOM, la busqueda devuelve hasta 150 resultados ordenados del mas reciente al mas antiguo.

## Graficos

Los graficos usan los datos de `RESUMEN POR MES`.

La vista de analisis permite revisar:

- Ingresos vs gastos.
- Gastos totales.
- Ingresos totales.
- Balance neto.
- Comparativas por anio y por mes.

En movil, los graficos reducen densidad visual y solo usan desplazamiento horizontal cuando la cantidad de series/anios no cabe de forma legible.

## Mantenimiento

- No cambies los nombres de las dos hojas principales.
- No elimines las columnas A:D de `INGRESOS Y GASTOS`.
- No elimines las columnas A:I de `RESUMEN POR MES`.
- Puedes ordenar o insertar movimientos desde la app; el backend conserva el orden cronologico al crear nuevos registros.
- Si editas datos directamente en Sheets, respeta la convencion de signos y tipos.
- Si un grafico aparece vacio, revisa que `RESUMEN POR MES` tenga fechas reales en la columna A y valores/formulas en las columnas B:I.

## Solucion de problemas

### La app dice que no encuentra una hoja

Verifica que existan exactamente:

- `INGRESOS Y GASTOS`
- `RESUMEN POR MES`

### No aparecen datos del mes

Revisa que las fechas en `INGRESOS Y GASTOS` sean fechas reales de Sheets, no texto.

### Los totales no cuadran

Confirma que:

- Los ingresos esten en positivo.
- Los gastos esten en negativo.
- El tipo este escrito exactamente como uno de los valores soportados.

### El resumen no genera formulas

Verifica que `RESUMEN POR MES` tenga una fila de encabezados y que la celda de la columna A contenga la palabra `MES`.

### Cambie codigo pero sigo viendo la version anterior

En Apps Script, actualiza la implementacion web o crea una nueva version. Luego recarga la URL publicada.

## Notas de privacidad

Bucks Manager trabaja sobre tu propio Google Sheet. Las operaciones se ejecutan con Google Apps Script dentro de tu cuenta y los datos financieros permanecen en tu Google Drive.

## Estructura del codigo (v4.2 refactorizado)

### Scripts.html - Funciones organizadas

El archivo JavaScript esta organizado en secciones claras:

#### Funciones Helper para Resumen
- `extractAvailableYears(data)` - Extrae anos disponibles de los datos
- `renderYearChips(years)` - Renderiza chips de seleccion de ano
- `filterDataByYear(data, year)` - Filtra datos por ano seleccionado
- `calculateKPIAggregates(yearData)` - Calcula agregados KPI
- `updateKPICards(totals)` - Actualiza tarjetas KPI en el DOM
- `getThemeColors()` - Obtiene colores del tema actual
- `getBaseTooltipConfig(colors, type)` - Configuracion base para tooltips
- `getBaseLegendConfig(isMobile, position)` - Configuracion base para leyendas
- `getPieDatalabelsConfig(isMobile)` - Configuracion de datalabels para tortas
- `renderPieCharts(totals, colors, isMobile)` - Renderiza graficos de torta
- `renderMonthlyTrendChart(yearData, colors, isMobile)` - Renderiza grafico de tendencia
- `calculateDetailRows(yearData)` - Calcula filas de detalle procesadas
- `calculateMaxBars(detailRows)` - Calcula valores maximos para barras
- `renderDetailStrip(detailRows)` - Renderiza strip de resumen (mini cards)
- `renderDetailTableRows(detailRows, maxBars)` - Renderiza filas de tabla

#### Funciones Helper para Fechas
- `formatDateToISO(date)` - Convierte fecha a formato YYYY-MM-DD
- `parseSpanishDate(dateStr)` - Convierte "28-feb-26" a objeto Date
- `transactionDateToISO(transaction)` - Convierte fecha de transaccion a ISO

#### Funciones Helper para Graficos Interanuales
- `buildInterannualData(metric)` - Construye datos por ano para graficos
- `buildComparisonDatasets(...)` - Construye datasets para modo comparacion
- `buildMetricDatasets(...)` - Construye datasets para metricas especificas
- `calculateChartWidth(...)` - Calcula ancho requerido del grafico
- `buildChartContainer(...)` - Construye contenedor HTML del grafico
- `getInterannualChartOptions(...)` - Obtiene opciones del grafico

### Code.gs - Backend optimizado

#### Funciones Helper
- `findHeaderRow(data, defaultRow)` - Encuentra fila de encabezado en resumen
- `_addTransactionCore(transactionData)` - Logica central para agregar transacciones

### Beneficios de la refactorizacion

- **Maintenibilidad** - Funciones mas pequenas y enfocadas son mas faciles de entender y modificar
- **Reutilizacion** - Las funciones helper pueden usarse en multiples caracteristicas
- **Consistencia** - Configuraciones compartidas aseguran estilo uniforme en graficos
- **Performance** - Reduccion de duplicacion de codigo y mejor organizacion
