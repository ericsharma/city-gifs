import type MapLibreGL from 'maplibre-gl'

// Set input value programmatically (for React synthetic events)
export function setInputValue(input: HTMLInputElement, value: string): void {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

// Set map cursor style
export function setCursor(map: MapLibreGL.Map, cursor: string): void {
  map.getCanvas().style.cursor = cursor
}
