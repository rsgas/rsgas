import { journey } from '../data/content.js'

export function renderJourney() {
  return `
    <section class="journey" id="journey" data-section="stop" data-reveal="bg" data-scrollbar-theme="dark" aria-labelledby="journey-title">
      <div class="journey-scroll" data-inner-scroll tabindex="0" aria-label="Journey through my work">
        <header class="journey-header" data-reveal="text">
          <p>04 / JOURNEY</p>
          <h2 id="journey-title">Learning in<br>the <em>real world.</em></h2>
        </header>
        <div class="journey-list" id="journey">
          ${journey.map((item) => `
            <article class="journey-row" data-reveal="text">
              <p>${item.year}</p>
              <div><span>${item.label}</span><h3>${item.title}</h3></div>
              <p>${item.text}</p>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `
}
