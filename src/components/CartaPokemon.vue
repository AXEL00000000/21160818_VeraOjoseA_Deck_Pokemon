<script setup lang="ts">
import { computed } from 'vue'
import type { Pokemon } from '@/types/pokemon'
import { infoTipo, iconoTipo } from '@/utils/tipos'

const props = defineProps<{ pokemon: Pokemon }>()

const marco = `${import.meta.env.BASE_URL}marco.png`

const tipoPrincipal = computed(() => props.pokemon.tipos[0] ?? 'normal')
const tipoSecundario = computed(() => props.pokemon.tipos[1])

// Fondo: un color si tiene un tipo, partido en diagonal si tiene dos
const fondo = computed(() => {
  const c1 = infoTipo(tipoPrincipal.value).color
  if (!tipoSecundario.value) {
    return `linear-gradient(160deg, color-mix(in srgb, ${c1} 45%, #fff), color-mix(in srgb, ${c1} 85%, #fff))`
  }
  const c2 = infoTipo(tipoSecundario.value).color
  return `linear-gradient(120deg, color-mix(in srgb, ${c1} 65%, #fff) 0 55%, color-mix(in srgb, ${c2} 65%, #fff) 55% 100%)`
})

// Variables CSS de la carta: fondo, color de cada tipo e icono principal
const estilo = computed(() => ({
  '--fondo': fondo.value,
  '--c1': infoTipo(tipoPrincipal.value).color,
  '--c2': infoTipo(tipoSecundario.value ?? tipoPrincipal.value).color,
  '--icono': `url(${iconoTipo(tipoPrincipal.value)})`,
}))

const nombresTipos = computed(() => props.pokemon.tipos.map((t) => infoTipo(t).nombre).join(' / '))
const numero = computed(() => String(props.pokemon.id).padStart(3, '0'))

// Debilidad principal del tipo (x2, como en las cartas)
const debilidad = computed(() => infoTipo(tipoPrincipal.value).debilidad)

// Costo de retirada estimado según el peso: de 1 a 4
const retirada = computed(() => Math.min(4, Math.max(1, Math.ceil(props.pokemon.peso / 50))))
</script>

<template>
  <article class="carta" :style="estilo">
    <!-- Capas: fondo de color, ventana de la imagen y el marco encima -->
    <div class="fondo"></div>
    <div class="ventana">
      <img :src="pokemon.imagen" :alt="pokemon.nombre" loading="lazy" />
    </div>
    <img class="marco" :src="marco" alt="" />

    <!-- Encabezado -->
    <span class="etapa">{{ pokemon.etapa }}</span>
    <img
      class="sprite"
      :src="pokemon.sprite"
      :alt="`${pokemon.nombre} en pixeles`"
      loading="lazy"
    />
    <h2 class="nombre">{{ pokemon.nombre }}</h2>
    <div class="hp">
      <small>PS</small>{{ pokemon.hp }}
      <span class="iconos">
        <img
          v-for="tipo in pokemon.tipos"
          :key="tipo"
          :src="iconoTipo(tipo)"
          :alt="infoTipo(tipo).nombre"
        />
      </span>
    </div>

    <!-- Franja bajo la imagen -->
    <p class="franja">
      N.º {{ numero }} · Tipo {{ nombresTipos }} · Alt. {{ pokemon.altura }} m · Peso
      {{ pokemon.peso }} kg
    </p>

    <!-- Habilidades y características -->
    <div class="cuerpo">
      <div v-for="habilidad in pokemon.habilidades" :key="habilidad.nombre" class="habilidad">
        <img :src="iconoTipo(tipoPrincipal)" alt="" />
        <div>
          <h3><small>Habilidad</small> {{ habilidad.nombre }}</h3>
          <p v-if="habilidad.descripcion">{{ habilidad.descripcion }}</p>
        </div>
      </div>

      <div class="stats">
        <div><small>Ataque</small>{{ pokemon.ataque }}</div>
        <div><small>Defensa</small>{{ pokemon.defensa }}</div>
        <div><small>Velocidad</small>{{ pokemon.velocidad }}</div>
      </div>
    </div>

    <!-- Barras de abajo -->
    <div class="debilidad">
      Debilidad <img :src="iconoTipo(debilidad)" :alt="infoTipo(debilidad).nombre" /> ×2
    </div>
    <div class="retirada">
      Retirada
      <img v-for="n in retirada" :key="n" :src="iconoTipo('normal')" alt="" />
    </div>

    <p class="pie">
      <span>Deck Pokémon · Vue.js</span>
      <span>{{ numero }}/1025</span>
    </p>
  </article>
</template>

<style scoped>
/* Todas las medidas son % del marco (750 x 1043), así la carta escala sin descuadrarse */
.carta {
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 300px;
  aspect-ratio: 750 / 1043;
  text-align: left;
  font-family: 'Cabin', Arial, sans-serif;
  color: #1b1b1b;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.35));
  transition: transform 0.2s;
}
.carta:hover {
  transform: translateY(-6px);
}
.carta > * {
  position: absolute;
  margin: 0;
}

