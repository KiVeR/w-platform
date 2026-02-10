<script setup lang="ts">
import { computed } from 'vue'
import { LMap, LTileLayer, LGeoJson, LCircle, LMarker } from '@vue-leaflet/vue-leaflet'
import departmentsGeo from '@/data/departments-geo.json'
import type { TargetingMethod } from '@/types/campaign'

const props = defineProps<{
  method: TargetingMethod
  departments: string[]
  postcodes: string[]
  address: string | null
  lat: number | null
  lng: number | null
  radius: number | null
}>()

const emit = defineEmits<{
  toggleDepartment: [code: string]
}>()

const center = computed<[number, number]>(() => {
  if (props.method === 'address' && props.lat && props.lng) {
    return [props.lat, props.lng]
  }
  return [46.6, 2.3]
})

const zoom = computed(() => {
  if (props.method === 'address' && props.lat) return 10
  return 6
})

const circleRadius = computed(() => (props.radius ?? 10) * 1000)

const geoJsonOptions = computed(() => ({
  style: (feature: { properties: { code: string } }) => {
    const selected = props.departments.includes(feature.properties.code)
    return {
      fillColor: selected ? '#f97316' : 'transparent',
      fillOpacity: selected ? 0.3 : 0,
      color: selected ? '#f97316' : '#94a3b8',
      weight: 1,
    }
  },
  onEachFeature: (feature: { properties: { code: string } }, layer: { on: (event: string, handler: () => void) => void }) => {
    layer.on('click', () => {
      emit('toggleDepartment', feature.properties.code)
    })
  },
}))
</script>

<template>
  <div class="h-[400px] overflow-hidden rounded-lg border">
    <LMap
      :zoom="zoom"
      :center="center"
      :use-global-leaflet="false"
      class="h-full w-full"
    >
      <LTileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

      <LGeoJson
        v-if="method === 'department' || method === 'postcode'"
        :geojson="departmentsGeo"
        :options="geoJsonOptions"
      />

      <template v-if="method === 'address' && lat && lng">
        <LMarker :lat-lng="[lat, lng]" />
        <LCircle
          :lat-lng="[lat, lng]"
          :radius="circleRadius"
          color="#f97316"
          :fill-opacity="0.15"
        />
      </template>
    </LMap>
  </div>
</template>
