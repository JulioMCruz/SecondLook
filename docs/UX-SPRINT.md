# SecondLook UX sprint

## Implementado

- Workspace de evaluación con cabecera, identificación del expediente y una sola guía de tres etapas.
- Entrada de texto y ejemplos visibles; voz como alternativa desplegable.
- Brecha de evidencia específica, redactada en el idioma del expediente; consulta posterior visible.
- Resumen ejecutivo, hallazgos con estados, extractos contrastados con las fuentes recuperadas y preguntas copiables para el vendedor.
- Catálogo completo de fuentes desplegable, enlaces de citas y registro técnico separado.
- Checkout con oferta ausente/error/reintento y validación del entitlement en servidor.
- Plantilla HTML del correo OTP y alternativa de texto; límites de solicitudes/intentos.

## Observaciones pendientes de validación

- Revisar el titular de la brecha: algunos resultados son demasiado largos. Limitar su longitud en el prompt, manteniendo la explicación debajo.
- El catálogo de fuentes debe abrirse cerrado por defecto para priorizar el hallazgo y el CTA.
- Mantener estados apoyados por palabras e iconos; no depender del color.
- Verificar reanudación, compra exitosa, fallo y caducidad con la misma identidad de usuario.
- Refrescar la página de evaluaciones y el correo del reporte para mantener coherencia con el workspace.
- Normalizar entidades HTML numéricas y Markdown en snippets sin perder el texto de evidencia.
- Comprobar viewport móvil, foco y errores de red antes de grabar.

## Alcance enterprise

Experiencia sobria y trazable. No se afirma certificación, SOC 2, SSO, RBAC empresarial ni SLA: no son funciones implementadas. El objetivo de este sprint es calidad de interacción, evidencia verificable y controles correctos.

## Video

Regrabar el centro tras validar el recorrido. Mostrar una compra Test Store real, no una concesión artificial. Etiquetar test transactions. Reutilizar identidad HyperFrames y mantener el MP4 anterior como respaldo.

## Checkpoint 2 — 13 septiembre, 22:27 UTC

Implementado y comprobado:
- Página de evaluaciones con búsqueda, estados y recuentos; navegación al mismo expediente.
- Titular de brecha acotado, fuentes cerradas inicialmente y snippets limpiados.
- Sesiones demo aisladas: cada juez tiene su propio usuario, sin compartir historial ni compras.
- Oferta Monthly $9.99 de RevenueCat Test Store configurada en el proyecto SecondLook. Compra válida realizada en Chrome para Julio, entitlement confirmado en servidor y reporte generado. No se efectuó un cargo real.
- Acceso existente permite continuar sin volver a comprar.
- Citas mediante índices de pasajes: el servidor coloca el texto original. Se evita traducir accidentalmente una cita o aceptar texto inventado.
- Revisión independiente de inferencias: los datos generales de un mercado no prueban ni refutan la conducta de los competidores desconocidos del usuario.
- Cuatro casos reales EN/ES: propiedad de WhatsApp y adopción universal en Miami. Los cuatro alcanzan el estado esperado, con citas válidas. Es una muestra pequeña, no una medida de precisión general.
- Informe por email exclusivamente al destinatario; se elimina el reenvío de mensajes fallidos al propietario. Las sesiones demo conservan el informe en pantalla.
- Se eliminan esperas artificiales en componentes antiguos de fuentes/resumen y se respetan preferencias de movimiento.

Pendiente antes de la entrega: fallo de compra en Chrome, prueba móvil, publicar versión, actualizar video y notas de entrega. El lint pasa con cinco advertencias existentes; build de OpenNext y TypeScript pasan.

## Validación y ajustes posteriores

- Compra fallida y compra válida probadas en la app publicada con el mismo expediente y usuario demo. El fallo conservó la primera revisión; el éxito produjo el informe tras verificar RevenueCat en servidor.
- Prueba móvil a 390 × 844: sin desbordamiento horizontal. El resumen se adelanta a los metadatos cuando existe un informe.
- Corregido contraste de enlaces: una regla CSS global anulaba el blanco de los botones con fondo verde. Se movió a la capa base y se agregó foco visible.
- Descarga Markdown con hallazgos, citas, enlaces y preguntas; copia completa y PDF mediante impresión.
- El correo del reporte contiene hallazgos y preguntas, con citas originales. Las demos ofrecen descarga en lugar de intentar enviar a direcciones ficticias.
- Errores de red recuperables en login y reporte, estado de carga que termina al fallar, límite de reenvío de correo.
- El listado transmite resúmenes, sin descargar los extractos completos de todas las evaluaciones.
- Se retira el botón artificial «Simulate fail» del flujo del producto; el fallo se prueba dentro del SDK de Test Store.

## Backlog tras la presentación

1. Definir segmentos/competidores antes de investigar afirmaciones universales; pedir datos opcionales sin inventarlos.
2. Añadir un benchmark más amplio y revisión humana de inferencias; cuatro casos no bastan para afirmar precisión.
3. Evaluar la calidad y actualidad de fuentes, priorizando documentos primarios frente a marketing.
4. Dominio de envío verificado para acceso por email de cualquier destinatario. Por ahora se mantiene el remitente de pruebas de Resend.
5. Planes/límites de uso, equipos y permisos solo tras diseñarlos e implementarlos; no anunciarlos como capacidades actuales.

## Entregables del sprint

- Video v2: 66 segundos, H.264/AAC, 1920×1080, con narración inglesa. Capturas reales del mismo expediente antes/después de la compra Test Store. Versión anterior conservada.
- Composición editable en `docs/pitch`; MP4 en `public/secondlook-pitch-v2.mp4`.
- Plantilla OTP inspeccionada visualmente; código legible, caducidad e instrucciones claras.
- Pruebas: 10 de evidencia/acceso, 13 de integración, 4 evaluaciones EN/ES. Lint sin errores (cinco avisos preexistentes). TypeScript y build de OpenNext correctos.
- Video: sin errores ni advertencias en check de HyperFrames; 40/40 comprobaciones de contraste pasan. MP4 inspeccionado tras render, incluidos checkout y desbloqueo.
