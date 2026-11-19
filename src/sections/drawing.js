import { drawings } from '../data/content.js'
import { dummyDrawingItems } from '../data/dummy-drawing.js'
import { USE_DUMMY_DATA } from '../data/gallery-config.js'
import { renderMasonryGallery } from '../Components/MasonryGallery.js'

export function renderDrawing() {
  return renderMasonryGallery({
    id: 'drawing',
    title: 'Drawing',
    description: 'Small studies in line, light and attention.',
    items: USE_DUMMY_DATA ? dummyDrawingItems : drawings,
    theme: 'light',
  })
}
