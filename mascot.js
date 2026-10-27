// Mascota: «Tuerca», un zorro-robot original dibujado en SVG (nombre provisional, pendiente de que Ruben lo apruebe).
// robotSVG(pose) → HTML.  Poses: 'wave' | 'cheer' | 'think' | 'dance'  (mismas clases CSS que usa el motor).
function robotSVG(pose = 'wave') {
  const o = '#2b2233', body = '#e8924a', bodyD = '#b8641f', face = '#fff3dc', acc = '#5c8fc7', steel = '#c9d3dd';
  const st = `stroke="${o}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"`;
  const armUp = (x, rot) => `<g transform="rotate(${rot} ${x} 150)"><rect x="${x - 7}" y="108" width="14" height="46" rx="7" fill="${body}" ${st}/><circle cx="${x}" cy="106" r="9" fill="${steel}" ${st}/></g>`;
  const armDown = x => `<rect x="${x - 7}" y="150" width="14" height="44" rx="7" fill="${body}" ${st}/><circle cx="${x}" cy="196" r="9" fill="${steel}" ${st}/>`;
  const arms = {
    wave: armDown(52) + armUp(148, 28),
    cheer: armUp(52, -30) + armUp(148, 30),
    think: armDown(52) + `<g transform="rotate(48 120 168)"><rect x="113" y="142" width="14" height="44" rx="7" fill="${body}" ${st}/></g><circle cx="108" cy="150" r="9" fill="${steel}" ${st}/>`,
    dance: armUp(50, -62) + armUp(150, 62)
  }[pose] || '';
  const fx = { cheer: '<i class="fx s1">✦</i><i class="fx s2">✦</i><i class="fx s3">✧</i>', think: '<i class="fx q">?</i>', dance: '<i class="fx h1">⚙</i><i class="fx h2">⚙</i>' }[pose] || '';
  const happy = pose === 'cheer' || pose === 'dance';
  const eyes = happy
    ? [78, 122].map(x => `<path d="M${x - 11} 96Q${x} 80 ${x + 11} 96" fill="none" stroke="${o}" stroke-width="5" stroke-linecap="round"/>`).join('')
    : [78, 122].map(x => `<circle cx="${x}" cy="92" r="12" fill="#fff" ${st}/><circle cx="${x + (pose === 'think' ? 3 : 0)}" cy="${pose === 'think' ? 88 : 92}" r="6" fill="${o}"/>`).join('');
  const mouth = happy ? `<path d="M88 120Q100 138 112 120Z" fill="#7a2a2a" ${st}/>` : `<path d="M90 121Q100 128 110 121" fill="none" stroke="${o}" stroke-width="3.4" stroke-linecap="round"/>`;
  // engranaje de la cola (8 dientes)
  const tooth = Array.from({ length: 8 }, (_, i) => `<rect x="-3" y="-17" width="6" height="7" rx="1.5" transform="rotate(${i * 45})" fill="${acc}" ${st}/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250" role="img" aria-label="Tuerca, la mascota zorro-robot">
    <g${pose === 'dance' ? ' transform="rotate(-6 100 170)"' : ''}>
      <path d="M136 206Q184 204 176 158" fill="none" stroke="${o}" stroke-width="16" stroke-linecap="round"/><path d="M136 206Q184 204 176 158" fill="none" stroke="${body}" stroke-width="10" stroke-linecap="round"/>
      <g transform="translate(176 150)">${tooth}<circle r="11" fill="${acc}" ${st}/><circle r="4" fill="${face}"/></g>
      ${arms}
      <rect x="86" y="218" width="12" height="22" rx="5" fill="${bodyD}" ${st}/><rect x="104" y="218" width="12" height="22" rx="5" fill="${bodyD}" ${st}/>
      <rect x="62" y="150" width="76" height="72" rx="20" fill="${body}" ${st}/>
      <path d="M80 160Q100 192 120 160" fill="${face}" ${st}/>
      <polygon points="50,60 56,12 92,46" fill="${body}" ${st}/><polygon points="150,60 144,12 108,46" fill="${body}" ${st}/>
      <polygon points="59,50 61,27 78,45" fill="${face}"/><polygon points="141,50 139,27 122,45" fill="${face}"/>
      <rect x="44" y="48" width="112" height="102" rx="30" fill="${body}" ${st}/>
      <path d="M56 100Q56 134 100 140Q144 134 144 100Q144 66 100 66Q56 66 56 100Z" fill="${face}" ${st}/>
      ${eyes}
      <path d="M94 106L106 106L100 114Z" fill="${o}" ${st}/>${mouth}
      <circle cx="152" cy="116" r="6" fill="${steel}" ${st}/><path d="M149 116h6" stroke="${o}" stroke-width="2"/>
    </g></svg>`;
  return `<span class="chimg ${pose}">${svg}${fx}</span>`;
}
