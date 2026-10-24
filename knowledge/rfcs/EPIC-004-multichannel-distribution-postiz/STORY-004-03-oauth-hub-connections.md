# STORY-004-03: Conexión y Gestión de Cuentas Sociales (OAuth Hub) (HU-4.3)

## Metadatos
- **ID:** `STORY-004-03`
- **Historia de Usuario:** HU-4.3
- **Épica:** EPIC-004
- **Estado:** `APPROVED`
- **Asignación:** `frontend` + `security` + `db`

---

## 1. Declaración de la Historia
- **Como** Label Manager o Social Media Manager,
- **Quiero** autenticar y gestionar las conexiones de perfiles sociales (Instagram, Facebook, TikTok, YouTube, X) y cuentas de anuncios,
- **Para que** la plataforma cuente con los tokens autorizados antes de calendarizar cualquier publicación.

---

## 2. Criterios de Aceptación
1. **Flujo OAuth Seguro:** Inicia flujos OAuth abriendo el navegador del sistema hacia los callbacks públicos de Postiz Cloud.
2. **Health Check en Tiempo Real:** Monitorea y muestra el estado de salud de cada conexión (`CONNECTED`, `EXPIRED`, `DISCONNECTED`).
3. **Revocación y Renovación 1-Clic:** Permite renovar credenciales o revocar accesos en cualquier momento desde la interfaz.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 4: Infraestructura
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-social-connection-repository.ts`:
  ```typescript
  export interface SocialConnectionRepository {
    upsertConnection: (input: UpsertSocialConnectionInput) => Promise<SocialConnectionRecord>;
    getConnection: (id: string) => Promise<SocialConnectionRecord | null>;
    listConnectionsByLabelId: (labelId: string) => Promise<SocialConnectionRecord[]>;
    deleteConnection: (id: string) => Promise<boolean>;
  }
  ```

### Capa 1: Presentación
- `apps/web/src/components/distribution/oauth-hub-card.tsx`: Tarjeta visual con indicador de salud y botón de reconexión.
