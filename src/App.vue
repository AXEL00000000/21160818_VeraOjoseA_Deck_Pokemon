<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import CartaPokemon from '@/components/CartaPokemon.vue'
import ResumenDeck from '@/components/ResumenDeck.vue'
import type { Habilidad, Pokemon } from '@/types/pokemon'

// Forma de los datos que responde la PokeAPI (solo lo que usamos)
interface PokemonApi {
  id: number
  name: string
  height: number
  weight: number
  species: { url: string }
  sprites: {
    front_default: string | null
    other: { 'official-artwork': { front_default: string | null } }
  }
  types: { type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  abilities: { ability: { name: string; url: string } }[]
}

interface EspecieApi {
  names: { name: string; language: { name: string } }[]
  evolves_from_species: { url: string } | null
}

interface HabilidadApi {
  names: { name: string; language: { name: string } }[]
  flavor_text_entries: { flavor_text: string; language: { name: string } }[]
}

const TOTAL_CARTAS = 40
const MAX_ID = 1025 // Pokémon existentes en la PokeAPI

const pokemons = ref<Pokemon[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const filtro = ref<string | null>(null) // tipo resaltado en el resumen
const seleccionada = ref<Pokemon | null>(null) // carta abierta en grande
const reverso = `${import.meta.env.BASE_URL}reverso.png`

// Genera 40 ids aleatorios sin repetir
const generarIds = (): number[] => {
  const ids = new Set<number>()
  while (ids.size < TOTAL_CARTAS) {
    ids.add(Math.floor(Math.random() * MAX_ID) + 1)
  }
  return [...ids]
}

// Básico, Fase 1 o Fase 2 según de quién evoluciona
const obtenerEtapa = async (especie: EspecieApi): Promise<string> => {
  if (!especie.evolves_from_species) return 'Básico'
  const { data: previa } = await axios.get<EspecieApi>(especie.evolves_from_species.url)
  return previa.evolves_from_species ? 'Fase 2' : 'Fase 1'
}

// Nombre y descripción en español de una habilidad.
// Se guardan en un Map para no pedir dos veces la misma habilidad.
const habilidadesGuardadas = new Map<string, Promise<Habilidad>>()

const obtenerHabilidad = (nombre: string, url: string): Promise<Habilidad> => {
  const guardada = habilidadesGuardadas.get(url)
  if (guardada) return guardada

  const peticion = axios
    .get<HabilidadApi>(url)
    .then(({ data }) => {
      const nombreEs = data.names.find((n) => n.language.name === 'es')?.name
      const textoEs = data.flavor_text_entries.find((f) => f.language.name === 'es')
      return {
        nombre: nombreEs ?? nombre.replace(/-/g, ' '),
        descripcion: textoEs?.flavor_text.replace(/\s+/g, ' ') ?? '',
      }
    })
    // Si falla, la carta se muestra igual con el nombre en inglés
    .catch(() => ({ nombre: nombre.replace(/-/g, ' '), descripcion: '' }))

  habilidadesGuardadas.set(url, peticion)
  return peticion
}

// Pide un Pokémon y lo convierte al formato de la carta
const fetchPokemon = async (id: number): Promise<Pokemon> => {
  const { data } = await axios.get<PokemonApi>(`https://pokeapi.co/api/v2/pokemon/${id}`)

  // Especie (nombre en español y etapa) y habilidades se piden AL MISMO TIEMPO
  const [{ nombreEs, etapa }, habilidades] = await Promise.all([
    axios.get<EspecieApi>(data.species.url).then(async ({ data: especie }) => ({
      nombreEs: especie.names.find((n) => n.language.name === 'es')?.name,
      etapa: await obtenerEtapa(especie),
    })),
    Promise.all(
      data.abilities.slice(0, 2).map((a) => obtenerHabilidad(a.ability.name, a.ability.url)),
    ),
  ])

  const stat = (nombre: string) => data.stats.find((s) => s.stat.name === nombre)?.base_stat ?? 0

  return {
    id: data.id,
    nombre: nombreEs ?? data.name,
    etapa,
    imagen:
      data.sprites.other['official-artwork'].front_default ?? data.sprites.front_default ?? '',
    sprite: data.sprites.front_default ?? '',
    tipos: data.types.map((t) => t.type.name),
    hp: stat('hp'),
    ataque: stat('attack'),
    defensa: stat('defense'),
    velocidad: stat('speed'),
    altura: data.height / 10, // viene en decímetros
    peso: data.weight / 10, // viene en hectogramos
    habilidades,
  }
}

const fetchPokemons = async () => {
  loading.value = true
  error.value = null
  filtro.value = null
  seleccionada.value = null

  try {
    pokemons.value = await Promise.all(generarIds().map(fetchPokemon))
  } catch (err) {
    error.value = 'Error al cargar los datos de los Pokémon.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Cerrar la carta en grande con la tecla Escape
const alPresionarTecla = (e: KeyboardEvent) => {
  if (e.key === 'Escape') seleccionada.value = null
}

onMounted(() => {
  fetchPokemons()
  window.addEventListener('keydown', alPresionarTecla)
})
onUnmounted(() => window.removeEventListener('keydown', alPresionarTecla))
</script>

<template>
  <div class="mesa">
    <header class="encabezado">
      <h1>Deck Pokémon</h1>
      <p>40 cartas aleatorias de la PokeAPI</p>
    </header>

    <ResumenDeck v-if="!loading && !error" v-model:filtro="filtro" :pokemons="pokemons" />

    <div v-if="loading" class="mensaje">Barajando cartas…</div>
    <div v-else-if="error" class="mensaje error">{{ error }}</div>

    <!-- Las cartas se reparten boca abajo y se voltean una por una -->
    <div v-else class="cartas">
      <div
        v-for="(pokemon, i) in pokemons"
        :key="pokemon.id"
        class="espacio"
        :class="{ apagada: filtro && !pokemon.tipos.includes(filtro) }"
        :style="{ '--i': i }"
        role="button"
        tabindex="0"
        :aria-label="`Ver ${pokemon.nombre} en grande`"
        @click="seleccionada = pokemon"
        @keydown.enter="seleccionada = pokemon"
      >
        <div class="volteo">
          <div class="cara frente">
            <CartaPokemon :pokemon="pokemon" />
          </div>
          <img class="cara reverso" :src="reverso" alt="" />
        </div>
      </div>
    </div>

    <!-- Mazo en la esquina: al darle clic se reparte un deck nuevo -->
    <button
      class="mazo"
      :class="{ barajando: loading }"
      type="button"
      :disabled="loading"
      title="Repartir un deck nuevo"
      @click="fetchPokemons"
    >
      <span class="pila">
        <img v-for="n in 3" :key="n" :src="reverso" alt="" />
      </span>
      <span class="texto">{{ loading ? 'Barajando…' : 'Nuevo deck' }}</span>
    </button>

    <!-- Carta en grande -->
    <Transition name="zoom">
      <div
        v-if="seleccionada"
        class="zoom"
        role="dialog"
        aria-modal="true"
        :aria-label="seleccionada.nombre"
        @click.self="seleccionada = null"
      >
        <button class="cerrar" type="button" aria-label="Cerrar" @click="seleccionada = null">
          ×
        </button>
        <CartaPokemon class="grande" :pokemon="seleccionada" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
}

/* Tapete de juego */
.mesa {
  min-height: 100vh;
  padding: 1.5rem 1rem 8rem;
  box-sizing: border-box;
  font-family: 'Cabin', Arial, sans-serif;
  text-align: center;
  color: #fff;
  background:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.025) 0 2px, transparent 2px 6px),
    repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.05) 0 2px, transparent 2px 6px),
    radial-gradient(ellipse at 50% 30%, #7fa8d8 0%, #4d6fa3 55%, #2e4166 100%);
  background-attachment: fixed;
}
.encabezado h1 {
  margin: 0;
  font:
    700 3rem/1 'Cabin Condensed',
    sans-serif;
  letter-spacing: 1px;
  color: #ffd84d;
  text-shadow:
    0 3px 0 #a87b00,
    0 6px 14px rgba(0, 0, 0, 0.5);
}
.encabezado p {
  margin: 0.4rem 0 1.2rem;
  opacity: 0.8;
}
.mensaje {
  margin-top: 3rem;
  font-size: 1.3rem;
}
.error {
  color: #ff8a80;
}

