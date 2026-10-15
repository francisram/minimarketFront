import { Injectable, inject } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InstitucionService } from './institucion.service';
import { MovimientoStock, ReporteValorizacion, KpisInventario, TomaInventario } from '../models/stock.model';
import {
  PedidoResumenReporteDTO,
  LibroVentasIvaDTO,
  SesionCajaReporteDTO,
  ReporteCajasDTO
} from '../models/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class ReporteExportService {
  private readonly institucionService = inject(InstitucionService);

  // =========================================================================
  // 1. VENTAS DETALLADAS: CSV & PDF (A4)
  // =========================================================================

  exportarVentasCsv(
    ventas: PedidoResumenReporteDTO[],
    periodo: { inicio?: string; fin?: string },
    totales?: { totalVentas: number; cantidadVentas: number }
  ): void {
    const BOM = '\uFEFF';
    const separador = ';';
    const lineas: string[] = [];

    const inst = this.institucionService.institucion();
    lineas.push(`"REPORTE DETALLADO DE VENTAS - ${this.sanitizarCsv(inst.nombre || 'Minimarket & Heladería')}"`);
    if (inst.ruc) lineas.push(`"RUC: ${this.sanitizarCsv(inst.ruc)}"`);
    lineas.push(`"Período: ${periodo.inicio || 'Inicio'} al ${periodo.fin || 'Hoy'}"`);
    lineas.push(`"Fecha de emisión: ${this.formatearFechaHora(new Date().toISOString())}"`);
    lineas.push('');

    const headers = [
      'ID Pedido',
      'Fecha y Hora',
      'Comprobante',
      'N° Factura / Ticket',
      'Trx ID',
      'Voucher POS',
      'Cliente',
      'RUC / C.I.',
      'Medio de Pago',
      'Condición',
      'Tipo Entrega',
      'Cajero',
      'Estado',
      'Monto Total (Gs.)'
    ];
    lineas.push(headers.map(h => `"${h}"`).join(separador));

    for (const v of ventas) {
      const fila = [
        v.id.toString(),
        this.formatearFechaHora(v.fechaCreacion),
        v.tipoComprobante || 'TICKET',
        v.numeroFactura || '',
        v.trxId || '',
        v.numeroVoucher || '',
        this.sanitizarCsv(v.clienteNombre || 'Consumidor Final'),
        this.sanitizarCsv(v.clienteRuc || '44444401-7'),
        this.sanitizarCsv(v.metodoPago || ''),
        v.condicionVenta || 'CONTADO',
        v.tipoEntrega || 'SALON',
        this.sanitizarCsv(v.cajero || ''),
        v.estado || 'CONFIRMADO',
        Math.round(v.total || 0).toString()
      ];
      lineas.push(fila.map(f => `"${f}"`).join(separador));
    }

    if (totales) {
      lineas.push('');
      lineas.push(`"TOTAL TRANSACCIONES"${separador}"${totales.cantidadVentas}"`);
      lineas.push(`"GRAN TOTAL FACTURADO (Gs.)"${separador}"${Math.round(totales.totalVentas)}"`);
    }

    const contenido = BOM + lineas.join('\r\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const nombreArchivo = `ventas_detalladas_${this.limpiarFechaArchivo(periodo.inicio)}_${this.limpiarFechaArchivo(periodo.fin)}.csv`;
    this.descargarBlob(blob, nombreArchivo);
  }

  exportarVentasPdf(
    ventas: PedidoResumenReporteDTO[],
    periodo: { inicio?: string; fin?: string },
    totales: { totalVentas: number; cantidadVentas: number }
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const titulo = 'REPORTE DETALLADO DE VENTAS';
    const periodoTexto = `Período: ${periodo.inicio ? this.formatearFecha(periodo.inicio) : 'Inicio'} al ${periodo.fin ? this.formatearFecha(periodo.fin) : 'Hoy'}`;

    const startY = this.dibujarEncabezadoA4(doc, titulo, periodoTexto, 'landscape');

    const kpiY = startY + 2;
    const ticketPromedio = totales.cantidadVentas > 0 ? Math.round(totales.totalVentas / totales.cantidadVentas) : 0;

    this.dibujarKpiBox(doc, 14, kpiY, 80, 14, 'TOTAL FACTURADO', this.formatearGuaranies(totales.totalVentas), [30, 58, 138]);
    this.dibujarKpiBox(doc, 100, kpiY, 80, 14, 'CANTIDAD DE VENTAS', `${totales.cantidadVentas} transacciones`, [71, 85, 105]);
    this.dibujarKpiBox(doc, 186, kpiY, 97, 14, 'TICKET PROMEDIO', this.formatearGuaranies(ticketPromedio), [15, 118, 110]);

    const tableStartY = kpiY + 18;
    const tableData = ventas.map((v, i) => [
      (i + 1).toString(),
      `#${v.id}`,
      this.formatearFechaHora(v.fechaCreacion),
      v.tipoComprobante === 'FACTURA' ? `Fact. ${v.numeroFactura || ''}` : 'Ticket',
      v.trxId ? v.trxId.substring(0, 12) : '—',
      v.clienteNombre ? `${v.clienteNombre.substring(0, 20)}${v.clienteRuc ? ' (' + v.clienteRuc + ')' : ''}` : 'Consumidor Final',
      this.formatearMetodoPagoCorto(v.metodoPago),
      v.tipoEntrega || 'SALÓN',
      v.cajero || '—',
      this.formatearNumero(v.total)
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [[
        '#',
        'ID',
        'Fecha y Hora',
        'Comprobante',
        'Trx ID',
        'Cliente / RUC',
        'Medio Pago',
        'Entrega',
        'Cajero',
        'Total (Gs.)'
      ]],
      body: tableData,
      foot: [[
        '',
        '',
        '',
        '',
        '',
        'TOTALES GENERALES',
        '',
        '',
        `${totales.cantidadVentas} ventas`,
        this.formatearGuaranies(totales.totalVentas)
      ]],
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'right'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'center', cellWidth: 28 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 24 },
        5: { halign: 'left', cellWidth: 55 },
        6: { halign: 'center', cellWidth: 30 },
        7: { halign: 'center', cellWidth: 22 },
        8: { halign: 'center', cellWidth: 25 },
        9: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14, bottom: 15 },
      didDrawPage: () => {
        this.dibujarPiePaginaA4(doc, 'landscape');
      }
    });

    const nombreArchivo = `ventas_detalladas_${this.limpiarFechaArchivo(periodo.inicio)}_${this.limpiarFechaArchivo(periodo.fin)}.pdf`;
    doc.save(nombreArchivo);
  }

  // =========================================================================
  // 2. LIBRO DE VENTAS IVA (SET / DNIT): PDF (A4)
  // =========================================================================

  exportarLibroIvaPdf(
    libroIva: LibroVentasIvaDTO,
    periodo: { inicio?: string; fin?: string }
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const inst = this.institucionService.institucion();
    const titulo = 'LIBRO DE VENTAS FISCAL - RÉGIMEN IVA (SET / DNIT)';
    const periodoTexto = `Período Fiscal: ${periodo.inicio ? this.formatearFecha(periodo.inicio) : 'Inicio'} al ${periodo.fin ? this.formatearFecha(periodo.fin) : 'Hoy'}`;

    const startY = this.dibujarEncabezadoA4(doc, titulo, periodoTexto, 'landscape', inst.timbrado ? `Timbrado N°: ${inst.timbrado}` : undefined);

    const kpiY = startY + 2;
    this.dibujarKpiBox(doc, 14, kpiY, 50, 14, 'GRAVADAS 10%', this.formatearGuaranies(libroIva.totalGravada10), [71, 85, 105]);
    this.dibujarKpiBox(doc, 68, kpiY, 50, 14, 'DÉBITO IVA 10%', this.formatearGuaranies(libroIva.totalIva10), [30, 58, 138]);
    this.dibujarKpiBox(doc, 122, kpiY, 48, 14, 'GRAVADAS 5%', this.formatearGuaranies(libroIva.totalGravada5), [71, 85, 105]);
    this.dibujarKpiBox(doc, 174, kpiY, 48, 14, 'DÉBITO IVA 5%', this.formatearGuaranies(libroIva.totalIva5), [30, 58, 138]);
    this.dibujarKpiBox(doc, 226, kpiY, 57, 14, 'TOTAL DÉBITO FISCAL', this.formatearGuaranies(libroIva.totalIva), [180, 83, 9]);

    const tableStartY = kpiY + 18;

    const tableData = (libroIva.items || []).map((item, idx) => [
      (idx + 1).toString(),
      this.formatearFecha(item.fecha),
      item.tipoComprobante || 'FAC',
      item.numeroComprobante || '—',
      item.clienteRuc || '44444401-7',
      (item.clienteNombre || 'Sin Nombre').substring(0, 24),
      this.formatearNumero(item.exentas),
      this.formatearNumero(item.gravada5),
      this.formatearNumero(item.iva5),
      this.formatearNumero(item.gravada10),
      this.formatearNumero(item.iva10),
      this.formatearNumero(item.totalIva),
      this.formatearNumero(item.total)
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [[
        '#',
        'Fecha',
        'Tipo',
        'N° Comprobante',
        'RUC / C.I.',
        'Razón Social / Cliente',
        'Exentas',
        'Grav. 5%',
        'IVA 5%',
        'Grav. 10%',
        'IVA 10%',
        'Total IVA',
        'Total General'
      ]],
      body: tableData,
      foot: [[
        '',
        '',
        '',
        '',
        'TOTALES',
        `${libroIva.cantidadComprobantes} Docs`,
        this.formatearNumero(libroIva.totalExentas),
        this.formatearNumero(libroIva.totalGravada5),
        this.formatearNumero(libroIva.totalIva5),
        this.formatearNumero(libroIva.totalGravada10),
        this.formatearNumero(libroIva.totalIva10),
        this.formatearNumero(libroIva.totalIva),
        this.formatearGuaranies(libroIva.granTotal)
      ]],
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2,
        halign: 'center'
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'right'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 12 },
        3: { halign: 'center', cellWidth: 24 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'left', cellWidth: 43 },
        6: { halign: 'right', cellWidth: 18 },
        7: { halign: 'right', cellWidth: 20 },
        8: { halign: 'right', cellWidth: 18 },
        9: { halign: 'right', cellWidth: 22 },
        10: { halign: 'right', cellWidth: 20 },
        11: { halign: 'right', cellWidth: 20, fontStyle: 'bold' },
        12: { halign: 'right', cellWidth: 24, fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14, bottom: 15 },
      didDrawPage: () => {
        this.dibujarPiePaginaA4(doc, 'landscape');
      }
    });

    const nombreArchivo = `libro_ventas_iva_${this.limpiarFechaArchivo(periodo.inicio)}_${this.limpiarFechaArchivo(periodo.fin)}.pdf`;
    doc.save(nombreArchivo);
  }

  // =========================================================================
  // 3. AUDITORÍA DE CAJAS: CSV & PDF (A4)
  // =========================================================================

  exportarCajasCsv(
    sesiones: SesionCajaReporteDTO[],
    periodo: { inicio?: string; fin?: string },
    totales?: { totalSesiones: number; totalVentasGeneral: number; totalSobrante: number; totalFaltante: number }
  ): void {
    const BOM = '\uFEFF';
    const separador = ';';
    const lineas: string[] = [];

    const inst = this.institucionService.institucion();
    lineas.push(`"REPORTE DE AUDITORÍA Y TURNOS DE CAJA - ${this.sanitizarCsv(inst.nombre || 'Minimarket & Heladería')}"`);
    if (inst.ruc) lineas.push(`"RUC: ${this.sanitizarCsv(inst.ruc)}"`);
    lineas.push(`"Período: ${periodo.inicio || 'Inicio'} al ${periodo.fin || 'Hoy'}"`);
    lineas.push(`"Fecha de emisión: ${this.formatearFechaHora(new Date().toISOString())}"`);
    lineas.push('');

    const headers = [
      'ID Turno',
      'Cajero Apertura',
      'Usuario Cierre',
      'Fecha Apertura',
      'Fecha Cierre',
      'Estado',
      'Fondo Inicial (Gs.)',
      'Efectivo Esperado (Gs.)',
      'Efectivo Real (Gs.)',
      'Diferencia (Gs.)',
      'Ventas Totales (Gs.)',
      'Cantidad Pedidos'
    ];
    lineas.push(headers.map(h => `"${h}"`).join(separador));

    for (const s of sesiones) {
      const fila = [
        s.id.toString(),
        this.sanitizarCsv(s.cajeroApertura || ''),
        this.sanitizarCsv(s.usuarioCierre || ''),
        this.formatearFechaHora(s.fechaApertura),
        s.fechaCierre ? this.formatearFechaHora(s.fechaCierre) : 'En curso',
        s.estado || 'ABIERTA',
        Math.round(s.montoInicial || 0).toString(),
        Math.round(s.montoEsperadoEfectivo || 0).toString(),
        s.montoRealEfectivo !== null && s.montoRealEfectivo !== undefined ? Math.round(s.montoRealEfectivo).toString() : '',
        s.diferencia !== null && s.diferencia !== undefined ? Math.round(s.diferencia).toString() : '',
        Math.round(s.totalVentasGeneral || 0).toString(),
        (s.cantidadPedidos || 0).toString()
      ];
      lineas.push(fila.map(f => `"${f}"`).join(separador));
    }

    if (totales) {
      lineas.push('');
      lineas.push(`"TOTAL TURNOS AUDITADOS"${separador}"${totales.totalSesiones}"`);
      lineas.push(`"TOTAL VENTAS GENERALES (Gs.)"${separador}"${Math.round(totales.totalVentasGeneral)}"`);
      lineas.push(`"TOTAL SOBRANTES (Gs.)"${separador}"${Math.round(totales.totalSobrante)}"`);
      lineas.push(`"TOTAL FALTANTES (Gs.)"${separador}"${Math.round(totales.totalFaltante)}"`);
    }

    const contenido = BOM + lineas.join('\r\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const nombreArchivo = `auditoria_cajas_${this.limpiarFechaArchivo(periodo.inicio)}_${this.limpiarFechaArchivo(periodo.fin)}.csv`;
    this.descargarBlob(blob, nombreArchivo);
  }

  exportarCajasPdf(
    reporteCajas: ReporteCajasDTO,
    periodo: { inicio?: string; fin?: string }
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const titulo = 'REPORTE DE AUDITORÍA Y TURNOS DE CAJA';
    const periodoTexto = `Período Auditado: ${periodo.inicio ? this.formatearFecha(periodo.inicio) : 'Inicio'} al ${periodo.fin ? this.formatearFecha(periodo.fin) : 'Hoy'}`;

    const startY = this.dibujarEncabezadoA4(doc, titulo, periodoTexto, 'landscape');

    const kpiY = startY + 2;
    this.dibujarKpiBox(doc, 14, kpiY, 60, 14, 'SESIONES AUDITADAS', `${reporteCajas.totalSesiones} turnos`, [71, 85, 105]);
    this.dibujarKpiBox(doc, 78, kpiY, 70, 14, 'TOTAL VENTAS EN CAJA', this.formatearGuaranies(reporteCajas.totalVentasGeneral), [30, 58, 138]);
    
    if (reporteCajas.totalFaltante > 0) {
      this.dibujarKpiBox(doc, 152, kpiY, 65, 14, 'TOTAL FALTANTES', `- ${this.formatearGuaranies(reporteCajas.totalFaltante)}`, [220, 38, 38]);
    } else {
      this.dibujarKpiBox(doc, 152, kpiY, 65, 14, 'TOTAL FALTANTES', '0 Gs. (Sin faltantes)', [16, 185, 129]);
    }

    if (reporteCajas.totalSobrante > 0) {
      this.dibujarKpiBox(doc, 221, kpiY, 62, 14, 'TOTAL SOBRANTES', `+ ${this.formatearGuaranies(reporteCajas.totalSobrante)}`, [202, 138, 4]);
    } else {
      this.dibujarKpiBox(doc, 221, kpiY, 62, 14, 'TOTAL SOBRANTES', '0 Gs.', [71, 85, 105]);
    }

    const tableStartY = kpiY + 18;

    const tableData = (reporteCajas.sesiones || []).map(s => {
      let difTexto = '0';
      if (s.diferencia !== null && s.diferencia !== undefined && s.diferencia !== 0) {
        difTexto = (s.diferencia > 0 ? '+ ' : '') + this.formatearNumero(s.diferencia);
      }
      return [
        `#${s.id}`,
        s.cajeroApertura || '—',
        s.usuarioCierre || '—',
        this.formatearFechaHora(s.fechaApertura),
        s.fechaCierre ? this.formatearFechaHora(s.fechaCierre) : 'En curso',
        s.estado || 'ABIERTA',
        this.formatearNumero(s.montoInicial),
        this.formatearNumero(s.montoEsperadoEfectivo),
        s.montoRealEfectivo !== null && s.montoRealEfectivo !== undefined ? this.formatearNumero(s.montoRealEfectivo) : '—',
        difTexto,
        this.formatearNumero(s.totalVentasGeneral),
        (s.cantidadPedidos || 0).toString()
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [[
        '# Turno',
        'Cajero Apertura',
        'Cajero Cierre',
        'Apertura',
        'Cierre',
        'Estado',
        'Fondo Inicial',
        'Efect. Esperado',
        'Efect. Real',
        'Diferencia',
        'Total Ventas',
        'Pedidos'
      ]],
      body: tableData,
      foot: [[
        '',
        '',
        '',
        '',
        'TOTALES',
        `${reporteCajas.totalSesiones} Turnos`,
        '',
        '',
        '',
        reporteCajas.totalFaltante > 0 ? `- ${this.formatearNumero(reporteCajas.totalFaltante)}` : '0',
        this.formatearGuaranies(reporteCajas.totalVentasGeneral),
        ''
      ]],
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.8,
        halign: 'center'
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'right'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { halign: 'left', cellWidth: 26 },
        2: { halign: 'left', cellWidth: 26 },
        3: { halign: 'center', cellWidth: 27 },
        4: { halign: 'center', cellWidth: 27 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'right', cellWidth: 22 },
        7: { halign: 'right', cellWidth: 24 },
        8: { halign: 'right', cellWidth: 24 },
        9: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
        10: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
        11: { halign: 'center', cellWidth: 12 }
      },
      margin: { left: 14, right: 14, bottom: 15 },
      didDrawPage: () => {
        this.dibujarPiePaginaA4(doc, 'landscape');
      }
    });

    const nombreArchivo = `auditoria_cajas_${this.limpiarFechaArchivo(periodo.inicio)}_${this.limpiarFechaArchivo(periodo.fin)}.pdf`;
    doc.save(nombreArchivo);
  }

  // =========================================================================
  // 4. INVENTARIO & KARDEX: CSV & PDF (A4)
  // =========================================================================

  exportarKardexCsv(
    movimientos: MovimientoStock[],
    periodo: { inicio?: string; fin?: string },
    kpis?: KpisInventario
  ): void {
    const BOM = '\uFEFF';
    const separador = ';';
    const lineas: string[] = [];

    const inst = this.institucionService.institucion();
    lineas.push(`"REPORTE HISTÓRICO DE KARDEX Y MOVIMIENTOS - ${this.sanitizarCsv(inst.nombre || 'Minimarket & Heladería')}"`);
    if (inst.ruc) lineas.push(`"RUC: ${this.sanitizarCsv(inst.ruc)}"`);
    lineas.push(`"Período: ${periodo.inicio || 'Inicio'} al ${periodo.fin || 'Hoy'}"`);
    lineas.push(`"Fecha de emisión: ${this.formatearFechaHora(new Date().toISOString())}"`);
    lineas.push('');

    const headers = [
      'ID',
      'Fecha y Hora',
      'Tipo Artículo',
      'Artículo',
      'Tipo Movimiento',
      'Cantidad',
      'Unidad',
      'Stock Anterior',
      'Stock Posterior',
      'Motivo / Justificación',
      'Usuario'
    ];
    lineas.push(headers.map(h => `"${h}"`).join(separador));

    for (const m of movimientos) {
      const fila = [
        m.id.toString(),
        this.formatearFechaHora(m.fecha),
        m.tipoItem,
        this.sanitizarCsv(m.itemNombre),
        m.tipoMovimiento,
        m.cantidad.toString(),
        m.unidad,
        m.stockAnterior.toString(),
        m.stockPosterior.toString(),
        this.sanitizarCsv(m.motivo || '—'),
        this.sanitizarCsv(m.usuario || 'SISTEMA')
      ];
      lineas.push(fila.map(f => `"${f}"`).join(separador));
    }

    if (kpis) {
      lineas.push('');
      lineas.push(`"TOTAL ENTRADAS"${separador}"${kpis.totalEntradas}"`);
      lineas.push(`"TOTAL VENTAS POS"${separador}"${kpis.totalSalidasVenta}"`);
      lineas.push(`"TOTAL MERMAS / PÉRDIDAS"${separador}"${kpis.totalMermas}"`);
      lineas.push(`"TOTAL MOVIMIENTOS REGISTRADOS"${separador}"${kpis.totalMovimientos}"`);
    }

    const contenido = BOM + lineas.join('\r\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const nombreArchivo = `kardex_inventario_${this.limpiarFechaArchivo(periodo.inicio)}_${this.limpiarFechaArchivo(periodo.fin)}.csv`;
    this.descargarBlob(blob, nombreArchivo);
  }

  exportarKardexPdf(
    movimientos: MovimientoStock[],
    periodo: { inicio?: string; fin?: string },
    kpis?: KpisInventario
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const titulo = 'REPORTE DE KARDEX Y MOVIMIENTOS DE STOCK';
    const periodoTexto = `Período: ${periodo.inicio ? this.formatearFecha(periodo.inicio) : 'Inicio'} al ${periodo.fin ? this.formatearFecha(periodo.fin) : 'Hoy'}`;
    const startY = this.dibujarEncabezadoA4(doc, titulo, periodoTexto, 'landscape');

    let tableStartY = startY + 2;
    if (kpis) {
      const kpiY = startY + 2;
      const kpiW = 60;
      const kpiH = 13;
      const gap = 6;
      let kpiX = 14;

      this.dibujarKpiBox(doc, kpiX, kpiY, kpiW, kpiH, 'TOTAL ENTRADAS (COMPRAS/PROD)', `${kpis.totalEntradas}`, [37, 99, 235]);
      kpiX += kpiW + gap;
      this.dibujarKpiBox(doc, kpiX, kpiY, kpiW, kpiH, 'SALIDAS POR VENTA (POS)', `${kpis.totalSalidasVenta}`, [16, 185, 129]);
      kpiX += kpiW + gap;
      this.dibujarKpiBox(doc, kpiX, kpiY, kpiW, kpiH, 'MERMAS / DESCARTE', `${kpis.totalMermas}`, [220, 38, 38]);
      kpiX += kpiW + gap;
      this.dibujarKpiBox(doc, kpiX, kpiY, kpiW, kpiH, 'VALOR TOTAL INVENTARIO', this.formatearGuaranies(kpis.valorTotalStock), [180, 83, 9]);

      tableStartY = kpiY + kpiH + 5;
    }

    const filas = movimientos.map(m => [
      m.id.toString(),
      this.formatearFechaHora(m.fecha),
      m.tipoItem,
      m.itemNombre,
      m.tipoMovimiento.replace(/_/g, ' '),
      `${m.cantidad} ${m.unidad === 'KG' ? 'kg' : 'u.'}`,
      `${m.stockAnterior} ${m.unidad === 'KG' ? 'kg' : 'u.'}`,
      `${m.stockPosterior} ${m.unidad === 'KG' ? 'kg' : 'u.'}`,
      m.motivo || '—',
      m.usuario || 'SISTEMA'
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [[
        'ID',
        'Fecha y Hora',
        'Tipo',
        'Artículo',
        'Movimiento',
        'Cantidad',
        'Stock Ant.',
        'Stock Post.',
        'Motivo / Justificación',
        'Usuario'
      ]],
      body: filas,
      theme: 'grid',
      styles: {
        fontSize: 7.2,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 26 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'left', cellWidth: 46 },
        4: { halign: 'center', cellWidth: 32 },
        5: { halign: 'right', cellWidth: 20, fontStyle: 'bold' },
        6: { halign: 'right', cellWidth: 20 },
        7: { halign: 'right', cellWidth: 20, fontStyle: 'bold' },
        8: { halign: 'left', cellWidth: 50 },
        9: { halign: 'center', cellWidth: 25 }
      },
      margin: { left: 14, right: 14, bottom: 15 },
      didDrawPage: () => {
        this.dibujarPiePaginaA4(doc, 'landscape');
      }
    });

    const nombreArchivo = `kardex_inventario_${this.limpiarFechaArchivo(periodo.inicio)}_${this.limpiarFechaArchivo(periodo.fin)}.pdf`;
    doc.save(nombreArchivo);
  }

  exportarValorizacionCsv(reporte: ReporteValorizacion): void {
    const BOM = '\uFEFF';
    const separador = ';';
    const lineas: string[] = [];

    const inst = this.institucionService.institucion();
    lineas.push(`"INVENTARIO FÍSICO VALORADO - ${this.sanitizarCsv(inst.nombre || 'Minimarket & Heladería')}"`);
    if (inst.ruc) lineas.push(`"RUC: ${this.sanitizarCsv(inst.ruc)}"`);
    lineas.push(`"Fecha de emisión: ${this.formatearFechaHora(new Date().toISOString())}"`);
    lineas.push('');

    const headers = [
      'ID',
      'Artículo / Recurso',
      'Categoría / Tipo',
      'Stock Actual',
      'Stock Mínimo',
      'Unidad',
      'Precio / Costo Estimado (Gs.)',
      'Total Valorizado (Gs.)',
      'Estado'
    ];
    lineas.push(headers.map(h => `"${h}"`).join(separador));

    for (const item of reporte.items) {
      const fila = [
        item.id.toString(),
        this.sanitizarCsv(item.nombre),
        item.tipoItem,
        item.stockActual.toString(),
        item.stockMinimo.toString(),
        item.unidad,
        Math.round(item.precioUnitario).toString(),
        Math.round(item.totalValorizado).toString(),
        item.estadoStock
      ];
      lineas.push(fila.map(f => `"${f}"`).join(separador));
    }

    lineas.push('');
    lineas.push(`"TOTAL ARTÍCULOS"${separador}"${reporte.totalArticulos}"`);
    lineas.push(`"ARTÍCULOS AGOTADOS"${separador}"${reporte.totalAgotados}"`);
    lineas.push(`"ARTÍCULOS BAJO MÍNIMO"${separador}"${reporte.totalBajoMinimo}"`);
    lineas.push(`"VALOR TOTAL GENERAL (Gs.)"${separador}"${Math.round(reporte.totalValorizadoGeneral)}"`);

    const contenido = BOM + lineas.join('\r\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const nombreArchivo = `inventario_valorado_${this.limpiarFechaArchivo(new Date().toISOString().substring(0, 10))}.csv`;
    this.descargarBlob(blob, nombreArchivo);
  }

  exportarValorizacionPdf(reporte: ReporteValorizacion): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const titulo = 'INVENTARIO FÍSICO VALORADO';
    const subtitulo = `Fecha de Valorización: ${this.formatearFechaHora(new Date().toISOString())}`;
    const startY = this.dibujarEncabezadoA4(doc, titulo, subtitulo, 'portrait');

    const kpiY = startY + 2;
    const kpiW = 42;
    const kpiH = 13;
    const gap = 3;
    let kpiX = 14;

    this.dibujarKpiBox(doc, kpiX, kpiY, kpiW, kpiH, 'TOTAL ARTÍCULOS', `${reporte.totalArticulos}`, [37, 99, 235]);
    kpiX += kpiW + gap;
    this.dibujarKpiBox(doc, kpiX, kpiY, kpiW, kpiH, 'AGOTADOS', `${reporte.totalAgotados}`, [220, 38, 38]);
    kpiX += kpiW + gap;
    this.dibujarKpiBox(doc, kpiX, kpiY, kpiW, kpiH, 'BAJO MÍNIMO', `${reporte.totalBajoMinimo}`, [217, 119, 6]);
    kpiX += kpiW + gap;
    this.dibujarKpiBox(doc, kpiX, kpiY, kpiW + 8, kpiH, 'VALOR TOTAL (Gs.)', this.formatearGuaranies(reporte.totalValorizadoGeneral), [16, 185, 129]);

    const tableStartY = kpiY + kpiH + 5;

    const filas = reporte.items.map(item => [
      item.id.toString(),
      item.nombre,
      item.tipoItem,
      `${item.stockActual} ${item.unidad === 'KG' ? 'kg' : 'u.'}`,
      `${item.stockMinimo} ${item.unidad === 'KG' ? 'kg' : 'u.'}`,
      this.formatearNumero(item.precioUnitario),
      this.formatearNumero(item.totalValorizado),
      item.estadoStock
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [[
        'ID',
        'Artículo / Recurso',
        'Tipo',
        'Stock',
        'Mínimo',
        'Precio / Costo (Gs.)',
        'Subtotal (Gs.)',
        'Estado'
      ]],
      body: filas,
      foot: [[
        '',
        'GRAN TOTAL VALORIZADO',
        `${reporte.totalArticulos} Ítems`,
        '',
        '',
        '',
        this.formatearGuaranies(reporte.totalValorizadoGeneral),
        ''
      ]],
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.8,
        halign: 'center'
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'right'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 48 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 26 },
        6: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
        7: { halign: 'center', cellWidth: 14 }
      },
      margin: { left: 14, right: 14, bottom: 15 },
      didDrawPage: () => {
        this.dibujarPiePaginaA4(doc, 'portrait');
      }
    });

    const nombreArchivo = `inventario_valorado_${this.limpiarFechaArchivo(new Date().toISOString().substring(0, 10))}.pdf`;
    doc.save(nombreArchivo);
  }

  // =========================================================================
  // 6. AUDITORÍA Y CONTEO FÍSICO DE INVENTARIO: CSV & PDF (A4 LANDSCAPE)
  // =========================================================================

  exportarComparativoAuditoriaCsv(toma: TomaInventario): void {
    const BOM = '\uFEFF';
    const separador = ';';
    const lineas: string[] = [];

    const inst = this.institucionService.institucion();
    lineas.push(`"ACTA DE AUDITORÍA Y CONTEO FÍSICO DE INVENTARIO - ${this.sanitizarCsv(inst.nombre || 'Minimarket & Heladería')}"`);
    if (inst.ruc) lineas.push(`"RUC: ${this.sanitizarCsv(inst.ruc)}"`);
    lineas.push(`"Auditoría N°: ${toma.id}"`);
    lineas.push(`"Auditor Responsable: ${this.sanitizarCsv(toma.usuarioAuditor)}"`);
    lineas.push(`"Fecha y Hora: ${this.formatearFechaHora(toma.fecha)}"`);
    lineas.push(`"Estado: ${toma.estado}"`);
    if (toma.observaciones) lineas.push(`"Observaciones: ${this.sanitizarCsv(toma.observaciones)}"`);
    lineas.push(`"Artículos Contados: ${toma.totalArticulos} | Discrepancias: ${toma.totalDiferencias} | Impacto Neto: ${this.formatearGuaranies(toma.impactoNeto)}"`);
    lineas.push('');

    const headers = [
      'N°',
      'Artículo',
      'Rubro / Tipo',
      'U.M.',
      'Stock en Sistema (Antes)',
      'Stock Físico (Contado)',
      'Diferencia (Físico - Sistema)',
      'Costo / Precio Unit. (Gs.)',
      'Diferencia Valorizada (Gs.)',
      'Estado Discrepancia'
    ];
    lineas.push(headers.map(h => `"${h}"`).join(separador));

    const detalles = toma.detalles || [];
    let idx = 1;
    for (const d of detalles) {
      let estado = 'COINCIDE';
      if (d.diferencia > 0.001) estado = 'SOBRANTE';
      else if (d.diferencia < -0.001) estado = 'FALTANTE';

      const difFormateada = d.tipoItem === 'SABOR'
        ? (d.diferencia > 0 ? '+' : '') + d.diferencia.toFixed(3)
        : (d.diferencia > 0 ? '+' : '') + Math.round(d.diferencia);

      const fila = [
        (idx++).toString(),
        this.sanitizarCsv(d.itemNombre),
        d.tipoItem,
        d.unidad,
        d.tipoItem === 'SABOR' ? d.stockSistema.toFixed(3) : Math.round(d.stockSistema).toString(),
        d.tipoItem === 'SABOR' ? d.stockFisico.toFixed(3) : Math.round(d.stockFisico).toString(),
        difFormateada,
        Math.round(d.costoUnitario || 0).toString(),
        Math.round(d.diferenciaValorizada || 0).toString(),
        estado
      ];
      lineas.push(fila.map(val => `"${val}"`).join(separador));
    }

    const blob = new Blob([BOM + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const nombreArchivo = `auditoria_fisica_${toma.id}_${this.limpiarFechaArchivo(toma.fecha.substring(0, 10))}.csv`;
    this.descargarBlob(blob, nombreArchivo);
  }

  exportarComparativoAuditoriaPdf(toma: TomaInventario): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const sub = `Auditor: ${toma.usuarioAuditor} • Fecha: ${this.formatearFechaHora(toma.fecha)}`;
    const extra = `Estado: ${toma.estado} • Acta #${toma.id}`;

    let y = this.dibujarEncabezadoA4(doc, `ACTA DE AUDITORÍA Y CONTEO FÍSICO #${toma.id}`, sub, 'landscape', extra);

    const coincidentes = toma.totalArticulos - toma.totalDiferencias;
    this.dibujarKpiBox(doc, 14, y, 64, 13, 'TOTAL ARTÍCULOS CONTADOS', toma.totalArticulos.toString(), [59, 130, 246]);
    this.dibujarKpiBox(doc, 82, y, 64, 13, 'EXISTENCIAS COINCIDENTES', coincidentes.toString(), [16, 185, 129]);
    this.dibujarKpiBox(doc, 150, y, 64, 13, 'DISCREPANCIAS / DIFERENCIAS', toma.totalDiferencias.toString(), [239, 68, 68]);
    this.dibujarKpiBox(doc, 218, y, 65, 13, 'IMPACTO ECONÓMICO NETO', this.formatearGuaranies(toma.impactoNeto), [139, 92, 246]);

    y += 16;

    if (toma.observaciones) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Observaciones de la Auditoría: "${toma.observaciones}"`, 14, y);
      y += 4;
    }

    const detalles = toma.detalles || [];
    const tableBody = detalles.map((d, index) => {
      let estado = 'Coincide';
      if (d.diferencia > 0.001) estado = 'Sobrante';
      else if (d.diferencia < -0.001) estado = 'Faltante';

      const difTexto = d.tipoItem === 'SABOR'
        ? (d.diferencia > 0 ? '+' : '') + d.diferencia.toFixed(3)
        : (d.diferencia > 0 ? '+' : '') + Math.round(d.diferencia);

      return [
        (index + 1).toString(),
        d.itemNombre,
        d.tipoItem,
        d.unidad,
        d.tipoItem === 'SABOR' ? d.stockSistema.toFixed(3) : this.formatearNumero(d.stockSistema),
        d.tipoItem === 'SABOR' ? d.stockFisico.toFixed(3) : this.formatearNumero(d.stockFisico),
        difTexto,
        this.formatearGuaranies(d.costoUnitario || 0),
        this.formatearGuaranies(d.diferenciaValorizada || 0),
        estado
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [[
        '#',
        'Artículo',
        'Rubro',
        'U.M.',
        'Stock Sistema',
        'Stock Físico',
        'Diferencia',
        'Costo Unit.',
        'Impacto Gs.',
        'Resultado'
      ]],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'right', cellWidth: 22 },
        5: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
        6: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
        7: { halign: 'right', cellWidth: 28 },
        8: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
        9: { halign: 'center', cellWidth: 20 }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const rawRow = detalles[data.row.index];
          if (rawRow && Math.abs(rawRow.diferencia) > 0.001) {
            if (data.column.index === 6 || data.column.index === 8 || data.column.index === 9) {
              if (rawRow.diferencia < 0) {
                data.cell.styles.textColor = [220, 38, 38];
              } else {
                data.cell.styles.textColor = [37, 99, 235];
              }
            }
          }
        }
      },
      margin: { left: 14, right: 14, bottom: 26 },
      didDrawPage: () => {
        this.dibujarPiePaginaA4(doc, 'landscape');
      }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || y;
    const pageHeight = 210;
    const firmaY = Math.min(pageHeight - 20, Math.max(finalY + 12, pageHeight - 32));

    if (firmaY > pageHeight - 16) {
      doc.addPage();
      this.dibujarPiePaginaA4(doc, 'landscape');
    }

    const actualFirmaY = firmaY > pageHeight - 16 ? 40 : firmaY;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);

    doc.line(40, actualFirmaY, 110, actualFirmaY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Auditor Responsable: ${toma.usuarioAuditor}`, 75, actualFirmaY + 4, { align: 'center' });
    doc.text('Firma y Aclaración', 75, actualFirmaY + 7, { align: 'center' });

    doc.line(185, actualFirmaY, 255, actualFirmaY);
    doc.text('Gerencia / Administración de Sucursal', 220, actualFirmaY + 4, { align: 'center' });
    doc.text('Firma y Sello de Conformidad', 220, actualFirmaY + 7, { align: 'center' });

    const nombreArchivo = `auditoria_fisica_${toma.id}_${this.limpiarFechaArchivo(toma.fecha.substring(0, 10))}.pdf`;
    doc.save(nombreArchivo);
  }

  // =========================================================================
  // MÉTODOS AUXILIARES DE DISEÑO Y MEMBRETE A4
  // =========================================================================

  private dibujarEncabezadoA4(
    doc: jsPDF,
    titulo: string,
    subtitulo: string,
    orientacion: 'portrait' | 'landscape',
    infoExtra?: string
  ): number {
    const pageWidth = orientacion === 'landscape' ? 297 : 210;
    const inst = this.institucionService.institucion();
    const margin = 14;

    let currentY = 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 58, 138);
    doc.text(inst.nombre || 'Minimarket & Heladería Artesanal', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    currentY += 4.5;
    const fiscalText = [
      inst.ruc ? `RUC: ${inst.ruc}` : null,
      inst.telefono ? `Tel: ${inst.telefono}` : null,
      inst.ciudad ? `${inst.ciudad} - Paraguay` : null
    ].filter(Boolean).join('  •  ');
    if (fiscalText) {
      doc.text(fiscalText, margin, currentY);
      currentY += 4;
    }
    if (inst.direccion) {
      doc.text(`Dirección: ${inst.direccion}`, margin, currentY);
      currentY += 4;
    }

    const boxWidth = orientacion === 'landscape' ? 120 : 90;
    const boxX = pageWidth - margin - boxWidth;
    const boxY = 10;
    const boxHeight = 18;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(titulo, boxX + 4, boxY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitulo, boxX + 4, boxY + 10.5);

    const emisionTexto = `Emitido: ${this.formatearFechaHora(new Date().toISOString())}${infoExtra ? '  •  ' + infoExtra : ''}`;
    doc.text(emisionTexto, boxX + 4, boxY + 15);

    const lineY = Math.max(currentY + 2, boxY + boxHeight + 3);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, lineY, pageWidth - margin, lineY);

    return lineY + 3;
  }

  private dibujarPiePaginaA4(doc: jsPDF, orientacion: 'portrait' | 'landscape'): void {
    const pageWidth = orientacion === 'landscape' ? 297 : 210;
    const pageHeight = orientacion === 'landscape' ? 210 : 297;
    const margin = 14;
    const footerY = pageHeight - 8;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    const inst = this.institucionService.institucion();
    const textoIzquierda = `${inst.nombre || 'Minimarket & Heladería'} • Sistema POS & Gestión • Formato Oficial Tamaño A4`;
    doc.text(textoIzquierda, margin, footerY + 2);

    const pageCount = doc.getNumberOfPages();
    const pageCurrent = (doc as any).internal?.getCurrentPageInfo?.()?.pageNumber || pageCount;
    const textoDerecha = `Página ${pageCurrent} de ${pageCount}`;
    doc.text(textoDerecha, pageWidth - margin, footerY + 2, { align: 'right' });
  }

  private dibujarKpiBox(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    val: string,
    colorBorde: [number, number, number]
  ): void {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(colorBorde[0], colorBorde[1], colorBorde[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

    doc.setFillColor(colorBorde[0], colorBorde[1], colorBorde[2]);
    doc.roundedRect(x, y, 2.5, h, 0.8, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 5, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colorBorde[0], colorBorde[1], colorBorde[2]);
    doc.text(val, x + 5, y + 10.5);
  }

  private descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private formatearGuaranies(monto: number): string {
    return Math.round(monto || 0).toLocaleString('es-PY') + ' Gs.';
  }

  private formatearNumero(monto: number): string {
    return Math.round(monto || 0).toLocaleString('es-PY');
  }

  private formatearFechaHora(iso: string): string {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return iso;
    }
  }

  private formatearFecha(iso: string): string {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return iso;
    }
  }

  private formatearMetodoPagoCorto(metodo?: string): string {
    if (!metodo) return '—';
    switch (metodo) {
      case 'EFECTIVO': return 'Efectivo';
      case 'TARJETA_DEBITO': return 'Débito';
      case 'TARJETA_CREDITO': return 'Crédito';
      case 'TRANSFERENCIA_BANCARIA_QR': return 'QR / Transf.';
      default: return metodo;
    }
  }

  private sanitizarCsv(texto: string): string {
    if (!texto) return '';
    return texto.replace(/"/g, '""').replace(/[\r\n]+/g, ' ').trim();
  }

  private limpiarFechaArchivo(fecha?: string): string {
    if (!fecha) return 'todos';
    return fecha.replace(/[^0-9-]/g, '');
  }
}
