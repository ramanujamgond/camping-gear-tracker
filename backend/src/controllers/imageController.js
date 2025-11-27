const { Item, ItemImage } = require('../models');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('../config/cloudinary');

// POST /items/:id/images - Upload images
exports.uploadImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_primary } = req.body;

    // Check if item exists
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Validate file count
    if (req.files.length > 10) {
      return res.status(400).json({ 
        message: 'Too many files. Maximum 10 images allowed per upload' 
      });
    }

    const uploadedImages = [];
    const errors = [];

    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      try {
        const file = req.files[i];
        
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
          errors.push({ file: file.originalname, error: 'Not an image file' });
          continue;
        }

        // Resize and optimize image with sharp
        const optimizedBuffer = await sharp(file.buffer)
          .resize(1200, 1200, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'camping-gear',
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(optimizedBuffer);
        });

        // Save to database with Cloudinary URL
        const imageRecord = await ItemImage.create({
          item_id: id,
          image_url: uploadResult.secure_url,
          is_primary: is_primary === 'true' && i === 0
        });

        uploadedImages.push(imageRecord);
      } catch (fileError) {
        console.error(`Error processing file ${req.files[i].originalname}:`, fileError);
        errors.push({ 
          file: req.files[i].originalname, 
          error: fileError.message 
        });
      }
    }

    if (uploadedImages.length === 0) {
      return res.status(400).json({
        message: 'No images were uploaded successfully',
        errors
      });
    }

    return res.status(201).json({
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// DELETE /images/:id - Delete image
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await ItemImage.findByPk(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (image.image_url.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = image.image_url.split('/');
        const publicIdWithExt = urlParts.slice(urlParts.indexOf('camping-gear')).join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension
        
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.warn('Failed to delete from Cloudinary:', cloudinaryError.message);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    } else {
      // Legacy: Delete file from local disk (for old uploads)
      const filePath = path.join(__dirname, '../../', image.image_url);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn('File not found on disk:', filePath);
      }
    }

    // Delete from database
    await image.destroy();

    return res.json({ 
      message: 'Image deleted successfully',
      deleted_image_id: id
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
