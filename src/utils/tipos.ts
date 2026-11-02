// Información de cada tipo: nombre en español, color y su debilidad principal
interface InfoTipo {
  nombre: string
  color: string
  debilidad: string
}

export const TIPOS: Record<string, InfoTipo> = {
  normal: { nombre: 'Normal', color: '#d9d4c1', debilidad: 'fighting' },
  fire: { nombre: 'Fuego', color: '#ec2e26', debilidad: 'water' },
  water: { nombre: 'Agua', color: '#0884e7', debilidad: 'electric' },
  grass: { nombre: 'Planta', color: '#21a34a', debilidad: 'fire' },
  electric: { nombre: 'Eléctrico', color: '#f3e311', debilidad: 'ground' },
  ice: { nombre: 'Hielo', color: '#77bfce', debilidad: 'fire' },
  fighting: { nombre: 'Lucha', color: '#d75019', debilidad: 'psychic' },
  poison: { nombre: 'Veneno', color: '#cc48e2', debilidad: 'ground' },
  ground: { nombre: 'Tierra', color: '#e4bb61', debilidad: 'water' },
  flying: { nombre: 'Volador', color: '#bca6fd', debilidad: 'electric' },
  psychic: { nombre: 'Psíquico', color: '#fd4f9b', debilidad: 'dark' },
  bug: { nombre: 'Bicho', color: '#9acd2f', debilidad: 'fire' },
  rock: { nombre: 'Roca', color: '#b47308', debilidad: 'water' },
  ghost: { nombre: 'Fantasma', color: '#6c3ecb', debilidad: 'dark' },
  dragon: { nombre: 'Dragón', color: '#cbaf00', debilidad: 'ice' },
  dark: { nombre: 'Siniestro', color: '#20485e', debilidad: 'fighting' },
  steel: { nombre: 'Acero', color: '#9aa1a8', debilidad: 'fire' },
  fairy: { nombre: 'Hada', color: '#ff70ff', debilidad: 'steel' },
}

const DESCONOCIDO: InfoTipo = { nombre: 'Desconocido', color: '#69a191', debilidad: 'normal' }

export const infoTipo = (tipo: string): InfoTipo => TIPOS[tipo] ?? DESCONOCIDO

// Ruta del icono en la carpeta public/tipos
export const iconoTipo = (tipo: string): string =>
  `${import.meta.env.BASE_URL}tipos/${TIPOS[tipo] ? tipo : 'unknown'}.png`
