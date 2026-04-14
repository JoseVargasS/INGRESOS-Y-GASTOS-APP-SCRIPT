# 💵 Bucks Manager - Control Financiero Inteligente

**Bucks Manager** es una aplicación web de alto rendimiento construida sobre el ecosistema de Google, diseñada para ofrecer un control total, privado y estéticamente premium de las finanzas personales. A diferencia de otras apps, tus datos nunca salen de tu cuenta de Google, utilizando Google Sheets como una base de datos potente y accesible.

---

## 🌟 Características Principales

### 1. Panel de Control (Dashboard) Dinámico
- **KPIs en Tiempo Real**: Visualización instantánea de Ingresos, Gastos, Saldo Neto y Tasa de Ahorro.
- **Gráficos Interactivos**: Gráficos de barras y líneas (vía Chart.js) para analizar tendencias mensuales de ingresos vs. gastos.

### 2. Gestión de Transacciones Maestro
- **Registro Simplificado**: Interfaz optimizada para añadir ingresos y gastos rápidamente.
- **Calculadora Aritmética Integrada**: El campo de monto permite realizar operaciones matemáticas directamente (ej: `50+20*1.15`), calculando el resultado al instante.
- **Categorización Inteligente**: Clasificación entre movimientos Frecuentes y No Frecuentes para un análisis más profundo.

### 3. Buscador Avanzado Global (v4.2)
- **Filtros Potentes**: Localiza cualquier movimiento por descripción, rangos de monto o rangos de fecha específicos.
- **Vista de Resultados Directa**: Sin necesidad de navegar entre meses para encontrar un dato histórico.

### 4. Automatización de Resúmenes
- **Cierre Mensual Automático**: El sistema genera y da formato a las nuevas filas de resumen cada mes sin intervención del usuario.
- **Fórmulas Inteligentes**: Uso de `SUMIFS` dinámicos que se recalculan automáticamente en la hoja de Google Sheets ante cualquier cambio.

### 5. Experiencia de Usuario (UX) Premium
- **Modo Oscuro/Claro**: Selector de tema con persistencia en el navegador.
- **Optimización Mobile-First**: Diseñada para sentirse como una app nativa en dispositivos iOS y Android.
- **Skeleton Loaders**: Transiciones fluidas y estados de carga animados para una sensación de velocidad instantánea.

---

## 🚀 Ventajas de Bucks Manager

- **Privacidad Total**: Los datos se almacenan exclusivamente en **tu** Google Drive. No hay servidores intermedios.
- **Velocidad Extrema**: Optimizada con renderizado por lotes y caché local para minimizar la latencia de Google Apps Script.
- **Flexibilidad**: Al ser una Hoja de Cálculo la base de datos, siempre puedes exportar, modificar masivamente o conectar otros servicios a tus datos.
- **Costo Cero**: Aprovecha la infraestructura gratuita de Google Cloud para funcionar sin costos de servidor.

---

## 🛠️ Stack Tecnológico

- **Frontend**: HTML5 Semántico, CSS3 Vanilla (Variables, Flexbox, Grid), JavaScript Moderno (ES6+).
- **Backend**: Google Apps Script (V8 Engine).
- **Base de Datos**: Google Sheets API.
- **Llamadas Asíncronas**: `google.script.run` con manejo de estados de carga.
- **Visualización**: Chart.js para gráficos y FontAwesome para iconografía profesional.

---

## 📋 Configuración y Despliegue

### Requisitos Previos
Tener una hoja de Google Sheets con las siguientes pestañas:
1.  **`INGRESOS Y GASTOS`**: Columnas: Fecha, Monto, Detalle, Tipo.
2.  **`RESUMEN POR MES`**: Estructura de resumen con la columna A dedicada a la fecha del primer día del mes.

### Pasos para el Despliegue
1. Abre tu Google Sheet y ve a **Extensiones > Apps Script**.
2. Copia el contenido de los archivos del proyecto:
   - `Code.gs`: Lógica de servidor.
   - `Index.html`, `Scripts.html`, `Styles.html`: Interfaz y lógica de cliente.
3. Haz clic en **Nueva implementacion > Aplicación web**.
4. Configura: "Ejecutar como: Yo" y "Quién tiene acceso: Solo yo" (o según prefieras).
5. Autoriza los permisos necesarios.

---

## ⌨️ Atajos y Navegación
- **Tecla Escape**: Cierra cualquier ventana emergente o panel lateral.
- **Sidebar**: Navega rápidamente entre meses y años o accede al resumen anual detallado.
- **Toasts**: Notificaciones visuales de éxito o error para una confirmación clara de acciones.

---
*Bucks Manager: Tu dinero, bajo tu control, con la elegancia que mereces.*
