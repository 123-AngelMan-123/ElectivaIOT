import axios from 'axios'

// Lee la URL de la API desde la variable de entorno Vite (opcional),
// si no está definida asume que el backend está en localhost:8080
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const API = axios.create({ baseURL: `${API_URL}/api` })

export async function getDatos({ limite = 100, desde = 0, uuid } = {}){
  const params = { limite, desde }
  if (uuid) params.uuid = uuid
  const resp = await API.get('/datos', { params })
  return resp.data
}

export async function chatQuery(message) {
  const resp = await API.post('/chat', { message })
  return resp.data
}

export async function getDispositivos({ limite = 100, desde = 0 } = {}){
  const resp = await API.get('/dispositivos', { params: { limite, desde } })
  return resp.data
}
