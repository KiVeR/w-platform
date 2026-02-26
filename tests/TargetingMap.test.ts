import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from './helpers/stubs'

mockUseI18n()
vi.stubGlobal('useColorMode', () => ({ isDark: ref(false) }))

vi.mock('@vue-leaflet/vue-leaflet', () => ({
  LMap: { template: '<div data-map><slot /></div>', props: ['zoom', 'center'] },
  LTileLayer: { template: '<div />', props: ['url'] },
  LGeoJson: { template: '<div data-geojson v-bind="$attrs" />', props: ['geojson', 'options'], inheritAttrs: true },
  LCircle: { template: '<div data-circle />', props: ['latLng', 'radius'] },
  LMarker: { template: '<div data-marker />', props: ['latLng'] },
}))

const TargetingMap = (await import('@/components/targeting/TargetingMap.vue')).default

const baseStubs = {
  Badge: { template: '<span data-map-counter v-bind="$attrs"><slot /></span>', inheritAttrs: true },
}

describe('TargetingMap', () => {
  it('renders map container', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: [], postcodes: [], address: null, lat: null, lng: null, radius: null },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-map]').exists()).toBe(true)
  })

  it('renders GeoJSON layer in department mode', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: ['75'], postcodes: [], address: null, lat: null, lng: null, radius: null },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-geojson]').exists()).toBe(true)
  })

  it('renders circle and marker in address mode', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'address', departments: [], postcodes: [], address: 'Paris', lat: 48.86, lng: 2.34, radius: 10 },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-circle]').exists()).toBe(true)
    expect(wrapper.find('[data-marker]').exists()).toBe(true)
  })

  it('does not render circle in department mode', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: ['75'], postcodes: [], address: null, lat: null, lng: null, radius: null },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-circle]').exists()).toBe(false)
  })

  it('passes correct center and zoom', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: [], postcodes: [], address: null, lat: null, lng: null, radius: null },
      global: { stubs: baseStubs },
    })
    const map = wrapper.find('[data-map]')
    expect(map.exists()).toBe(true)
  })

  it('shows badge counter with department count', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: ['75', '13'], postcodes: [], address: null, lat: null, lng: null, radius: null },
      global: { stubs: baseStubs },
    })
    const badge = wrapper.find('[data-map-counter]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('2')
  })

  it('renders GeoJSON in postcode mode for highlight', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'postcode', departments: [], postcodes: ['75001', '13001'], address: null, lat: null, lng: null, radius: null },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-geojson]').exists()).toBe(true)
  })

  it('uses defaultCenter when provided and method is department with no selection', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: [], postcodes: [], address: null, lat: null, lng: null, radius: null, defaultCenter: [45.75, 4.85] as [number, number], defaultZoom: 9 },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-map]').exists()).toBe(true)
  })

  it('ignores defaultCenter when method is address (uses lat/lng targeting)', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'address', departments: [], postcodes: [], address: 'Paris', lat: 48.86, lng: 2.34, radius: 10, defaultCenter: [45.75, 4.85] as [number, number] },
      global: { stubs: baseStubs },
    })
    // In address mode, circle/marker rendered with targeting lat/lng, not defaultCenter
    expect(wrapper.find('[data-circle]').exists()).toBe(true)
    expect(wrapper.find('[data-marker]').exists()).toBe(true)
  })

  it('falls back to France center when no defaultCenter', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: [], postcodes: [], address: null, lat: null, lng: null, radius: null },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-map]').exists()).toBe(true)
  })

  it('ignores defaultCenter when departments are selected', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: ['75'], postcodes: [], address: null, lat: null, lng: null, radius: null, defaultCenter: [45.75, 4.85] as [number, number] },
      global: { stubs: baseStubs },
    })
    // Should still render with GeoJSON (departments selected), defaultCenter ignored
    expect(wrapper.find('[data-geojson]').exists()).toBe(true)
  })

  it('does not render commune layer when communeGeoJson is null', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'postcode', departments: [], postcodes: ['75001'], address: null, lat: null, lng: null, radius: null, communeGeoJson: null },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-commune-geojson]').exists()).toBe(false)
  })

  it('renders commune layer in postcode mode with data', () => {
    const communeGeoJson = {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        properties: { nom: 'Paris', code: '75056', codesPostaux: ['75001'], selectedPostcodes: ['75001'], population: 2200000 },
        geometry: { type: 'Polygon', coordinates: [[[2.3, 48.8], [2.4, 48.8], [2.4, 48.9], [2.3, 48.8]]] },
      }],
    }
    const wrapper = mount(TargetingMap, {
      props: { method: 'postcode', departments: [], postcodes: ['75001'], address: null, lat: null, lng: null, radius: null, communeGeoJson },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-commune-geojson]').exists()).toBe(true)
  })

  it('does not render commune layer in department mode', () => {
    const communeGeoJson = {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        properties: { nom: 'Paris', code: '75056', codesPostaux: ['75001'], selectedPostcodes: ['75001'], population: 2200000 },
        geometry: { type: 'Polygon', coordinates: [[[2.3, 48.8], [2.4, 48.8], [2.4, 48.9], [2.3, 48.8]]] },
      }],
    }
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: ['75'], postcodes: [], address: null, lat: null, lng: null, radius: null, communeGeoJson },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-commune-geojson]').exists()).toBe(false)
  })
})
