# Revision de flujo - 2026-03-19

Este documento recoge observaciones sobre el flujo actual del producto. No propone cambios implementados; solo deja registro de fricciones y ajustes recomendados para revisar.

## 1. Entrada inicial demasiado ambigua entre estudiante y colegio

Hoy la landing principal (`/`) funciona como entrada general y desde ahi existe un cambio a la experiencia de estudiantes, pero ese cambio no es lo suficientemente notorio.

Problema observado:

- Si la primera pagina a la que llega un alumno es la misma a la que llega un colegio, el camino para entrar a la experiencia correcta queda poco claro.
- El acceso a "Para estudiantes" hoy compite visualmente con la CTA principal de colegios.
- En mobile, este cambio de contexto queda todavia menos visible.

Cambio que propongo:

- Apenas una persona entra a la web, preguntarle explicitamente si es `Estudiante` o `Colegio`.
- Redirigir desde ahi a la landing correspondiente para evitar confusion desde el primer segundo.

Impacto esperado:

- Menos confusion en el primer contacto.
- Mejor lectura de la propuesta de valor para cada tipo de usuario.
- Menos riesgo de que un estudiante navegue una landing pensada para colegios y no encuentre rapido su siguiente paso.

## 2. Planificacion inicial: el puntaje sugerido no se esta seteando por defecto

Problema observado:

- En la planificacion inicial, despues de seleccionar carrera y universidad, el sistema indica que el puntaje sugerido es `corte + 30`.
- Ese valor sugerido no se esta cargando automaticamente en el input.
- Ejemplo observado: al elegir Ingenieria Comercial en la Universidad Catolica, el sistema deja `1000` por defecto, cuando por la sugerencia mostrada debiese quedar en `900`.

Cambio que propongo:

- Que por default se cargue automaticamente el puntaje sugerido.
- Desde ahi, el usuario puede decidir si quiere ajustarlo manualmente o no.

Pregunta abierta:

- Tambien vale la pena revisar si la regla de sugerencia de puntaje (`corte + 30`) es realmente la correcta.

Impacto esperado:

- Menos friccion en la configuracion inicial.
- Mayor consistencia entre lo que el sistema recomienda y lo que efectivamente muestra.
- Menor riesgo de que el alumno parta con una meta mal configurada por default.

## 3. Si se acaba el tiempo del diagnostico, el alumno puede quedar atrapado en un bucle sin salida clara

Problema observado:

- Este problema aparecio especificamente cuando se acabo el tiempo durante el diagnostico.
- En ese caso, el flujo llevo a una pestaña que decia `Estamos haciendo ajustes`, con opciones como `Intentar de nuevo` y `Volver al inicio`.
- `Intentar de nuevo` no resolvia el problema y volvia a la misma pantalla.
- `Volver al inicio` llevaba a la landing, pero al intentar entrar otra vez al diagnostico se volvia a la misma pestaña de `Estamos haciendo ajustes`.
- El resultado practico era un bucle del que el alumno no podia salir facilmente.
- En ese contexto, tampoco habia una opcion clara de cerrar sesion desde esa salida para romper el estado y recuperar control.

Cambio que propongo:

- Revisar el manejo del timeout del diagnostico para que no deje al alumno atrapado en ese estado.
- Asegurar una salida clara desde esa situacion, por ejemplo:
  - reintentar de verdad
  - volver a un punto valido del flujo
  - cerrar sesion si hiciera falta romper el estado

Impacto esperado:

- Evitar bloqueos completos del alumno despues de un timeout.
- Mejor capacidad de recuperacion frente a errores o estados limite.
- Menor frustracion en un momento especialmente sensible del flujo.

## 4. En el cierre de planificacion falta una salida clara despues de guardar

Problema observado:

- En la etapa donde aparece el mensaje `Todo listo para tu diagnostico`, existe la opcion de `Guardar y continuar despues`.
- Cuando el usuario selecciona esa opcion, la informacion se guarda, pero queda en la misma pantalla.
- Desde ahi no queda una salida clara hacia un menu principal o landing.
- Las opciones visibles siguen empujando a iniciar el diagnostico o volver atras en las preguntas de planificacion.

Cambio que propongo:

- Despues de guardar, mostrar una opcion clara como `Volver al menu principal` o equivalente.
- Alternativamente, redirigir automaticamente a una vista coherente con ese estado guardado.

Impacto esperado:

- Menos sensacion de quedar atrapado en la pantalla.
- Mejor cierre para usuarios que no quieren seguir en ese momento.
- Flujo mas consistente con la promesa de `continuar despues`.

