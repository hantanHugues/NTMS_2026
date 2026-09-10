/**
 * Shader du hero — le mouvement est celui de phosphor-30, inchangé.
 * Seule la palette de sortie a été remplacée.
 *
 * L'original sort un arc-en-ciel (`cos(s + vec4(0,1,8,0))`) qui n'a rien
 * à voir avec la charte. Ici on garde l'accumulation telle quelle, puis
 * on remappe le résultat sur la rampe NTMS :
 *
 *   nuit  ->  sarcelle <-> orange  ->  crème
 *
 * Les demi-teintes basculent entre sarcelle et orange selon l'écart
 * chromatique de l'image d'origine. C'est ce va-et-vient permanent entre
 * deux identités qui porte le thème de l'édition : la transformation.
 */
export const NTMS_SHADER_SRC = `#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 v_uv;

uniform vec3  iResolution;
uniform float iTime;
uniform int   iFrame;
uniform vec4  iMouse;

// Charte NTMS 2026.
const vec3 NUIT     = vec3(0.000, 0.090, 0.141); // #001724
const vec3 BRIQUE   = vec3(0.475, 0.157, 0.055); // #79280E
const vec3 ORANGE   = vec3(1.000, 0.478, 0.000); // #FF7A00
const vec3 CREME    = vec3(1.000, 0.922, 0.820); // #FFEBD1

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2  r  = iResolution.xy;
    float t  = iTime;
    vec3  FC = vec3(fragCoord, t);
    vec4  o  = vec4(0.0);

    float s = 0.0;
    for (float i = 0.0, z = 0.0, d = 0.0; i++ < 8e1; o += (cos(s + vec4(0.0, 1.0, 8.0, 0.0)) + 1.0) / d)
    {
        vec3 p = z * normalize(FC.rgb * 2.0 - r.xyy);
        vec3 a = normalize(cos(vec3(5.0, 0.0, 1.0) + t - d * 4.0));
        p.z += 5.0;

        a = a * dot(a, p) - cross(a, p);
        for (d = 1.0; d++ < 9.0; )
            a -= sin(a * d + t).zxy / d;

        z += d = 0.1 * abs(length(p) - 3.0) + 0.07 * abs(cos(s = a.y));
    }
    o = tanh(o / 5e3);

    // ---- remappage sur la palette NTMS ----
    float lum  = clamp(dot(o.rgb, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    float tilt = clamp((o.r - o.b) * 0.9 + 0.5, 0.0, 1.0);

    vec3 mid = mix(BRIQUE, ORANGE, tilt);
    vec3 col = mix(NUIT, mid, smoothstep(0.02, 0.55, lum));
    col = mix(col, CREME, smoothstep(0.74, 1.0, lum));

    fragColor = vec4(col, 1.0);
}

void main(){
  mainImage(fragColor, gl_FragCoord.xy);
}
`;
