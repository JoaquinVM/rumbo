## MODIFIED Requirements

### Requirement: PUB-01 Dirección y entrada
El sistema SHALL responder en `https://rumbo.jviscafe.com` a través del túnel de Cloudflare de las apps, sin publicar puertos en el VPS. Solo SHALL entrar quien Cloudflare Access apruebe, con su cuenta de Google o con el código que le llega al correo, y solo los correos aprobados en la política de Access y en `CORREOS_PERMITIDOS`. El servidor MUST rechazar con 401 toda petición a la API sin un token de Access válido (firma, audiencia, emisor y vencimiento) y con 403 la de un correo que no está aprobado.

#### Scenario: Entrar con Google
- **WHEN** Joaquín abre `rumbo.jviscafe.com` y elige entrar con su cuenta de Google
- **THEN** ve Rumbo con sus datos, los mismos que ve cuando entra con el código

#### Scenario: Correo aprobado
- **WHEN** Joaquín abre `rumbo.jviscafe.com` y escribe el código que le llegó a su correo
- **THEN** ve Rumbo con sus datos

#### Scenario: Correo no aprobado
- **WHEN** alguien entra con una cuenta de Google que no está en la lista
- **THEN** Access no lo deja pasar, y si llegara al servidor, este responde 403 sin leer ni escribir nada

#### Scenario: Sin pasar por Access
- **WHEN** una petición llega a la API sin token de Access, o con uno vencido o de otra aplicación
- **THEN** el servidor responde 401 y no lee ni escribe nada
