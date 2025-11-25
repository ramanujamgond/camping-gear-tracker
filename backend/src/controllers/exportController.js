const PDFDocument = require('pdfkit');
const { Item, ItemImage, Category } = require('../models');

exports.exportToPDF = async (req, res) => {
  try {
    // Fetch all items with images and categories
    const items = await Item.findAll({
      include: [
        {
          model: ItemImage,
          as: 'images',
          attributes: ['image_url', 'is_primary'],
        },
        {
          model: Category,
          as: 'categories',
          attributes: ['name'],
          through: { attributes: [] },
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=camping-gear-inventory-${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(24).font('Helvetica-Bold').text('Camping Gear Inventory', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.fontSize(10).text(`Total Items: ${items.length}`, { align: 'center' });
    doc.moveDown(2);

    // Add items
    items.forEach((item, index) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }

      // Item header
      doc.fontSize(14).font('Helvetica-Bold').text(`${index + 1}. ${item.name}`, { underline: true });
      doc.moveDown(0.5);

      // QR Code ID
      doc.fontSize(10).font('Helvetica').text(`QR Code: ${item.qr_code_id}`, { indent: 20 });

      // Categories
      if (item.categories && item.categories.length > 0) {
        const categoryNames = item.categories.map(c => c.name).join(', ');
        doc.text(`Categories: ${categoryNames}`, { indent: 20 });
      }

      // Description
      if (item.description) {
        doc.text(`Description: ${item.description}`, { indent: 20 });
      }

      // Images count
      if (item.images && item.images.length > 0) {
        doc.text(`Images: ${item.images.length} photo(s)`, { indent: 20 });
      }

      // Dates
      doc.fontSize(9).fillColor('#666')
        .text(`Created: ${new Date(item.createdAt).toLocaleDateString()}`, { indent: 20 });
      doc.text(`Updated: ${new Date(item.updatedAt).toLocaleDateString()}`, { indent: 20 });

      doc.fillColor('#000');
      doc.moveDown(1.5);

      // Add separator line
      doc.strokeColor('#ccc').lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown();
    });

    // Add footer on last page
    doc.fontSize(8).fillColor('#999')
      .text('Camping Gear Tracker - Inventory Report', 50, doc.page.height - 50, { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to export PDF', error: error.message });
    }
  }
};
