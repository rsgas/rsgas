import { beginningImages } from '../data/content.js'

export function renderBeginning() {
  const cards = [...beginningImages, ...beginningImages]
  return `
    <section class="beginning" id="beginning" data-section="stop" aria-labelledby="beginning-title">
      <div class="beginning-images reveal-x" aria-label="A scrolling portrait of moments">
        <div class="beginning-track">
          ${cards.map((image) => `
            <figure class="beginning-frame" style="${image.url ? `background-image:url('${image.url}')` : ''}">
              ${image.url ? '' : `<span>${image.label}</span>`}
              <b>${image.note}</b>
            </figure>
          `).join('')}
        </div>
      </div>
      <div class="beginning-copy reveal-x">
        <p class="section-index">01 — THE BEGINNING</p>
        <h2 id="beginning-title">It started<br>with <em>curiosity.</em></h2>
        <p class="beginning-lead">A classroom became a set. A camera became a way to notice.</p>
        <div class="beginning-body">
          <p>I am a student at SMKN 5 Bandung, majoring in Broadcasting and Film Production. Most of what I know came from being around people, trying roles, and learning when a plan met the unexpected.</p>
          <p>My first projects introduced me to directing, cinematography, editing, and color. They also taught me that a strong image begins with patient observation.</p>
        </div>
        <a class="section-link" href="#work-gallery">See the work <span>↘</span></a>
      </div>
    </section>
  `
}
