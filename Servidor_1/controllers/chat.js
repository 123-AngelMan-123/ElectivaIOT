const { response, request } = require('express')
const { Dato, Dispositivo } = require('../models')

const normalizeText = (text = '') => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A'
  return Number(value).toFixed(2)
}

const chatPost = async (req = request, res = response) => {
  try {
    const { message = '' } = req.body
    const question = normalizeText(message)

    const [total, dispositivos, latestDatos, stats] = await Promise.all([
      Dato.countDocuments(),
      Dispositivo.find().lean(),
      Dato.find().sort({ fecha_insercion: -1 }).limit(5).lean(),
      Dato.aggregate([
        {
          $group: {
            _id: null,
            min1: { $min: '$valor1' },
            max1: { $max: '$valor1' },
            avg1: { $avg: '$valor1' },
            min2: { $min: '$valor2' },
            max2: { $max: '$valor2' },
            avg2: { $avg: '$valor2' },
            min3: { $min: '$valor3' },
            max3: { $max: '$valor3' },
            avg3: { $avg: '$valor3' },
            min4: { $min: '$valor4' },
            max4: { $max: '$valor4' },
            avg4: { $avg: '$valor4' }
          }
        }
      ])
    ])

    const devicesCount = dispositivos.length
    const deviceList = dispositivos.slice(0, 5).map(d => d.nombre ? `${d.nombre} (${d.uuid})` : d.uuid)
    const statsValues = stats[0] || {}

    const answers = []
    const hasData = total > 0

    if (!hasData) {
      return res.json({ answer: 'No hay datos guardados en la base de datos todavía. Mantén el sistema activo para comenzar a recibir registros.' })
    }

    if (question.includes('registro') || question.includes('total') || question.includes('cuantos') || question.includes('cantidad')) {
      answers.push(`Actualmente hay ${total} registros de datos guardados en la base de datos.`)
    }

    if (question.includes('dispositivo') || question.includes('dispositivos')) {
      answers.push(`Hay ${devicesCount} dispositivos registrados.`)
      if (deviceList.length) {
        answers.push(`Algunos de ellos son: ${deviceList.join(', ')}.`)
      }
    }

    if (question.includes('ultimo') || question.includes('último') || question.includes('reciente')) {
      if (latestDatos.length) {
        const last = latestDatos[0]
        answers.push(`El último registro corresponde al dispositivo ${last.dispositivo_uuid} con valores: Puerto 10V=${formatNumber(last.valor1)}, Puerto 5V=${formatNumber(last.valor2)}, Puerto 3.3V=${formatNumber(last.valor3)} y Puerto X=${formatNumber(last.valor4)}. Fecha de inserción: ${new Date(last.fecha_insercion).toLocaleString('es-ES')}.`)
      }
    }

    if (question.includes('promedio') || question.includes('media')) {
      answers.push(`Los promedios actuales son: Puerto 10V=${formatNumber(statsValues.avg1)}, Puerto 5V=${formatNumber(statsValues.avg2)}, Puerto 3.3V=${formatNumber(statsValues.avg3)} y Puerto X=${formatNumber(statsValues.avg4)}.`)
    }

    if (question.includes('maximo') || question.includes('máximo') || question.includes('mayor')) {
      answers.push(`Los valores máximos registrados son: Puerto 10V=${formatNumber(statsValues.max1)}, Puerto 5V=${formatNumber(statsValues.max2)}, Puerto 3.3V=${formatNumber(statsValues.max3)} y Puerto X=${formatNumber(statsValues.max4)}.`)
    }

    if (question.includes('minimo') || question.includes('mínimo') || question.includes('menor')) {
      answers.push(`Los valores mínimos registrados son: Puerto 10V=${formatNumber(statsValues.min1)}, Puerto 5V=${formatNumber(statsValues.min2)}, Puerto 3.3V=${formatNumber(statsValues.min3)} y Puerto X=${formatNumber(statsValues.min4)}.`)
    }

    if (answers.length === 0) {
      answers.push(`He revisado los datos guardados en la base y puedo responder sobre registros, dispositivos, último dato, promedios, máximos y mínimos.`)
      answers.push(`Pregúntame por ejemplo: "¿Cuántos registros hay?", "¿Cuál es el promedio da cada puerto?" o "¿Cuál fue el último dato almacenado?".`)
    }

    return res.json({ answer: answers.join(' ') })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ answer: 'Ocurrió un error interno al procesar la consulta.' })
  }
}

module.exports = {
  chatPost
}
