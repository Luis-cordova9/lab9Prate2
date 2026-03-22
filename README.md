# Parte 1: Paginación y Metadata — RealEstate Hub API


## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/controllers/propertyController.ts` | Lógica de paginación, validación y metadata |
| `src/routes/propertyRoutes.ts` | Documentación actualizada del endpoint |

---

## Cómo usar el endpoint

### URL base
```
GET http://localhost:3002/api/properties
```

### Query params disponibles

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | entero positivo | `1` | Página a mostrar |
| `limit` | entero positivo | `10` | Resultados por página |
| `search` | string | — | Búsqueda por texto |
| `propertyType` | string | — | Filtro por tipo de propiedad |
| `operationType` | string | — | Filtro por tipo de operación |
| `minPrice` | número | — | Precio mínimo |
| `maxPrice` | número | — | Precio máximo |
| `minBedrooms` | número | — | Habitaciones mínimas |
| `city` | string | — | Filtro por ciudad |

---

## Ejemplos de uso

### Defaults (sin parámetros)
```
GET /api/properties
```
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### Página específica con límite
```
GET /api/properties?page=2&limit=5
```
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 42,
    "page": 2,
    "limit": 5,
    "pages": 9
  }
}
```

### Página fuera de rango → retorna array vacío, no error
```
GET /api/properties?page=999&limit=10
```
```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 42,
    "page": 999,
    "limit": 10,
    "pages": 5
  }
}
```

### Valor inválido → error 400
```
GET /api/properties?page=-1&limit=10
GET /api/properties?page=abc&limit=10
```
```json
{
  "success": false,
  "error": {
    "message": "Los parámetros \"page\" y \"limit\" deben ser enteros positivos",
    "code": "INVALID_PAGINATION"
  }
}
```

---

## Lógica implementada

```
total  = cantidad de propiedades que coinciden con los filtros
pages  = Math.ceil(total / limit)
skip   = (page - 1) * limit
data   = propiedades[skip ... skip + limit]
```

Si `skip >= total` → `data = []` (página fuera de rango, sin lanzar error).

---
## Video 

https://youtu.be/HXyVsHNigvs
