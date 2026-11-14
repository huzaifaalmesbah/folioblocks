import { fontDef, type FontKey } from '../fonts';
import type { Style } from '../types';

export const RADIUS: Record<Style['radius'], string> = { none: '0', sm: '4px', md: '8px', lg: '24px' };

export function themeJson(style: Style): string {
  const { palette, fonts } = style;
  const fontKeys = Array.from(new Set<FontKey>([fonts.heading, fonts.body]));

  const json = {
    $schema: 'https://schemas.wp.org/wp/6.6/theme.json',
    version: 3,
    settings: {
      appearanceTools: true,
      useRootPaddingAwareAlignments: true,
      layout: { contentSize: '720px', wideSize: '1200px' },
      color: {
        defaultPalette: false,
        defaultGradients: false,
        palette: [
          { slug: 'base', name: 'Base', color: palette.base },
          { slug: 'contrast', name: 'Contrast', color: palette.contrast },
          { slug: 'primary', name: 'Primary', color: palette.primary },
          { slug: 'secondary', name: 'Secondary', color: palette.secondary },
          { slug: 'accent', name: 'Accent', color: palette.accent },
        ],
      },
      typography: {
        fluid: true,
        defaultFontSizes: false,
        fontFamilies: fontKeys.map((k) => {
          const f = fontDef(k);
          return {
            slug: k,
            name: f.name,
            fontFamily: f.stack,
            ...(f.file && {
              fontFace: [
                {
                  fontFamily: f.name,
                  fontStyle: 'normal',
                  fontWeight: f.weight,
                  fontDisplay: 'swap',
                  src: [`file:./assets/fonts/${f.file}`],
                },
              ],
            }),
          };
        }),
        fontSizes: [
          { slug: 'small', name: 'Small', size: '0.9rem', fluid: false },
          { slug: 'medium', name: 'Medium', size: '1.05rem', fluid: { min: '1rem', max: '1.125rem' } },
          { slug: 'large', name: 'Large', size: '1.5rem', fluid: { min: '1.25rem', max: '1.75rem' } },
          { slug: 'x-large', name: 'Extra Large', size: '2.25rem', fluid: { min: '1.75rem', max: '2.75rem' } },
          { slug: 'xx-large', name: 'Huge', size: '3.5rem', fluid: { min: '2.5rem', max: '4.5rem' } },
        ],
      },
      spacing: { units: ['px', 'rem', 'em', '%', 'vw', 'vh'] },
    },
    styles: {
      color: { background: 'var:preset|color|base', text: 'var:preset|color|contrast' },
      spacing: {
        blockGap: '1.5rem',
        padding: {
          left: 'var:preset|spacing|40',
          right: 'var:preset|spacing|40',
        },
      },
      typography: {
        fontFamily: `var:preset|font-family|${fonts.body}`,
        fontSize: 'var:preset|font-size|medium',
        lineHeight: '1.65',
      },
      elements: {
        heading: {
          typography: { fontFamily: `var:preset|font-family|${fonts.heading}`, fontWeight: '700', lineHeight: '1.2' },
        },
        h1: { typography: { fontSize: 'var:preset|font-size|xx-large' } },
        h2: { typography: { fontSize: 'var:preset|font-size|x-large' } },
        h3: { typography: { fontSize: 'var:preset|font-size|large' } },
        link: {
          color: { text: 'var:preset|color|primary' },
          ':hover': { typography: { textDecoration: 'none' } },
        },
        button: {
          color: { background: 'var:preset|color|primary', text: 'var:preset|color|base' },
          border: { radius: RADIUS[style.radius] },
          ':hover': { color: { background: 'var:preset|color|secondary' } },
        },
      },
      blocks: {
        'core/site-title': {
          typography: { fontWeight: '700', fontSize: 'var:preset|font-size|medium' },
        },
        'core/post-date': { typography: { fontSize: 'var:preset|font-size|small' } },
      },
    },
    customTemplates: [
      { name: 'page-about', title: 'About', postTypes: ['page'] },
      { name: 'page-contact', title: 'Contact', postTypes: ['page'] },
    ],
    templateParts: [
      { name: 'header', title: 'Header', area: 'header' },
      { name: 'footer', title: 'Footer', area: 'footer' },
    ],
  };

  return `${JSON.stringify(json, null, '\t')}\n`;
}