/* Capas */
.fondo {
  inset: 2.7% 4.2% 2.8% 4%;
  border-radius: 2cqw;
  background:
    radial-gradient(circle at 25% 68%, rgba(255, 255, 255, 0.35), transparent 30%),
    radial-gradient(circle at 78% 82%, rgba(255, 255, 255, 0.25), transparent 28%),
    radial-gradient(circle at 60% 25%, rgba(255, 255, 255, 0.3), transparent 35%), var(--fondo);
}
/* La ventana ocupa justo el hueco del marco y recorta lo que se salga */
.ventana {
  left: 7.47%;
  top: 9.49%;
  width: 84.93%;
  height: 38.45%;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(
    circle at 50% 50%,
    #fff 0 25%,
    color-mix(in srgb, var(--c1) 35%, #fff) 80%
  );
}
/* Icono del tipo en grande y transparente, como marca de agua */
.ventana::before {
  content: '';
  position: absolute;
  inset: 5%;
  background: var(--icono) center / contain no-repeat;
  opacity: 0.2;
}
.ventana img {
  position: relative;
  width: 72%;
  height: 84%;
  object-fit: contain;
  filter: drop-shadow(0 1.5cqw 1cqw rgba(0, 0, 0, 0.3));
}
.marco {
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Encabezado */
.etapa {
  left: 3%;
  top: 3%;
  width: 16%;
  height: 2.5%;
  display: grid;
  place-items: center;
  font-size: 2.4cqw;
  font-weight: bold;
  font-style: italic;
  text-transform: uppercase;
}
/* El sprite trae mucho margen vacío: se agranda y se recorta al círculo */
.sprite {
  left: 1.1%;
  top: 6.1%;
  width: 17%;
  clip-path: circle(38%);
  image-rendering: pixelated;
}
.nombre {
  left: 21%;
  top: 4%;
  width: 46%;
  height: 5.2%;
  display: flex;
  align-items: flex-end;
  font:
    700 6.4cqw/1 'Cabin Condensed',
    sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0 1cqw #fff;
}
.hp {
  right: 5.5%;
  top: 3.6%;
  display: flex;
  align-items: center;
  gap: 0.6cqw;
  font:
    700 6.8cqw/1 'Cabin Condensed',
    sans-serif;
  color: #c0161b;
  text-shadow: 0 0 1cqw #fff;
}
.hp small {
  font-size: 2.6cqw;
  color: #1b1b1b;
}
.iconos {
  display: flex;
  margin-left: 0.8cqw;
}
.iconos img {
  width: 7.5cqw;
  filter: drop-shadow(0 0.3cqw 0.3cqw rgba(0, 0, 0, 0.4));
}
.iconos img + img {
  margin-left: -2.5cqw;
}

/* Franja */
.franja {
  left: 8.5%;
  top: 47.9%;
  width: 82%;
  height: 2%;
  display: grid;
  place-items: center;
  font-size: 2.2cqw;
  font-style: italic;
  white-space: nowrap;
}

/* Cuerpo */
.cuerpo {
  left: 7%;
  top: 52.5%;
  width: 86%;
  height: 32%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}
.habilidad {
  display: flex;
  align-items: flex-start;
  gap: 2.2cqw;
  padding-bottom: 1.2cqw;
  border-bottom: 0.3cqw solid rgba(0, 0, 0, 0.25);
}
.habilidad img {
  width: 6cqw;
  margin-top: 0.4cqw;
}
.habilidad small {
  display: inline-block;
  padding: 0.2cqw 1.4cqw;
  border-radius: 1cqw;
  background: #c0161b;
  color: #fff;
  font:
    700 2.2cqw 'Cabin',
    sans-serif;
  vertical-align: middle;
}
.habilidad h3 {
  margin: 0;
  font:
    700 4.6cqw/1.1 'Cabin Condensed',
    sans-serif;
  text-transform: capitalize;
  text-shadow: 0 0 1cqw #fff;
}
/* Descripción: máximo 2 líneas para que nunca empuje lo de abajo */
.habilidad p {
  margin: 0.6cqw 0 0;
  font-size: 2.7cqw;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 0.8cqw 0;
  border-radius: 1.5cqw;
  background: rgba(255, 255, 255, 0.6);
  text-align: center;
  font:
    700 4.4cqw/1.1 'Cabin Condensed',
    sans-serif;
}
.stats small {
  display: block;
  font:
    400 2.3cqw 'Cabin',
    sans-serif;
}

/* Barras de abajo */
.debilidad,
.retirada {
  top: 86.1%;
  height: 3.1%;
  display: flex;
  align-items: center;
  gap: 1cqw;
  font-size: 2.6cqw;
  font-weight: bold;
}
.debilidad {
  left: 7%;
  width: 48%;
}
.retirada {
  left: 61%;
  width: 33%;
}
.debilidad img,
.retirada img {
  width: 3.8cqw;
}

.pie {
  left: 7%;
  top: 91.8%;
  width: 86%;
  display: flex;
  justify-content: space-between;
  font-size: 2.1cqw;
  font-style: italic;
}
</style>
