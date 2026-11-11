// Mascota: «Tuerca», un robot-dron esférico dibujado en línea (SVG propio, nombre provisional).
// robotSVG(pose) → HTML.  Poses: 'wave' | 'cheer' | 'think' | 'dance'.  Colores por variables CSS (teal, dorado, blancos).
function robotSVG(pose = 'wave') {
  const st = 'stroke="var(--teal)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  const thin = 'stroke="var(--teal)" stroke-width="2" stroke-linecap="round"';
  // cápsulas flotantes que hacen de brazos
  const pod = (x, y, rot) => `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 9}" y="${y - 19}" width="18" height="38" rx="9" fill="var(--mbody)" ${st}/><circle cx="${x}" cy="${y - 8}" r="3.6" fill="var(--gold)"/></g>`;
  const pods = {
    wave: pod(26, 146, 8) + pod(176, 82, 28),
    cheer: pod(24, 82, -28) + pod(176, 82, 28),
    think: pod(26, 146, 8) + pod(128, 176, 62),
    dance: pod(24, 84, -62) + pod(176, 84, 62)
  }[pose] || '';
  const fx = { cheer: '<i class="fx s1">✦</i><i class="fx s2">✦</i><i class="fx s3">✧</i>', think: '<i class="fx q">?</i>', dance: '<i class="fx h1">⚙</i><i class="fx h2">⚙</i>' }[pose] || '';
  const happy = pose === 'cheer' || pose === 'dance';
  const eye = (x, ry = 11, dy = 0) => `<ellipse cx="${x}" cy="${119 + dy}" rx="14" ry="${ry + 5}" fill="var(--eye)" opacity=".16"/><ellipse cx="${x}" cy="${119 + dy}" rx="8" ry="${ry}" fill="var(--eye)"/>`;
  const eyes = happy
    ? [82, 118].map(x => `<path d="M${x - 10} 124Q${x} 107 ${x + 10} 124" fill="none" stroke="var(--eye)" stroke-width="5.5" stroke-linecap="round"/>`).join('')
    : pose === 'think' ? eye(82, 11, -3) + eye(118, 7, -3) + '<path d="M106 100l22-6" stroke="var(--eye)" stroke-width="3.5" stroke-linecap="round"/>'
    : eye(82) + eye(118);
  const mouth = happy ? '<path d="M90 134Q100 148 110 134Z" fill="var(--eye)"/>' : '<path d="M92 135Q100 141 108 135" fill="none" stroke="var(--eye)" stroke-width="3" stroke-linecap="round"/>';
  const teeth = Array.from({ length: 8 }, (_, i) => `<rect x="-2.6" y="-14.5" width="5.2" height="5.5" rx="1" transform="rotate(${i * 45})" fill="var(--solid)" ${thin}/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250" role="img" aria-label="Tuerca, la mascota: un robot-dron">
    <ellipse cx="100" cy="238" rx="36" ry="6" fill="var(--teal)" opacity=".28"/>
    <g${pose === 'dance' ? ' transform="rotate(-6 100 170)"' : ''}>
      <g class="fl"><path d="M86 188Q100 224 114 188Z" fill="var(--gold)" opacity=".9"/><path d="M93 190Q100 210 107 190Z" fill="#fff6d6"/></g>
      ${pods}
      <path d="M80 66L66 36M120 66L134 36" ${st} fill="none"/><circle cx="66" cy="33" r="5.5" fill="var(--gold)" ${thin}/><circle cx="134" cy="33" r="5.5" fill="var(--solid)" ${st}/>
      <circle cx="100" cy="122" r="66" fill="var(--mbody)" ${st}/>
      <path d="M48 150Q100 196 152 150" fill="none" ${thin} opacity=".55"/><path d="M52 92Q58 74 76 64" fill="none" ${thin} opacity=".55"/>
      <circle cx="100" cy="172" r="4" fill="var(--gold)"/>
      <rect x="56" y="92" width="88" height="56" rx="28" fill="#050b0f" ${st}/>
      ${eyes}${mouth}
      <g transform="translate(100 54)"><g class="mg">${teeth}<circle r="9.5" fill="var(--solid)" ${st}/><circle r="3.4" fill="var(--gold)"/></g></g>
    </g></svg>`;
  return `<span class="chimg ${pose}">${svg}${fx}</span>`;
}
