<script setup lang="ts">
import { computed } from 'vue'
import type { Pokemon } from '@/types/pokemon'
import { infoTipo, iconoTipo } from '@/utils/tipos'

const props = defineProps<{ pokemons: Pokemon[] }>()

// Tipo seleccionado para resaltar (null = todos)
const filtro = defineModel<string | null>('filtro', { default: null })

// Cuántas cartas hay de cada tipo (un Pokémon con 2 tipos cuenta en ambos)
const conteo = computed(() => {
  const mapa = new Map<string, number>()
  for (const pokemon of props.pokemons) {
    for (const tipo of pokemon.tipos) {
      mapa.set(tipo, (mapa.get(tipo) ?? 0) + 1)
    }
  }
  return [...mapa.entries()].sort((a, b) => b[1] - a[1])
})

const psPromedio = computed(() => {
  if (props.pokemons.length === 0) return 0
  const total = props.pokemons.reduce((suma, p) => suma + p.hp, 0)
  return Math.round(total / props.pokemons.length)
})

const elegir = (tipo: string) => {
  filtro.value = filtro.value === tipo ? null : tipo
}
</script>

<template>
  <section class="resumen" aria-label="Resumen del deck">
    <dl class="datos">
      <div>
        <dd>{{ pokemons.length }}</dd>
        <dt>cartas</dt>
      </div>
      <div>
        <dd>{{ psPromedio }}</dd>
        <dt>PS promedio</dt>
      </div>
      <div>
        <dd>{{ conteo.length }}</dd>
        <dt>tipos</dt>
      </div>
    </dl>

    <div class="tipos">
      <button
        v-for="[tipo, cantidad] in conteo"
        :key="tipo"
        type="button"
        class="tipo"
        :class="{ activo: filtro === tipo, apagado: filtro && filtro !== tipo }"
        :title="`Resaltar tipo ${infoTipo(tipo).nombre}`"
        @click="elegir(tipo)"
      >
        <img :src="iconoTipo(tipo)" :alt="infoTipo(tipo).nombre" />
        <span>{{ cantidad }}</span>
      </button>
      <button v-if="filtro" type="button" class="limpiar" @click="filtro = null">Ver todas</button>
    </div>
  </section>
</template>

<style scoped>
.resumen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.8rem 1.2rem;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.datos {
  display: flex;
  gap: 1.4rem;
  margin: 0;
}
.datos div {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}
.datos dd {
  margin: 0;
  font:
    700 1.4rem 'Cabin Condensed',
    sans-serif;
  color: #ffd84d;
}
.datos dt {
  font-size: 0.9rem;
}
.tipos {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
}
.tipo {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem 0.2rem 0.2rem;
  border: 2px solid transparent;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font:
    700 1rem 'Cabin Condensed',
    sans-serif;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.tipo:hover {
  transform: translateY(-2px);
}
.tipo img {
  width: 28px;
  height: 28px;
}
.tipo.activo {
  border-color: #ffd84d;
  background: rgba(255, 216, 77, 0.2);
}
.tipo.apagado {
  opacity: 0.4;
}
.limpiar {
  padding: 0.3rem 0.8rem;
  border: 0;
  border-radius: 999px;
  background: #ffd84d;
  font-weight: bold;
  cursor: pointer;
}
</style>
