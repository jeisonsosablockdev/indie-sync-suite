# STORY-003-03: Generación de Copys y Guiones Promocionales (HU-3.3)

## Metadatos
- **ID:** `STORY-003-03`
- **Historia de Usuario:** HU-3.3
- **Épica:** EPIC-003
- **Estado:** `APPROVED`
- **Asignación:** `frontend` + `api`

---

## 1. Declaración de la Historia
- **Como** Social Media Manager o Artista,
- **Quiero** generar textos de publicación, ganchos (*hooks*) para TikTok y descripciones de YouTube alineados al tono de voz del artista y a la fase del calendario de lanzamiento,
- **Para que** el contenido escrito resuene con la audiencia y mantenga coherencia narrativa a lo largo de la campaña.

---

## 2. Criterios de Aceptación
1. **Plantillas por Fase del Cronograma:**
   - *Fase 1 ($T-14$ a $T-7$):* Teasers, anuncios de fecha y llamadas al Pre-Save.
   - *Fase 2 ($T-3$ a $T-1$):* Cuentas regresivas y adelantos de audio exclusivos.
   - *Fase 3 ($T-0$):* Drop Day (¡Ya disponible en todas las plataformas!).
   - *Fase 4 ($T+1$ a $T+14$):* Agradecimientos, letras destacadas, trends y empuje a playlists.
2. **Inyección Tonal del Brand Vault:** Incorpora el arquetipo de personalidad (ej. *Rebelde, Melancólico, Energético*), jerga y vocabulario prohibido/preferido del artista.
3. **Validación de Límites y Hashtags:**
   - Conteo de caracteres en vivo para Instagram (2200), TikTok (2200), X/Twitter (280) y YouTube (5000).
   - Generación de 3 variantes con hashtags segmentados por género musical.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 3: Dominio
- `apps/web/src/lib/pipelines/creative/social-copy-generator.ts`:
  ```typescript
  export interface SocialCopyInput {
    phase: 'PRE_SAVE' | 'TEASER' | 'COUNTDOWN' | 'RELEASE_DAY' | 'POST_RELEASE';
    platform: 'INSTAGRAM' | 'TIKTOK' | 'TWITTER_X' | 'YOUTUBE';
    brandContext: UnifiedBrandContext;
    releaseConcept: ReleaseConcept;
  }
  ```

### Capa 1: Presentación
- `apps/web/src/components/creative/social-copy-drawer.tsx`: Drawer interactivo con selector de variantes y botón de copiado.