## 5. En el diagnostico comun tambien deberian rotarse variantes entre cuentas

Problema observado:

- Al hacer el diagnostico con dos cuentas distintas, las primeras 8 preguntas salieron iguales.
- Entiendo que esas 8 preguntas corresponden a la ruta comun de routing, pero eso no deberia impedir usar variantes.
- Si ya se generaron variantes de esas mismas preguntas, entonces distintas cuentas no deberian recibir siempre exactamente la misma version.

Cambio que propongo:

- Mantener la misma estructura comun de routing, pero rotando variantes de cada pregunta entre cuentas cuando existan.

Impacto esperado:

- Menor sensacion de repeticion entre usuarios.
- Mejor aprovechamiento del trabajo ya hecho en generacion de variantes.
- Mayor frescura del diagnostico sin cambiar la logica de evaluacion.

## 6. La meta de puntaje se esta pidiendo de nuevo despues del diagnostico

Problema observado:

- Despues de terminar el diagnostico, el flujo vuelve a pedir definir la meta de puntaje.
- Eso genera duplicacion con la planificacion inicial, donde esa meta ya fue solicitada antes.
- La meta debiese definirse en un solo lugar, no en dos momentos distintos del flujo.

Cambio que propongo:

- Decidir un unico punto del flujo para pedir la meta:
  - o en la planificacion inicial
  - o despues del diagnostico
- Pero no en ambos.

Impacto esperado:

- Menos friccion.
- Menos sensacion de repetir informacion ya entregada.
- Flujo mas claro y mas coherente.

## 7. La sugerencia de meta esta mostrando un decimal extraño

Problema observado:

- Al terminar el diagnostico, la sugerencia de meta aparecio como `900.1`.
- Ese valor se ve incorrecto o, como minimo, raro para un objetivo de puntaje mostrado al alumno.

Pregunta abierta:

- Revisar de donde sale ese decimal y si corresponde a un error de calculo, de redondeo o de presentacion.

Cambio que propongo:

- La meta sugerida debiese mostrarse redondeada y limpia, sin decimales innecesarios, salvo que exista una razon muy clara para mostrarlos.

Impacto esperado:

- Mas claridad y confianza en la recomendacion.
- Menor sensacion de error o de comportamiento improvisado.

## 8. El portal empuja una sola ruta recomendada y no deja explorar otras lineas

Problema observado:

- Al entrar al portal aparece una ruta recomendada y la opcion de iniciar mini-clase.
- Pero no se muestran alternativas claras por si el alumno quisiera seguir otra linea o estudiar otra cosa primero.
- Eso puede hacer que el portal se sienta demasiado cerrado para un alumno que quiere priorizar otro frente.

Cambio que propongo:

- Mantener la recomendacion principal, pero mostrar tambien otras rutas o lineas de estudio disponibles para elegir.

Impacto esperado:

- Mayor sensacion de control por parte del alumno.
- Mejor exploracion del sistema.
- Menor riesgo de frustracion si la recomendacion principal no coincide con lo que el alumno quiere estudiar en ese momento.

## 9. El contador de preguntas del test completo esta mostrando valores inconsistentes

Problema observado:

- En la opcion de `Tomar test completo`, el texto indica algo como `Evalua tu nivel con un test completo de X preguntas`.
- Ese valor ha mostrado numeros distintos en momentos distintos: primero `56`, despues `60` y luego `0`.
- Eso se ve como un bug, porque el usuario no entiende realmente cuantas preguntas tendra el test.

Cambio que propongo:

- Corregir la logica que calcula o muestra ese total para que el numero sea consistente y confiable.

Impacto esperado:

- Mas claridad antes de iniciar el test.
- Menor sensacion de error en el portal.
- Mejor confianza en el flujo completo de evaluacion.

## 10. El detalle del test completo carga con un numero incorrecto antes de actualizarse

Problema observado:

- En esa misma seccion del test completo, el detalle primero mostro `60 preguntas de opcion multiple`.
- Despues se actualizo y paso a mostrar `0`.
- Eso se ve como un bug de estado o de refresco, porque el dato empeora despues de cargar en vez de estabilizarse.

Cambio que propongo:

- Evitar que el valor correcto sea sobreescrito por un estado posterior invalido.
- Si el dato aun no esta resuelto, mostrar un estado neutro de carga en vez de reemplazarlo por `0`.

Impacto esperado:

- Menos confusion al entrar al portal.
- Mejor percepcion de estabilidad del producto.
- Menor riesgo de que el usuario desconfie del test antes de empezarlo.

