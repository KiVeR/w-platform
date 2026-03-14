<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { LMap, LTileLayer, LGeoJson, LCircle, LMarker } from '@vue-leaflet/vue-leaflet'
import { Badge } from '#targeting/components/ui/badge'
import departmentsGeo from '#targeting/data/departments-geo.json'
import departmentsPopulation from '#targeting/data/departments-population.json'
import type { CommuneFeatureProperties, TargetingMethod } from '#targeting/types/targeting'
import { deptCodeFromPostcode } from '#targeting/utils/departments'

interface CommuneGeoJson {
  type: 'FeatureCollection'
  features: { type: 'Feature', properties: CommuneFeatureProperties, geometry: unknown }[]
}

const props = defineProps<{
  method: TargetingMethod
  departments: string[]
  postcodes: string[]
  address: string | null
  lat: number | null
  lng: number | null
  radius: number | null
  defaultCenter?: [number, number]
  defaultZoom?: number
  communeGeoJson?: CommuneGeoJson | null
}>()

const emit = defineEmits<{
  toggleDepartment: [code: string]
}>()

const { t } = useI18n()
const { isDark } = useColorMode()
const mapRef = ref<InstanceType<typeof LMap> | null>(null)

const hasNoSelection = computed(() =>
  props.departments.length === 0 && props.postcodes.length === 0,
)

const isDefaultCenter = computed(() =>
  Boolean(props.defaultCenter) && hasNoSelection.value,
)

const center = computed<[number, number]>(() => {
  if (props.method === 'address' && props.lat && props.lng) {
    return [props.lat, props.lng]
  }
  if (isDefaultCenter.value) return props.defaultCenter!
  return [46.6, 2.3]
})

const zoom = computed(() => {
  if (props.method === 'address' && props.lat) return 10
  if (isDefaultCenter.value) return props.defaultZoom ?? 9
  return 6
})

const circleRadius = computed(() => (props.radius ?? 10) * 1000)

const tileUrl = computed(() =>
  isDark.value
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
)

const hasCommuneLayer = computed(() =>
  props.method === 'postcode' && Boolean(props.communeGeoJson?.features?.length),
)

const geoJsonKey = computed(() =>
  `${props.departments.join(',')}-${props.postcodes.join(',')}-${isDark.value}-${hasCommuneLayer.value}`,
)

const communeGeoJsonKey = computed(() => {
  const codes = props.communeGeoJson?.features?.map(f => f.properties.code).join(',') ?? ''
  return `commune-${codes}`
})

const selectedDeptSet = computed(() => new Set(props.departments))

const postcodeDepts = computed(() => {
  if (props.method !== 'postcode') return new Set<string>()
  return new Set(props.postcodes.map(deptCodeFromPostcode))
})

const badgeCount = computed(() => {
  if (props.method === 'department') return `${props.departments.length} ${t('wizard.targeting.department.label')}`
  if (props.method === 'postcode') return `${props.postcodes.length} ${t('wizard.targeting.postcode.label')}`
  return null
})

const FLY_OPTIONS = { padding: [50, 50], duration: 0.8 } as const

function getLeafletMap() {
  if (!mapRef.value) return null
  return (mapRef.value as any).leafletObject ?? null
}

function computeBoundsFromFeatures(features: { geometry: any }[]): [[number, number], [number, number]] | null {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity

  for (const feature of features) {
    const rings: number[][][] = feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates.flat()
      : feature.geometry.coordinates
    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (typeof lat !== 'number' || typeof lng !== 'number')
          continue

        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
      }
    }
  }

  if (minLat === Infinity) return null
  return [[minLat, minLng], [maxLat, maxLng]]
}

function flyToBounds(features: { geometry: any }[]): void {
  const map = getLeafletMap()
  if (!map || features.length === 0) return
  const bounds = computeBoundsFromFeatures(features)
  if (bounds) map.flyToBounds(bounds, FLY_OPTIONS)
}

function flyToAddress(): void {
  const map = getLeafletMap()
  if (!map || !props.lat || !props.lng) return
  const r = props.radius ?? 10
  const latDelta = r / 111
  const lngDelta = r / (111 * Math.cos(props.lat * Math.PI / 180))
  map.flyToBounds(
    [[props.lat - latDelta, props.lng - lngDelta], [props.lat + latDelta, props.lng + lngDelta]],
    FLY_OPTIONS,
  )
}

function flyToDepartments(): void {
  const codes = props.method === 'department'
    ? props.departments
    : [...postcodeDepts.value]
  const features = (departmentsGeo as any).features.filter(
    (f: any) => codes.includes(f.properties.code),
  )
  flyToBounds(features)
}

function flyToCommunes(): void {
  if (!props.communeGeoJson?.features?.length) return
  flyToBounds(props.communeGeoJson.features as any[])
}

