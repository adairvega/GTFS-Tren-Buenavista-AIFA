# GTFS Tren Felipe Ángeles Buenavista-AIFA

Feed GTFS no oficial del **Tren Felipe Ángeles**, servicio ferroviario que conecta la Ciudad de México con el Aeropuerto Internacional Felipe Ángeles (AIFA) a través de 12 estaciones.

[![GTFS Validator](https://img.shields.io/badge/GTFS-Valid-brightgreen)](https://gtfs-validator.mobilitydata.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📋 Información del Servicio

- **Operador**: Banco Nacional de Obras y Servicios Públicos, S.N.C. (Banobras/Fonadin)
- **Inauguración**: 26 de abril de 2026
- **Longitud**: 41 km (18 km Buenavista-Lechería + 22.94 km Lechería-AIFA)
- **Estaciones**: 12
- **Tiempo de recorrido**: ~60 minutos (inicio de operaciones), objetivo 43 minutos
- **Frecuencia**: Cada 30 minutos
- **Velocidad**: Promedio 65 km/h, máxima 130 km/h

### Horarios

| Día | Horario |
|-----|---------|
| Lunes a Viernes | 5:00 - 00:00 |
| Sábados | 6:00 - 00:00 |
| Domingos y Festivos | 7:00 - 00:00 |

### Tarifas (Promocionales - Primer Mes)

| Tipo | Precio |
|------|--------|
| Estaciones intermedias | $11.50 MXN |
| Conexión a AIFA | $45.00 MXN |

## 🚉 Estaciones

1. **Buenavista** - Ciudad de México
2. **Fortuna** - Ciudad de México
3. **Tlalnepantla** - Estado de México
4. **San Rafael** - Tlalnepantla
5. **Lechería** - Tultitlán
6. **Cueyamil** - Tultitlán
7. **La Loma** - Tultepec
8. **Teyahualco** - Tultepec
9. **Prados Sur** - Nextlalpan
10. **Cajiga** - Nextlalpan
11. **Xaltocan** - Nextlalpan
12. **AIFA / Clara Krause** - Zumpango

## 📦 Contenido del Feed

Este feed GTFS incluye los siguientes archivos:

### Archivos Obligatorios
- `agency.txt` - Información de la agencia operadora
- `stops.txt` - Ubicación y detalles de las 12 estaciones
- `routes.txt` - Definición de la ruta del Tren Felipe Ángeles
- `trips.txt` - Viajes en ambas direcciones (Buenavista↔AIFA)
- `stop_times.txt` - Horarios estimados por estación
- `calendar.txt` - Servicios por tipo de día (L-V, Sáb, Dom)

### Archivos Opcionales
- `shapes.txt` - Trazado geográfico de la ruta en ambas direcciones
- `frequencies.txt` - Frecuencia de servicio (cada 30 minutos)
- `feed_info.txt` - Metadatos del feed
- `fare_attributes.txt` - Tarifas del servicio
- `fare_rules.txt` - Reglas de aplicación de tarifas por zona

## 🔧 Validación

Este feed cumple con la especificación GTFS y ha sido validado con:

- ✅ [GTFS Validator by MobilityData](https://gtfs-validator.mobilitydata.org/)
- ✅ [Google Transit Feed Validator](https://developers.google.com/transit/gtfs/guides/tools)

### Validar localmente

```bash
# Descargar el validador
wget https://github.com/MobilityData/gtfs-validator/releases/latest/download/gtfs-validator-cli.jar

# Validar el feed
java -jar gtfs-validator-cli.jar -i GTFS-Tren-Buenavista-AIFA.zip
```

## 🚀 Uso

### Integración en Aplicaciones

Este feed puede ser utilizado por aplicaciones de planificación de rutas como:

- Google Maps
- Transit App
- Moovit
- Citymapper
- Y cualquier aplicación compatible con GTFS

### Descargar el Feed

```bash
# Clonar el repositorio
git clone https://github.com/adairvega/GTFS-Tren-Buenavista-AIFA.git

# O descargar como ZIP
wget https://github.com/adairvega/GTFS-Tren-Buenavista-AIFA/archive/refs/heads/main.zip
```

## 📊 Especificaciones Técnicas

- **Formato**: GTFS (General Transit Feed Specification)
- **Versión GTFS**: Static v2.0
- **Codificación**: UTF-8
- **Sistema de Coordenadas**: WGS84 (EPSG:4326)
- **Zona Horaria**: America/Mexico_City
- **Idioma**: Español (es)
- **Vigencia**: 27 de abril - 27 de mayo de 2026

## 🔄 Actualizaciones

Este feed será actualizado periódicamente para reflejar:

- Cambios en horarios y frecuencias
- Nuevas tarifas (cuando finalice el período promocional)
- Días festivos y servicios especiales
- Ajustes en tiempos de recorrido
- Eventos que afecten el servicio

**Última actualización**: 29 de abril de 2026  
**Versión**: 1.0.0

## 📚 Referencias

- [Wikipedia - Tren Buenavista-AIFA](https://es.wikipedia.org/wiki/Tren_Buenavista-AIFA)
- [Presidencia de México - Inauguración](https://www.gob.mx/presidencia/prensa/cumplimos-con-el-pueblo-de-mexico-presidenta-claudia-sheinbaum-inaugura-el-tren-felipe-angeles-buenavista-aifa)
- [Milenio - Horarios y Ruta](https://www.milenio.com/comunidad/ruta-tren-suburbano-aifa-cuales-seran-los-horarios-de-servicio)
- [Banobras - Tren Felipe Ángeles](https://www.gob.mx/banobras/articulos/el-tren-felipe-angeles-buenavista-aifa-movilidad-publica-para-el-segundo-piso-de-la-transformacion)
- [GTFS Specification](https://gtfs.org/)

## 👥 Contribuciones

Las contribuciones son bienvenidas para:

- Correcciones de datos
- Mejoras en la precisión de horarios
- Actualización de coordenadas
- Traducción de campos opcionales
- Reportar inconsistencias

Para contribuir:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/mejora`)
3. Commit tus cambios (`git commit -m 'Descripción del cambio'`)
4. Push a la rama (`git push origin feature/mejora`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## 📧 Contacto

Para consultas sobre el feed GTFS (De este repositorio):

- **Email**: gon.adair@gmail.com
- **X (Twitter)**: [@adair_vega](https://x.com/adair_vega)

---

**Nota**: Este es un feed GTFS no oficial creado con información pública disponible. Los horarios y tiempos de recorrido son estimaciones basadas en las especificaciones técnicas del servicio. Para información oficial y actualizada, consulta directamente con Banobras/Fonadin o la cuenta de X [@TrenAIFA](https://x.com/TrenAIFA).