/* Cuadrícula de cartas */
.cartas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  justify-items: center;
  gap: 1.6rem 1.2rem;
  max-width: 1500px;
  margin: 0 auto;
  padding: 1.5rem 0.5rem;
}
.espacio {
  animation: llegar 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both;
  animation-delay: calc(var(--i) * 70ms);
  width: 100%;
  max-width: 280px;
  perspective: 1200px;
  cursor: zoom-in;
  border-radius: 12px;
  transition:
    opacity 0.3s,
    filter 0.3s;
}
.espacio:focus-visible {
  outline: 3px solid #ffd84d;
  outline-offset: 4px;
}
.espacio.apagada {
  opacity: 0.25;
  filter: grayscale(1);
}

/* Volteo: frente y reverso apilados en la misma celda */
.volteo {
  display: grid;
  transform-style: preserve-3d;
  animation: voltear 0.9s ease-in-out both;
  animation-delay: calc(var(--i) * 70ms);
}
.cara {
  grid-area: 1 / 1;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
/* El frente se separa un poquito para que nunca se encime con el reverso */
.frente {
  transform: translateZ(1px);
}
.reverso {
  width: 100%;
  aspect-ratio: 750 / 1043;
  object-fit: cover;
  border-radius: 4.5% / 3.2%;
  transform: rotateY(180deg);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.35);
}
/* La carta llega desde arriba (en .espacio) y se voltea (en .volteo).
   Van separadas porque animar la opacidad del elemento 3D rompe el volteo. */
