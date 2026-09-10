/**
 * Fond animé du hero.
 *
 * Base : le shader log-polaire d'AetherHero, GÉOMÉTRIE D'ORIGINE. Une
 * version précédente déplaçait son point de fuite et multipliait ses
 * bras pour tenter de remplir l'écran ; ça donnait soit une comète
 * isolée, soit un tunnel d'hyperespace illisible. On revient au
 * cadrage de l'auteur.
 *
 * Deux seules modifications :
 *
 * 1. LA PALETTE. L'original écrit une couleur par canal RVB, ce qui
 *    donne des stries rouge/vert/bleu. Ici on accumule une intensité
 *    scalaire puis on la passe par la rampe encre -> brique -> orange
 *    -> crème.
 *
 * 2. LA MOIRE de fond (`e / (sin * cos)`) est divisée par trois. À sa
 *    valeur d'origine, la rampe de couleur la transformait en un
 *    quadrillage de briques qui dominait toute la page.
 *
 * Le flou qui adoucit le tout est appliqué en CSS, pas ici : c'est
 * moins coûteux qu'un flou calculé dans le shader.
 */
export const AETHER_NTMS_SRC = `#version 300 es
precision highp float;

out vec4 O;
uniform float iTime;
uniform vec3  iResolution;

#define FC gl_FragCoord.xy
#define R  iResolution.xy
#define T  iTime
#define MN min(R.x, R.y)
// Echelle du motif.
//
// min() vaut la HAUTEUR en paysage et la LARGEUR en portrait. Sur un
// telephone de 375 de large, le motif etait donc normalise par 375 au
// lieu de 880 : les formes apparaissaient deux fois et demie trop
// grosses, et il n'en restait qu'une ou deux a l'ecran.
//
// En portrait on reprend le rapport largeur/echelle du bureau
// (1440/880 = 1,64) pour retrouver la meme densite. La branche paysage
// est identique a l'ancienne formule, au bit pres : la vue sur
// ordinateur ne bouge pas.
#define S  (R.x > R.y ? MN : R.x / 1.64)

const vec3 ENCRE  = vec3(0.027, 0.075, 0.106);
const vec3 BRIQUE = vec3(0.475, 0.157, 0.055);
const vec3 ORANGE = vec3(1.000, 0.478, 0.000);
const vec3 CREME  = vec3(1.000, 0.922, 0.820);

float pattern(vec2 uv) {
  float d = 0.0;
  for (float i = 0.0; i < 3.0; i++) {
    uv.x += sin(T * (1.0 + i) + uv.y * 1.5) * 0.2;
    d += 0.005 / abs(uv.x);
  }
  return d;
}

float scene(vec2 uv) {
  uv = vec2(atan(uv.x, uv.y) * 2.0 / 6.28318, -log(length(uv)) + T * 0.3);
  float d = 0.0;
  for (float i = 0.0; i < 3.0; i++) {
    d += pattern(uv + i * 6.0 / MN);
  }
  return d;
}

void main() {
  vec2 uv = (FC - 0.5 * R) / S;

  // Trame de carres. Sa frequence est exprimee dans les unites de uv :
  // en portrait, l'echelle S etant plus petite, la meme constante
  // produisait beaucoup plus de cases a l'ecran. On la reduit de moitie
  // sous format portrait. La branche paysage garde 12.0, donc la vue
  // sur ordinateur ne bouge pas.
  float g = R.x > R.y ? 12.0 : 6.0;
  float v = 3e-4 / (sin(uv.x * g) * cos(uv.y * g));

  uv.y += 0.5 * R.y / S;
  v += scene(uv);

  v = clamp(v, 0.0, 1.6);

  vec3 col = mix(ENCRE, BRIQUE, smoothstep(0.06, 0.45, v));
  col = mix(col, ORANGE, smoothstep(0.42, 1.00, v));
  col = mix(col, CREME, smoothstep(1.05, 1.50, v));

  O = vec4(col, 1.0);
}
`;
