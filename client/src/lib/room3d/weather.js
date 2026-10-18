// Light for the 3D room: sunlight through the bay window and the lamp at night, following the
// same weather as the rest of the app ({ scene: 'sunny' | 'cloudy' | 'rain', night }). The view
// outside the window is not drawn here: the sky behind the glass is left see-through, and the
// room shows WindowView (sun, birds, clouds, rain, moon) behind the canvas there.
import * as THREE from 'three'

const SKIES = {
  sunny: { sun: 2.6, fill: 1.7, ceiling: 3.5 },
  cloudy: { sun: 1, fill: 1.5, ceiling: 3 },
  rain: { sun: 0.4, fill: 1.2, ceiling: 2.5 },
}
const NIGHT = { sun: 0, fill: 0.4, ceiling: 0.8 }

// Writes see-through pixels wherever the sky is, whatever was drawn there before.
const SEE_THROUGH = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0, blending: THREE.NoBlending })

export function createLighting(room) {
  const fill = new THREE.HemisphereLight('#FFFFFF', '#D8C6B4', 1.7)
  const ambient = new THREE.AmbientLight('#FFFFFF', 0.6)
  // a warm light from the middle of the ceiling, so the walls are not flat
  const ceiling = new THREE.PointLight('#FFF3E2', 3.5, 0, 2)
  ceiling.position.set(0, 2.45, 0)

  // sunlight falls in through the bay window, from high up outside the back wall
  const sun = new THREE.DirectionalLight('#FFEFD2', 2.6)
  sun.position.set(-1.5, 5, -7)
  sun.target.position.set(0, 0, 0.5)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.bias = -0.0005
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 16 })

  const lamp = new THREE.PointLight('#FFC98A', 0, 5, 2)
  if (room.lamp.light) lamp.position.copy(room.lamp.light)

  for (const mesh of room.sky) {
    mesh.material = SEE_THROUGH
    mesh.castShadow = false
    mesh.receiveShadow = false
  }
  // the panes let the sun through
  for (const mesh of room.glass) mesh.castShadow = false

  const shadeMaterial = room.lamp.shade?.material

  const lights = new THREE.Group()
  lights.add(fill, ambient, ceiling, sun, sun.target, lamp)

  function apply({ scene, night }) {
    const look = night ? NIGHT : SKIES[scene] ?? SKIES.cloudy
    sun.intensity = look.sun
    fill.intensity = look.fill
    ceiling.intensity = look.ceiling
    ambient.intensity = night ? 0.2 : 0.6
    lamp.intensity = night ? 4 : 0.6
    if (shadeMaterial) {
      shadeMaterial.emissive.set(night ? '#FFD9A0' : '#000000')
      shadeMaterial.emissiveIntensity = night ? 0.9 : 0
    }
  }

  return { lights, apply }
}