@keyframes llegar {
  from {
    opacity: 0;
    transform: translateY(-80px) rotateZ(-10deg) scale(0.8);
  }
}
@keyframes voltear {
  0%,
  40% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(0deg);
  }
}

/* Mazo */
.mazo {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  border: 0;
  background: none;
  color: #fff;
  font:
    700 1rem 'Cabin Condensed',
    sans-serif;
  cursor: pointer;
}
.pila {
  position: relative;
  width: 84px;
  aspect-ratio: 750 / 1043;
}
.pila img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.5);
  transition: transform 0.25s;
}
.pila img:nth-child(1) {
  transform: translate(-6px, 6px) rotate(-6deg);
}
.pila img:nth-child(2) {
  transform: translate(-3px, 3px) rotate(-3deg);
}
.mazo:hover:not(:disabled) .pila img:nth-child(3) {
  transform: translateY(-10px) rotate(4deg);
}
.texto {
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  background: #ffd84d;
  color: #2b2100;
}
.mazo:disabled {
  cursor: wait;
}
.mazo.barajando .pila img:nth-child(3) {
  animation: barajar 0.5s ease-in-out infinite alternate;
}
@keyframes barajar {
  from {
    transform: translateX(-14px) rotate(-8deg);
  }
  to {
    transform: translateX(14px) rotate(8deg);
  }
}

/* Carta en grande */
.zoom {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  cursor: zoom-out;
}
.zoom .grande {
  width: min(90vw, 64vh, 480px);
  max-width: none;
  cursor: default;
}
.cerrar {
  position: absolute;
  top: 1rem;
  right: 1.2rem;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: #fff;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
}
.zoom-enter-active,
.zoom-leave-active {
  transition: opacity 0.25s;
}
.zoom-enter-active .grande,
.zoom-leave-active .grande {
  transition: transform 0.25s;
}
.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
}
.zoom-enter-from .grande,
.zoom-leave-to .grande {
  transform: scale(0.7);
}

@media (prefers-reduced-motion: reduce) {
  .espacio,
  .volteo,
  .mazo.barajando .pila img:nth-child(3) {
    animation: none;
  }
}
</style>
