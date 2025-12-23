# CONTEXTO DEL PROYECTO: SISTEMA DE GESTIÓN "UNIVERSO AUTOMOTORES"

## 1. Resumen del Negocio
Estamos desarrollando un MVP (Fase 1) para una empresa de Marketing que gestiona múltiples cuentas.
[cite_start]El objetivo es eliminar el uso de WhatsApp y centralizar tareas y objetivos[cite: 3].
[cite_start]El sistema tiene dos roles: ADMIN (Gestor) y EMPLEADO (Cadete)[cite: 8].

## 2. Stack Tecnológico (Monorepo)
- **Backend:** Node.js + Express + TypeScript.
- **ORM:** TypeORM.
- **Base de Datos:** PostgreSQL.
- **Frontend:** React + TypeScript (Vite).
- **Estilos:** TailwindCSS (Sugerido).

## 3. Estructura de Base de Datos (Entidades Clave)
El backend debe implementar estas entidades usando TypeORM:

1. **User (Usuarios):**
   - id, name, email, password, role ('ADMIN', 'EMPLOYEE').
   - Relación: Pertenece a uno o varios Sectors.

2. **Sector (Sectores/Cuentas):**
   - Representa las cuentas de Instagram o áreas (ej: "Taller", "Cuenta X").
   - Relación: Tiene muchos Users y muchas Tasks.

3. **Task (Tareas):**
   - Campos: title, description, due_date (fecha límite).
   - [cite_start]priority: Enum ('LOW', 'MEDIUM', 'HIGH')[cite: 14].
   - [cite_start]status: Enum ('PENDING', 'IN_PROGRESS', 'REVIEW', 'DONE')[cite: 15].
   - drive_link: String (TEXT). *IMPORTANTE: En esta Fase 1, la integración con Drive es manual. [cite_start]Se guarda solo el link pegado por el usuario*[cite: 16].
   - Relaciones: Asignada a un User, pertenece a un Sector.

4. **Comment (Comentarios):**
   - [cite_start]Para feedback dentro de la tarea[cite: 21].
   - content, created_at.
   - Relación: Pertenece a Task, escrito por User.

## 4. Requerimientos Funcionales (Fase 1 - MVP)
- **Auth:** Login simple (JWT). El Admin crea a los usuarios.
- [cite_start]**Dashboard:** El Admin ve resumen de tareas urgentes[cite: 12].
- **Calendario:** Vista mensual de tareas y reuniones. [cite_start]Alertas visuales por prioridad[cite: 19].
- [cite_start]**Seguridad:** Los empleados solo ven tareas de su sector[cite: 10].

## 5. Instrucciones para la IA
- Usar siempre TypeScript estricto.
- Priorizar código limpio y modular.
- Al generar controladores, incluir manejo de errores (try/catch).