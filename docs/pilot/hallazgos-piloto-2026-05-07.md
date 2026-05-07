# Hallazgos Piloto Arbor — Liceo Antonio Varas

**Fecha de análisis:** 7 de mayo de 2026  
**Período del piloto:** 12 de abril — 7 de mayo 2026  
**Fuente de datos:** Base de datos de producción (Neon)

---

## 1. Resumen Ejecutivo

El piloto con el Liceo Antonio Varas lleva ~25 días activo. Se registraron
161 alumnos (82 de 2° medio, 79 de 4° medio) pero la tasa de activación es
críticamente baja: **solo el 27% completó al menos un diagnóstico**, y el
uso autónomo fuera de clase es prácticamente nulo.

| Métrica                    | Valor       | Estado    |
|----------------------------|-------------|-----------|
| Alumnos registrados        | 161         | ✅ OK     |
| Diagnósticos completados   | 44 / 52     | ⚠️ Bajo   |
| Tasa de activación         | 27%         | 🔴 Crítico|
| Alumnos sin diagnóstico    | 113 (70%)   | 🔴 Crítico|
| 4° medio activos           | 0 de 79     | 🔴 Crítico|
| Sesiones de estudio (M1)   | 24          | 🔴 Crítico|
| Sprints de estudio         | 0           | 🔴 Crítico|
| PAES promedio estimado     | 187 (min)   | Esperado  |

---

## 2. Hallazgos Detallados

### 2.1 Activación por Curso

**4° Medio: 0% de activación**
- 79 alumnos de 4° medio están registrados en la plataforma.
- Ninguno ha iniciado un diagnóstico.
- Este es el grupo que más necesita la plataforma dado que rinden la PAES
  este año, y es el que menos la está usando.

**2° Medio: 54% de activación**
- 82 alumnos registrados, 44 han completado al menos un diagnóstico.
- 38 alumnos de 2° medio nunca abrieron la plataforma después de registrarse.
- Toda la actividad se concentra en sesiones presenciales en clase.

### 2.2 Patrón de Uso: Solo en Clase

La actividad se concentra en exactamente 3 fechas:
- **14-15 de abril**: Primera sesión (~18 alumnos, ~20 intentos)
- **21-22 de abril**: Segunda sesión (~25 alumnos, ~28 intentos)
- **28-29 de abril**: Tercera sesión (~4 alumnos, ~5 intentos)

**Conclusión:** Los alumnos solo usan la plataforma cuando el profesor los
pone a hacerlo durante la clase. No existe uso autónomo fuera del aula.

### 2.3 Distribución de Puntajes PAES

Solo alumnos de 2° medio tienen puntajes. La mayoría se ubica en rangos
bajos, lo cual es esperado para su nivel:

| Rango PAES (mín.) | Cantidad | Porcentaje |
|--------------------|----------|------------|
| 100 – 200          | 27       | 61%        |
| 200 – 300          | 7        | 16%        |
| 300 – 400          | 4        | 9%         |
| 400 – 500          | 5        | 11%        |
| 500+               | 1        | 2%         |

### 2.4 Plataforma de Estudio (M1) No Se Usa

- Solo 24 sesiones de estudio de átomos en todo el piloto.
- 0 sprints de estudio iniciados.
- La funcionalidad de miniclases, mastery de átomos y repaso espaciado
  no está siendo aprovechada.

### 2.5 Top Alumnos por Rendimiento

| Alumno                     | Curso | PAES Min | PAES Max |
|----------------------------|-------|----------|----------|
| Manuel E. Nahuelpán Burgos | 2°M   | 486      | 587      |
| Catalina B. Meneses Rojas  | 2°M   | 421      | 526      |
| Emilia A. Monsalve Fuentes | 2°M   | 421      | 526      |
| Angela K. Inostroza Molina | 2°M   | 393      | 502      |
| Pablo A. Álvarez Meriches  | 2°M   | 393      | 502      |

---

## 3. Implicancias para el Pitch

### Datos que SÍ podemos mostrar
- La plataforma funciona end-to-end (registro → diagnóstico → puntaje PAES)
- 161 alumnos registrados exitosamente vía acceso institucional
- Distribución de puntajes coherente con el nivel esperado
- Casos de alumnos con buen rendimiento que pueden ser historias de éxito

### Datos que NO podemos mostrar (por falta de uso)
- ❌ Evolución de puntaje PAES (necesitan hacer un ensayo completo para comparar)
- ❌ Progreso en mastery de átomos (nadie lo usa)
- ❌ Impacto del estudio dirigido en los puntajes
- ❌ Engagement autónomo (retención, streaks, misiones)
- ❌ Datos de 4° medio (0% de activación)

### Para el pitch necesitamos
1. Que **todos los alumnos** hagan al menos 1 diagnóstico completo.
2. Que estudien con la plataforma M1 durante **1-2 semanas**. Si bien el liceo les da un espacio los miércoles en el colegio, es **fundamental que los profesores recalquen que pueden (y deben) trabajar en Arbor en cualquier momento** desde sus casas.
3. Que realicen un **ensayo completo** para medir la evolución del aprendizaje (cambio en el puntaje PAES y cantidad de átomos nuevos aprendidos).
4. Con eso podremos mostrar: delta de puntaje, átomos dominados y la correlación entre estudio y mejora.

---

## 4. Plan de Acción Propuesto

### Semana 1 (8-14 mayo)
- [ ] Compartir dashboard con profesores del liceo para mostrar urgencia.
- [ ] Coordinar sesión presencial para que 4° medio haga el diagnóstico.
- [ ] Los 38 alumnos de 2° medio inactivos hacen el diagnóstico.
- [ ] Los profesores comunican que Arbor debe usarse de forma autónoma en cualquier momento, **no solo el día miércoles** asignado en el colegio.

### Semana 2 (15-21 mayo)
- [ ] Todos los alumnos con diagnóstico empiezan el estudio continuo en M1.
- [ ] Profesores asignan "tarea" de completar sesiones.
- [ ] Monitoreo de actividad y uso autónomo con el dashboard.

### Semana 3 (22-28 mayo)
- [ ] **Ensayo completo** para medir evolución real.
- [ ] Extraer datos de progreso (átomos aprendidos, delta puntaje) para el pitch final.
