import * as XLSX from 'xlsx';

/**
 * Parsea tablas Markdown del contenido y las convierte a arrays
 */
function parseMarkdownTables(content: string): { headers: string[]; rows: string[][] }[] {
    const tables: { headers: string[]; rows: string[][] }[] = [];
    const lines = content.split('\n');
    
    let currentTable: { headers: string[]; rows: string[][] } | null = null;
    let headerParsed = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detectar línea de tabla (contiene |)
        if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line
                .slice(1, -1) // Remover | inicial y final
                .split('|')
                .map(cell => cell.trim());
            
            // Si es separador de header (contiene solo - y :)
            if (cells.every(cell => /^[-:]+$/.test(cell))) {
                headerParsed = true;
                continue;
            }
            
            if (!currentTable) {
                // Nueva tabla, esta línea son los headers
                currentTable = { headers: cells, rows: [] };
                headerParsed = false;
            } else if (headerParsed) {
                // Es una fila de datos
                currentTable.rows.push(cells);
            }
        } else {
            // Línea no es tabla, guardar tabla actual si existe
            if (currentTable && currentTable.rows.length > 0) {
                tables.push(currentTable);
            }
            currentTable = null;
            headerParsed = false;
        }
    }
    
    // Guardar última tabla si existe
    if (currentTable && currentTable.rows.length > 0) {
        tables.push(currentTable);
    }
    
    return tables;
}

/**
 * Parsea listas Markdown y las convierte a datos tabulares
 */
function parseMarkdownLists(content: string): { headers: string[]; rows: string[][] }[] {
    const lists: { headers: string[]; rows: string[][] }[] = [];
    const lines = content.split('\n');
    
    let currentList: string[] = [];
    
    for (const line of lines) {
        const trimmed = line.trim();
        // Detectar items de lista (*, -, o números)
        const listMatch = trimmed.match(/^(?:\*|-|\d+\.)\s+(.+)$/);
        
        if (listMatch) {
            currentList.push(listMatch[1]);
        } else if (currentList.length > 0) {
            // Fin de la lista, guardarla si tiene suficientes items
            if (currentList.length >= 3) {
                lists.push({
                    headers: ['Item'],
                    rows: currentList.map(item => [item])
                });
            }
            currentList = [];
        }
    }
    
    // Guardar última lista
    if (currentList.length >= 3) {
        lists.push({
            headers: ['Item'],
            rows: currentList.map(item => [item])
        });
    }
    
    return lists;
}

/**
 * Parsea campos con formato "campo: valor" o "**campo**: valor"
 */
function parseKeyValuePairs(content: string): { headers: string[]; rows: string[][] }[] {
    const lines = content.split('\n');
    const pairs: { key: string; value: string }[] = [];
    
    for (const line of lines) {
        const trimmed = line.trim();
        // Formato: **Campo**: Valor o Campo: Valor
        const match = trimmed.match(/^\*?\*?([^*:]+)\*?\*?:\s*(.+)$/);
        if (match) {
            pairs.push({ key: match[1].trim(), value: match[2].trim() });
        }
    }
    
    if (pairs.length >= 3) {
        return [{
            headers: ['Campo', 'Valor'],
            rows: pairs.map(p => [p.key, p.value])
        }];
    }
    
    return [];
}

/**
 * Detecta si el contenido tiene datos exportables
 */
export function hasExportableData(content: string): boolean {
    const tables = parseMarkdownTables(content);
    if (tables.length > 0) return true;
    
    const lists = parseMarkdownLists(content);
    if (lists.length > 0) return true;
    
    const keyValues = parseKeyValuePairs(content);
    if (keyValues.length > 0) return true;
    
    return false;
}

/**
 * Exporta el contenido del mensaje a un archivo Excel
 */
export function exportToExcel(content: string, fileName: string = 'dverse-export'): void {
    const workbook = XLSX.utils.book_new();
    let sheetCount = 0;
    
    // Intentar parsear tablas Markdown
    const tables = parseMarkdownTables(content);
    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const data = [table.headers, ...table.rows];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // Aplicar ancho de columnas automático
        const maxWidths = table.headers.map((_, colIndex) => {
            const columnData = [table.headers[colIndex], ...table.rows.map(row => row[colIndex] || '')];
            return Math.max(...columnData.map(cell => String(cell).length));
        });
        worksheet['!cols'] = maxWidths.map(w => ({ wch: Math.min(w + 2, 50) }));
        
        XLSX.utils.book_append_sheet(workbook, worksheet, `Tabla ${i + 1}`);
        sheetCount++;
    }
    
    // Si no hay tablas, intentar listas
    if (sheetCount === 0) {
        const lists = parseMarkdownLists(content);
        for (let i = 0; i < lists.length; i++) {
            const list = lists[i];
            const data = [list.headers, ...list.rows];
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            worksheet['!cols'] = [{ wch: 50 }];
            XLSX.utils.book_append_sheet(workbook, worksheet, `Lista ${i + 1}`);
            sheetCount++;
        }
    }
    
    // Si no hay listas, intentar key-value pairs
    if (sheetCount === 0) {
        const keyValues = parseKeyValuePairs(content);
        for (let i = 0; i < keyValues.length; i++) {
            const kv = keyValues[i];
            const data = [kv.headers, ...kv.rows];
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            worksheet['!cols'] = [{ wch: 30 }, { wch: 50 }];
            XLSX.utils.book_append_sheet(workbook, worksheet, `Datos ${i + 1}`);
            sheetCount++;
        }
    }
    
    // Si no se encontraron datos estructurados, exportar como texto
    if (sheetCount === 0) {
        const lines = content.split('\n').map(line => [line]);
        const worksheet = XLSX.utils.aoa_to_sheet([['Contenido'], ...lines]);
        worksheet['!cols'] = [{ wch: 100 }];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Respuesta');
    }
    
    // Generar y descargar archivo
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

