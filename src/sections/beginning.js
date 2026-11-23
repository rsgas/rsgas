import { beginningImages } from '../data/content.js'

export function renderBeginning() {
  return `
    <section class="beginning" id="beginning" data-section="stop" data-reveal="bg" aria-labelledby="beginning-title">
      <div class="beginning-images" data-reveal="media" aria-label="A scrolling portrait of moments">
        <div class="beginning-track">
          ${beginningImages.map((image) => `
            <figure class="beginning-frame">
              ${image.url ? `<img src="${image.url}" alt="${image.label}" loading="lazy" decoding="async" draggable="false">` : ''}
              ${image.url ? '' : `<span>${image.label}</span>`}
              <b>${image.note}</b>
            </figure>
          `).join('')}
        </div>
      </div>
      <div class="beginning-copy" data-reveal="text" data-inner-scroll tabindex="0" aria-label="The Beginning story">
        <p class="section-index">01 — THE BEGINNING</p>
        <h2 id="beginning-title">It started<br>with <em>curiosity.</em></h2>
        <p class="beginning-lead">A classroom became a set. A camera became a way to notice.</p>
        <div class="beginning-body" id="beginning">
          <p>I am a student at SMKN 5 Bandung, majoring in Broadcasting and Film Production. Most of what I know came from being around people, trying roles, and learning when a plan met the unexpected.</p>
          <p>My first projects introduced me to directing, cinematography, editing, and color. They also taught me that a strong image begins with patient observation.</p>
        </div>
        <a class="section-link" href="#work-gallery">See the work <span>↘</span></a>
      </div>
    </section>
  `
}
