const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const imageController = require('../controllers/imageController');
const upload = require('../middleware/upload');
const {
  createItemValidation,
  updateItemValidation,
  getItemByQrValidation,
  listItemsValidation,
  uploadImagesValidation,
  deleteImageValidation,
  deleteItemValidation
} = require('../middleware/validation');

// Item routes
router.get('/', listItemsValidation, itemController.listItems);
router.get('/:qr_code_id', getItemByQrValidation, itemController.getItemByQr);
router.post('/', createItemValidation, itemController.createItem);
router.put('/:id', updateItemValidation, itemController.updateItem);
router.delete('/:id', deleteItemValidation, itemController.deleteItem);

// Image routes
router.post('/:id/images', upload.array('images', 10), uploadImagesValidation, imageController.uploadImages);
router.delete('/images/:id', deleteImageValidation, imageController.deleteImage);

module.exports = router;
