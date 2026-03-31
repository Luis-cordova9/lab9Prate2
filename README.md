# Parte 2 — Property Statistics

## Descripción

Se implementó un endpoint de estadísticas agregadas para el API de RealEstate Hub. Permite a los administradores obtener métricas útiles sobre las propiedades sin tener que procesar los datos en el cliente.

---

## Endpoint

```
GET /api/properties/stats
```

No requiere parámetros ni autenticación.

---

## Ejemplo de respuesta

```json
{
  "success": true,
  "data": {
    "total": 35,
    "priceRange": {
      "min": 50000,
      "max": 2000000
    },
    "byType": {
      "house": {
        "count": 10,
        "avgPrice": 350000,
        "minPrice": 120000,
        "maxPrice": 800000
      },
      "apartment": {
        "count": 15,
        "avgPrice": 180000,
        "minPrice": 50000,
        "maxPrice": 450000
      },
      "land": {
        "count": 5,
        "avgPrice": 95000,
        "minPrice": 30000,
        "maxPrice": 200000
      }
    }
  }
}
```

---

## Campos de la respuesta

| Campo | Tipo | Descripción |
|---|---|---|
| `total` | number | Total de propiedades en la base de datos |
| `priceRange.min` | number | Precio más bajo de todas las propiedades |
| `priceRange.max` | number | Precio más alto de todas las propiedades |
| `byType` | object | Métricas agrupadas por `propertyType` |
| `byType[tipo].count` | number | Cantidad de propiedades de ese tipo |
| `byType[tipo].avgPrice` | number | Precio promedio de ese tipo |
| `byType[tipo].minPrice` | number | Precio mínimo de ese tipo |
| `byType[tipo].maxPrice` | number | Precio máximo de ese tipo |

---

## Archivos modificados

### `src/controllers/propertyController.ts`
Se agregó la función `getPropertyStats` que realiza dos queries a Prisma:

**1. `prisma.property.aggregate`** — obtiene el total global y el rango de precios en una sola query:
```ts
const globalStats = await prisma.property.aggregate({
  _count: { id: true },
  _min:   { price: true },
  _max:   { price: true },
});
```

**2. `prisma.property.groupBy`** — agrupa por `propertyType` y calcula métricas por grupo:
```ts
const groupedStats = await prisma.property.groupBy({
  by: ['propertyType'],
  _count: { id: true },
  _avg:   { price: true },
  _min:   { price: true },
  _max:   { price: true },
});
```

El resultado del `groupBy` (array) se transforma en un objeto indexado por tipo para facilitar su consumo en el frontend.

### `src/routes/propertyRoutes.ts`
Se agregó la ruta `/stats` **antes** de `/:id`. Este orden es crítico: si se declarara después, Express interpretaría la cadena `"stats"` como un valor del parámetro dinámico `:id` y nunca llegaría al handler correcto.

```ts
router.get('/stats', (req, res) => {
  void getPropertyStats(req, res);
});

router.get('/:id', (req, res) => { // debe ir después de /stats
  void getPropertyById(req, res);
});
```

---

## Criterios de aceptación

| Criterio | Estado |
|---|---|
| `GET /api/properties/stats` retorna datos | ✅ |
| Count por tipo (`{ house: 10, apartment: 15, ... }`) | ✅ |
| Precio promedio por tipo | ✅ |
| Rango de precios global (`min` / `max`) | ✅ |
| Total de propiedades | ✅ |
| Usa `groupBy` y `aggregate` de Prisma | ✅ |
| Base de datos vacía retorna ceros, no error | ✅ |

---

## Comportamiento con base de datos vacía

Cuando no hay propiedades registradas, Prisma devuelve `null` en los campos numéricos de `aggregate`. El controlador los convierte a `0` usando el operador `?? 0`, por lo que la respuesta es:

```json
{
  "success": true,
  "data": {
    "total": 0,
    "priceRange": { "min": 0, "max": 0 },
    "byType": {}
  }
}
```

No se lanza ningún error.

---

## Decisión de diseño

Las operaciones `groupBy` y `aggregate` se implementaron directamente en el controlador usando Prisma, en lugar de añadirlas al `propertyRepository`. Esto se debe a que son operaciones de **analytics/reporting** que no forman parte del contrato CRUD del repositorio. Mezclarlas generaría un repositorio con responsabilidades mixtas. En un proyecto más grande se crearía un `statsRepository` separado.

## Se uso brave en la prueba 

## Video 
https://youtu.be/cFxcn0oCnA4
