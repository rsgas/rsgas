import { workItems } from '../data/content.js'
import { dummyWorkItems } from '../data/dummy-work.js'
import { USE_DUMMY_DATA } from '../data/gallery-config.js'
import { renderMasonryGallery } from '../Components/MasonryGallery.js'

export function renderWork() {
  return `
    <section class="work-divider section-reveal" data-section="passthrough" aria-label="Work section title">
      <p>03 / SELECTED WORK</p>
      <h2 id="work">Work</h2>
      <p>Films, photographs<br>and production stories.</p>
    </section>
    ${renderMasonryGallery({
      id: 'work-gallery',
      title: 'Selected work',
      description: 'Films, photographs and production stories.',
      items: USE_DUMMY_DATA ? dummyWorkItems : workItems,
      theme: 'dark',
    })}
  `
}
