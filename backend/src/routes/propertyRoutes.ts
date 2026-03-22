// =============================================================================
// RUTAS DE PROPIEDADES - Module 3: RealEstate Hub API
// =============================================================================
// Define las rutas (endpoints) de la API de propiedades.
//
// ## Diseño RESTful
// Seguimos convenciones REST para los endpoints:
// - GET /api/properties - Listar todas (con paginación)
// - GET /api/properties/:id - Obtener una
// - POST /api/properties - Crear nueva
// - PUT /api/properties/:id - Actualizar
// - DELETE /api/properties/:id - Eliminar
//
// ## Express Router
// Usamos Router() para modularizar las rutas.
// Cada recurso (properties, users, etc.) tendría su propio archivo.
// =============================================================================

import { Router } from 'express';
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController.js';

const router = Router();

// =============================================================================
// RUTAS CRUD
// =============================================================================

/**
 * GET /api/properties
 * Lista propiedades con filtros opcionales y paginación.
 *
 * Query params - Filtros:
 * - search: Búsqueda por texto
 * - propertyType: Filtro por tipo de propiedad
 * - operationType: Filtro por tipo de operación
 * - minPrice, maxPrice: Rango de precios
 * - minBedrooms: Habitaciones mínimas
 * - city: Filtro por ciudad
 *
 * Query params - Paginación:
 * - page:  Página a mostrar (default: 1, debe ser entero positivo)
 * - limit: Resultados por página (default: 10, debe ser entero positivo)
 *
 * Ejemplo: GET /api/properties?page=2&limit=5&city=Guatemala
 *
 * Respuesta:
 * {
 *   success: true,
 *   data: [...],
 *   meta: {
 *     total: 42,      <- total de registros que coinciden con los filtros
 *     page: 2,        <- página actual
 *     limit: 5,       <- resultados por página
 *     pages: 9        <- ceil(42 / 5) = total de páginas
 *   }
 * }
 */
router.get('/', (req, res) => {
  void getAllProperties(req, res);
});

/**
 * GET /api/properties/:id
 * Obtiene una propiedad específica por su ID.
 */
router.get('/:id', (req, res) => {
  void getPropertyById(req, res);
});

/**
 * POST /api/properties
 * Crea una nueva propiedad.
 *
 * Body: CreatePropertyInput
 */
router.post('/', (req, res) => {
  void createProperty(req, res);
});

/**
 * PUT /api/properties/:id
 * Actualiza una propiedad existente.
 *
 * Body: Partial<CreatePropertyInput>
 */
router.put('/:id', (req, res) => {
  void updateProperty(req, res);
});

/**
 * DELETE /api/properties/:id
 * Elimina una propiedad.
 */
router.delete('/:id', (req, res) => {
  void deleteProperty(req, res);
});

export default router;