## 11. El nombre del nivel en resultados puede ser desmotivante

Problema observado:

- Al terminar el examen completo, debajo del puntaje aparece un nivel.
- En el caso visto, el nivel mostrado fue `Muy inicial`.
- Aunque tecnicamente pueda describir el desempeno, esa etiqueta puede sentirse dura o desmotivante para algunos estudiantes.

Cambio que propongo:

- Revisar el tono de estas etiquetas de nivel para que sigan siendo claras, pero menos castigadoras.
- Conviene evaluar si se puede usar una nomenclatura mas pedagógica, mas neutra o mas orientada a progreso.

Impacto esperado:

- Menor riesgo de desmotivar al estudiante justo despues de terminar una evaluacion exigente.
- Mejor recepcion emocional de los resultados.
- Un feedback mas alineado con una experiencia de aprendizaje y no solo de clasificacion.

## 12. Los indicadores visuales de racha en mini-clases no persisten entre preguntas

Problema observado:

- En las mini-clases, cuando llegas a las preguntas, aparecen circulos que representan la racha.
- Si el alumno responde bien, un circulo se pone verde.
- Pero al pasar a la siguiente pregunta, ese circulo se apaga.
- Recién cuando acierta la segunda se ven dos circulos encendidos, pero al avanzar otra vez se vuelven a apagar.

Comportamiento esperado:

- Los circulos de racha debiesen mantenerse encendidos una vez ganados, no apagarse al cambiar de pregunta.

Impacto esperado al corregirlo:

- Mejor lectura del progreso inmediato dentro de la mini-clase.
- Mayor sensacion de avance.
- Menor confusion sobre si la racha realmente se está guardando o no.

## 13. La logica de los circulos de racha no se explica y su limite visual confunde

Problema observado:

- En las mini-clases solo aparecen 3 circulos de racha.
- No se le explica al estudiante por que existen, que representan o por que son 3.
- Ademas, si la racha supera ese numero, la UI sigue mostrando solo 3 circulos.
- Ejemplo observado: con una racha de 4, siguen apareciendo solo 3 circulos, sin explicar que significa eso.

Cambio que propongo:

- Explicar brevemente la mecanica de racha.
- Revisar si el limite visual de 3 tiene sentido tal como esta mostrado.
- Si la racha real puede superar 3, la interfaz debiese reflejarlo o al menos explicarlo claramente.

Impacto esperado:

- Menos confusion sobre la mecanica.
- Mejor comprension del sistema de refuerzo.
- Mayor consistencia entre el estado real del alumno y lo que muestra la interfaz.

## 14. Falta una entrada clara para alumnos que ya tienen cuenta y solo quieren entrar

Problema observado:

- Al volver al landing de estudiantes sin sesion iniciada, las opciones visibles empujan principalmente a `Crear mi plan y empezar diagnostico` y a ver resultados de ejemplo.
- Para un alumno que ya tiene cuenta, ya hizo el diagnostico y solo quiere volver a su plataforma, no hay una entrada clara y directa.
- Falta un boton evidente de `Iniciar sesion` o equivalente para usuarios recurrentes.

Cambio que propongo:

- Agregar un boton claro de `Iniciar sesion` en la landing de estudiantes.
- Ese acceso debiese convivir con la CTA principal de onboarding, sin competirle demasiado, pero estando claramente disponible.

Impacto esperado:

- Menos friccion para alumnos recurrentes.
- Mejor acceso al portal para usuarios que ya pasaron por onboarding.
- Menor riesgo de que alguien crea que tiene que rehacer pasos que ya completo.

## 15. Si existe una mini-clase gratuita, la landing deberia comunicarlo explicitamente

Problema observado:

- Si se va a seguir ofreciendo una mini-clase gratuita como parte de la experiencia de entrada, eso no debiese quedar implícito.
- Hoy la landing pone mucho foco en el diagnostico, pero no deja igual de claro que tambien se puede probar una mini-clase.
- Se pierde una oportunidad de mostrar valor antes de que el alumno decida entrar a la plataforma.

Cambio que propongo:

- Contar explicitamente en la landing que, ademas del diagnostico, el alumno puede hacer una mini-clase gratuita para probar la experiencia.

Impacto esperado:

- Mejor comunicacion de valor.
- Mas opciones de entrada para alumnos que todavia no estan listos para comprometerse con todo el flujo.
- Mayor probabilidad de conversion desde usuarios curiosos que quieren probar antes de decidir.