watch(() => [props.lat, props.lng, props.radius], () => {
  nextTick(flyToAddress)
})

watch(() => [props.departments.length, props.postcodes.length], () => {
  if (props.method !== 'address') nextTick(flyToDepartments)
})

watch(() => props.communeGeoJson?.features?.length, (len) => {
  if (len) nextTick(flyToCommunes)
})

function onMapReady(): void {
  if (props.method === 'address' && props.lat && props.lng) {
    flyToAddress()
  }
  else if (props.method !== 'address' && !hasNoSelection.value) {
    flyToDepartments()
  }
}

function featureStyle(code: string) {
  const selected = selectedDeptSet.value.has(code) || postcodeDepts.value.has(code)
  const dark = isDark.value

  if (hasCommuneLayer.value) {
    return {
      fillColor: 'transparent',
      fillOpacity: 0,
      color: dark ? '#64748b' : '#94a3b8',
      weight: 0.5,
      dashArray: '4 4',
    }
  }

  if (selected) {
    return {
      fillColor: '#f97316',
      fillOpacity: 0.4,
      color: '#f97316',
      weight: 2.5,
    }
  }

  return {
    fillColor: dark ? '#cbd5e1' : 'transparent',
    fillOpacity: dark ? 0.08 : 0,
    color: dark ? '#94a3b8' : '#64748b',
    weight: dark ? 1.5 : 1,
  }
}

const geoJsonOptions = computed(() => ({
  onEachFeature: (feature: { properties: { code: string, name: string } }, layer: any) => {
    layer.setStyle(featureStyle(feature.properties.code))

    if (!hasCommuneLayer.value) {
      const pop = (departmentsPopulation as Record<string, number>)[feature.properties.code]
      const popText = pop ? `<br/><span style="opacity:0.7">Pop. ${pop.toLocaleString('fr-FR')} hab.</span>` : ''
      layer.bindTooltip(
        `<strong>${feature.properties.code}</strong> ${feature.properties.name}${popText}`,
        { sticky: true, className: 'targeting-tooltip' },
      )
    }

    layer.on('mouseover', () => {
      if (!hasCommuneLayer.value) {
        layer.setStyle({ weight: 3, color: '#3b82f6' })
      }
    })
    layer.on('mouseout', () => {
      layer.setStyle(featureStyle(feature.properties.code))
    })

    layer.on('click', () => {
      emit('toggleDepartment', feature.properties.code)
    })
  },
}))

const COMMUNE_STYLE = { fillColor: '#3b82f6', fillOpacity: 0.15, color: '#3b82f6', weight: 2 }
const COMMUNE_HOVER_STYLE = { fillColor: '#2563eb', fillOpacity: 0.3, color: '#2563eb', weight: 3 }

const communeGeoJsonOptions = computed(() => ({
  onEachFeature: (feature: { properties: CommuneFeatureProperties }, layer: any) => {
    layer.setStyle(COMMUNE_STYLE)

    const postcodes = feature.properties.selectedPostcodes?.join(', ') ?? ''
    const pop = feature.properties.population?.toLocaleString('fr-FR') ?? '?'
    layer.bindTooltip(
      `<strong>${feature.properties.nom}</strong><br/>`
      + `<span style="opacity:0.8">${postcodes}</span><br/>`
      + `<span style="opacity:0.7">Pop. ${pop} hab.</span>`,
      { sticky: true, className: 'targeting-tooltip' },
    )

    layer.on('mouseover', () => {
      layer.setStyle(COMMUNE_HOVER_STYLE)
    })
    layer.on('mouseout', () => {
      layer.setStyle(COMMUNE_STYLE)
    })
  },
}))
</script>

<template>
  <div class="relative h-[400px] overflow-hidden rounded-lg border">
    <Badge
      v-if="badgeCount"
      data-map-counter
      variant="secondary"
      class="absolute right-3 top-3 z-[1000] shadow-sm"
    >
      {{ badgeCount }}
    </Badge>

    <LMap
      ref="mapRef"
      :zoom="zoom"
      :center="center"
      :use-global-leaflet="false"
      :options="{ attributionControl: false }"
      class="h-full w-full"
      @ready="onMapReady"
    >
      <LTileLayer :url="tileUrl" />

      <LGeoJson
        v-if="method !== 'address'"
        :key="geoJsonKey"
        :geojson="departmentsGeo"
        :options="geoJsonOptions"
      />

      <LGeoJson
        v-if="hasCommuneLayer"
        :key="communeGeoJsonKey"
        :geojson="communeGeoJson!"
        :options="communeGeoJsonOptions"
        data-commune-geojson
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

<style>
.targeting-tooltip {
  font-size: 12px;
  padding: 4px 8px;
}

.leaflet-overlay-pane svg {
  outline: none;
  border: none;
}

.leaflet-interactive:focus {
  outline: none;
}
</style>
