import { describe, it, expect } from 'vitest'
import { sliderToKm, kmToSlider, snapToStep } from '../composables/useLogarithmicRadius'

describe('snapToStep', () => {
  it('snaps to 0.5 km steps for 1-5 km', () => {
    expect(snapToStep(1.3)).toBe(1.5)
    expect(snapToStep(2.7)).toBe(2.5)
    expect(snapToStep(3.0)).toBe(3)
    expect(snapToStep(4.24)).toBe(4)
    expect(snapToStep(4.25)).toBe(4.5)
  })

  it('snaps to 1 km steps for 5-15 km', () => {
    expect(snapToStep(5.4)).toBe(5)
    expect(snapToStep(5.6)).toBe(6)
    expect(snapToStep(10.3)).toBe(10)
    expect(snapToStep(14.7)).toBe(15)
  })

  it('snaps to 5 km steps for 15-50 km', () => {
    expect(snapToStep(16)).toBe(15)
    expect(snapToStep(17.5)).toBe(20)
    expect(snapToStep(22)).toBe(20)
    expect(snapToStep(23)).toBe(25)
    expect(snapToStep(47)).toBe(45)
    expect(snapToStep(48)).toBe(50)
  })
})

describe('sliderToKm', () => {
  it('maps position 0 to 1 km', () => {
    expect(sliderToKm(0)).toBe(1)
  })

  it('maps position 40 to 5 km', () => {
    expect(sliderToKm(40)).toBe(5)
  })

  it('maps position 70 to 15 km', () => {
    expect(sliderToKm(70)).toBe(15)
  })

  it('maps position 100 to 50 km', () => {
    expect(sliderToKm(100)).toBe(50)
  })

  it('maps position 20 to ~3 km (midpoint of 1-5 range)', () => {
    const km = sliderToKm(20)
    expect(km).toBe(3)
  })

  it('maps position 55 to ~10 km (midpoint of 5-15 range)', () => {
    const km = sliderToKm(55)
    expect(km).toBe(10)
  })

  it('maps position 85 to ~30-35 km', () => {
    const km = sliderToKm(85)
    expect(km).toBeGreaterThanOrEqual(25)
    expect(km).toBeLessThanOrEqual(35)
  })

  it('clamps below 0 to 1 km', () => {
    expect(sliderToKm(-10)).toBe(1)
  })

  it('clamps above 100 to 50 km', () => {
    expect(sliderToKm(120)).toBe(50)
  })
})

describe('kmToSlider', () => {
  it('maps 1 km to position 0', () => {
    expect(kmToSlider(1)).toBe(0)
  })

  it('maps 5 km to position 40', () => {
    expect(kmToSlider(5)).toBe(40)
  })

  it('maps 15 km to position 70', () => {
    expect(kmToSlider(15)).toBe(70)
  })

  it('maps 50 km to position 100', () => {
    expect(kmToSlider(50)).toBe(100)
  })

  it('clamps below 1 km to position 0', () => {
    expect(kmToSlider(0.5)).toBe(0)
  })

  it('clamps above 50 km to position 100', () => {
    expect(kmToSlider(60)).toBe(100)
  })

  it('roundtrips: sliderToKm(kmToSlider(km)) ≈ km for key values', () => {
    for (const km of [1, 2, 3, 5, 10, 15, 20, 25, 30, 50]) {
      const pos = kmToSlider(km)
      const result = sliderToKm(pos)
      expect(result).toBe(km)
    }
  })
})
