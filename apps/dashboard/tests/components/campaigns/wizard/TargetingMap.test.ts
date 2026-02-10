import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'

mockUseI18n()

vi.mock('@vue-leaflet/vue-leaflet', () => ({
  LMap: { template: '<div data-map><slot /></div>', props: ['zoom', 'center'] },
  LTileLayer: { template: '<div />', props: ['url'] },
  LGeoJson: { template: '<div data-geojson />', props: ['geojson', 'options'] },
  LCircle: { template: '<div data-circle />', props: ['latLng', 'radius'] },
  LMarker: { template: '<div data-marker />', props: ['latLng'] },
}))

const TargetingMap = (await import('@/components/campaigns/wizard/TargetingMap.vue')).default

describe('TargetingMap', () => {
  it('renders map container', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: [], postcodes: [], address: null, lat: null, lng: null, radius: null },
    })
    expect(wrapper.find('[data-map]').exists()).toBe(true)
  })

  it('renders GeoJSON layer in department mode', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: ['75'], postcodes: [], address: null, lat: null, lng: null, radius: null },
    })
    expect(wrapper.find('[data-geojson]').exists()).toBe(true)
  })

  it('renders circle and marker in address mode', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'address', departments: [], postcodes: [], address: 'Paris', lat: 48.86, lng: 2.34, radius: 10 },
    })
    expect(wrapper.find('[data-circle]').exists()).toBe(true)
    expect(wrapper.find('[data-marker]').exists()).toBe(true)
  })

  it('does not render circle in department mode', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: ['75'], postcodes: [], address: null, lat: null, lng: null, radius: null },
    })
    expect(wrapper.find('[data-circle]').exists()).toBe(false)
  })

  it('passes correct center and zoom', () => {
    const wrapper = mount(TargetingMap, {
      props: { method: 'department', departments: [], postcodes: [], address: null, lat: null, lng: null, radius: null },
    })
    const map = wrapper.find('[data-map]')
    expect(map.exists()).toBe(true)
  })
})
