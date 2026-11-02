// Habilidad con su nombre y descripción en español
export interface Habilidad {
  nombre: string
  descripcion: string
}

// Datos que necesita cada carta
export interface Pokemon {
  id: number
  nombre: string
  etapa: string // 'Básico', 'Fase 1' o 'Fase 2'
  imagen: string // ilustración oficial
  sprite: string // versión en pixeles (8 bits)
  tipos: string[]
  hp: number
  ataque: number
  defensa: number
  velocidad: number
  altura: number
  peso: number
  habilidades: Habilidad[]
}
