const { Router } = require('express')
const { chatPost } = require('../controllers/chat')

const router = Router()

/**
 * @route POST /api/chat
 * Responde preguntas usando los datos guardados en la base de datos.
 */
router.post('/', chatPost)

module.exports = router
