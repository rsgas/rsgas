import './App.css'
import { mountBeginningCarousel } from './Components/BeginningCarousel.js'
import { mountFullpageScroll } from './Components/FullpageScroll.js'
import { mountHeroTitleSlider } from './Components/HeroTitleSlider.js'
import { mountMasonryGalleries } from './Components/MasonryGallery.js'
import { renderBeginning } from './sections/beginning.js'
import { renderDrawing } from './sections/drawing.js'
import { renderFooter } from './sections/footer.js'
import { renderHero } from './sections/hero.js'
import { renderJourney } from './sections/journey.js'
import { renderWork } from './sections/work.js'

const app = document.querySelector('#app')
app.innerHTML = `
  <main>
    ${renderHero()}
    <section class="marquee" data-section="passthrough" aria-label="Creative disciplines">
      <div class="marquee-track">
        <span>Cinematography</span><b>×</b><span>Direction</span><b>×</b><span>Visual storytelling</span><b>×</b><span>Editing</span><b>×</b>
        <span>Cinematography</span><b>×</b><span>Direction</span><b>×</b><span>Visual storytelling</span><b>×</b><span>Editing</span><b>×</b>
      </div>
    </section>
    ${renderBeginning()}
    ${renderWork()}
    ${renderDrawing()}
    ${renderJourney()}
  </main>
  ${renderFooter()}
`

mountMasonryGalleries()
mountBeginningCarousel()
const cleanupHeroTitleSlider = mountHeroTitleSlider()
mountFullpageScroll()

if (import.meta.hot) import.meta.hot.dispose(cleanupHeroTitleSlider)
