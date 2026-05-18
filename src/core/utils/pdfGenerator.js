import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateOrderVoucher = (order) => {
    try {
        // 1. Inicializar documento (A4, portrait)
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // 2. Colores Corporativos FuelTrack
        const primaryColor = [37, 99, 235]; // #2563EB (Azul)
        const textColor = [15, 23, 42]; // #0F172A (Gris Oscuro)

        // 3. Diseño de la Cabecera (Header Banner)
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F'); // Rectángulo azul superior

        // Título / Logo
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text('FuelTrack', 14, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistemas Logísticos B2B', 14, 32);

        // Etiqueta de Documento
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('VOUCHER DE DESPACHO', 195, 25, { align: 'right' });
        doc.setFontSize(12);
        doc.text(`N° ${order.id}`, 195, 32, { align: 'right' });

        // 4. Datos del Cliente y Proveedor
        doc.setTextColor(...textColor);
        doc.setFontSize(11);

        // Bloque Cliente
        doc.setFont('helvetica', 'bold');
        doc.text('EMPRESA CLIENTE:', 14, 55);
        doc.setFont('helvetica', 'normal');
        doc.text('Empresa Minera S.A. (Cuenta Verificada)', 14, 62);
        doc.text('Sede Destino: ' + (order.location || 'Pendiente de asignación'), 14, 68);

        // Bloque Referencia Logística
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS LOGÍSTICOS:', 120, 55);
        doc.setFont('helvetica', 'normal');

        // Usar fecha del sistema actual para el voucher impreso
        const printDate = new Date().toLocaleDateString('es-PE');
        doc.text(`Fecha de Impresión: ${printDate}`, 120, 62);
        doc.text('Ref. / Orden Compra: ' + (order.documentRef || 'N/A'), 120, 68);

        // Línea separadora
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 75, 196, 75);

        // 5. Tabla de Productos (Usando la sintaxis blindada autoTable)
        autoTable(doc, {
            startY: 85,
            head: [['Descripción del Producto', 'Volumen (Galones)', 'Estado Actual']],
            body: [
                [order.fuelType, `${order.gallons.toLocaleString()} gal`, order.status]
            ],
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
            styles: { font: 'helvetica', fontSize: 11, cellPadding: 6 },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { halign: 'center' },
                2: { halign: 'center' }
            }
        });

        // 6. Pie de Página y Firmas (Footer)
        const finalY = doc.lastAutoTable.finalY + 30;

        // Línea de Firma
        doc.setDrawColor(148, 163, 184);
        doc.line(120, finalY, 180, finalY);
        doc.setFontSize(10);
        doc.text('Firma Autorizada', 150, finalY + 6, { align: 'center' });

        // Texto legal inferior
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
            'Este documento es generado electrónicamente por FuelTrack y tiene validez operativa para la cadena de suministro B2B.',
            105, 280, { align: 'center' }
        );

        // 7. Forzar Descarga
        doc.save(`Voucher_FuelTrack_${order.id}.pdf`);

    } catch (error) {
        console.error("Error al generar el PDF:", error);
        alert("Hubo un problema al generar el documento. Abre la consola (F12) para ver los detalles.");
    }
};