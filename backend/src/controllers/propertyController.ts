// =============================================================================
// CONTROLADOR DE PROPIEDADES - Module 3: RealEstate Hub API
// =============================================================================
// Los controladores contienen la lógica de negocio de los endpoints.
//
// ## Patrón Controller + Repository
// Separamos responsabilidades:
// - Controller: Maneja HTTP (req/res), validación, respuestas
// - Repository: Acceso a datos (Prisma), queries, transformaciones
//
// Esto facilita:
// - Testing (mock del repositorio)
// - Cambiar base de datos sin modificar controladores
// - Mantener controladores enfocados en HTTP
//
// ## Comparación con Android (MVVM)
// Android:
//   Controller ≈ ViewModel (maneja lógica de UI)
//   Repository = Repository (acceso a datos)
//
// Express:
//   Controller (maneja HTTP y lógica de negocio)
//   Repository (abstrae Prisma/base de datos)
// =============================================================================

import type { Request, Response } from 'express';
import { createPropertySchema, updatePropertySchema, type PropertyFilters } from '../types/property.js';
import { propertyRepository } from '../repositories/propertyRepository.js';
import { prisma } from '../repositories/propertyRepository.js';
// =============================================================================
// GET /api/properties - Listar propiedades con filtros y paginación
// =============================================================================
// Reemplaza: localStorage.getItem('properties')
//
// Query params de paginación:
// - page:  Página actual (default: 1)
// - limit: Resultados por página (default: 10)
//
// Respuesta incluye meta: { total, page, limit, pages }
// =============================================================================

export async function getAllProperties(req: Request, res: Response): Promise<void> {
  try {
    // -------------------------------------------------------------------------
    // 1. Parsear y validar parámetros de paginación
    // -------------------------------------------------------------------------
    const rawPage  = req.query.page  as string | undefined;
    const rawLimit = req.query.limit as string | undefined;

    // Aplicamos valores default si no vienen en la query
    const page  = rawPage  !== undefined ? Number(rawPage)  : 1;
    const limit = rawLimit !== undefined ? Number(rawLimit) : 10;

    // Validación: deben ser números enteros positivos
    if (
      !Number.isInteger(page)  || page  <= 0 ||
      !Number.isInteger(limit) || limit <= 0 ||
      isNaN(page) || isNaN(limit)
    ) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Los parámetros "page" y "limit" deben ser enteros positivos',
          code: 'INVALID_PAGINATION',
        },
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 2. Extraer filtros de los query params (igual que antes)
    // -------------------------------------------------------------------------
    const filters: PropertyFilters = {
      search:        req.query.search        as string | undefined,
      propertyType:  req.query.propertyType  as PropertyFilters['propertyType'],
      operationType: req.query.operationType as PropertyFilters['operationType'],
      minPrice:      req.query.minPrice   ? Number(req.query.minPrice)   : undefined,
      maxPrice:      req.query.maxPrice   ? Number(req.query.maxPrice)   : undefined,
      minBedrooms:   req.query.minBedrooms ? Number(req.query.minBedrooms) : undefined,
      city:          req.query.city as string | undefined,
    };

    // -------------------------------------------------------------------------
    // 3. Obtener TODAS las propiedades filtradas para calcular el total
    //    y luego aplicar el slice de paginación.
    //
    //    Nota: Si propertyRepository expone findAllPaginated(filters, skip, take)
    //    es preferible usarlo para delegar el LIMIT/OFFSET a la base de datos.
    //    Aquí usamos findAll y paginamos en memoria para no romper el contrato
    //    actual del repositorio.
    // -------------------------------------------------------------------------
    const allProperties = await propertyRepository.findAll(filters);

    const total = allProperties.length;
    const pages = Math.ceil(total / limit);         // total de páginas
    const skip  = (page - 1) * limit;              // índice de inicio

    // Si la página pedida está fuera de rango devolvemos array vacío (no error)
    const data = skip >= total ? [] : allProperties.slice(skip, skip + limit);

    // -------------------------------------------------------------------------
    // 4. Responder con datos + metadata de paginación
    // -------------------------------------------------------------------------
    res.json({
      success: true,
      data,
      meta: {
        total,          // cantidad total de registros que coinciden con los filtros
        page,           // página actual
        limit,          // resultados por página
        pages,          // total de páginas
      },
    });
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}


// =============================================================================

export async function getPropertyStats(req: Request, res: Response): Promise<void> {
  try {
   
    const globalStats = await prisma.property.aggregate({
      _count: { id: true },
      _min:   { price: true },
      _max:   { price: true },
    });

    const total    = globalStats._count.id    ?? 0;
    const minPrice = globalStats._min.price   ?? 0;
    const maxPrice = globalStats._max.price   ?? 0;
    const groupedStats = await prisma.property.groupBy({
      by: ['propertyType'],
      _count: { id: true },
      _avg:   { price: true },
      _min:   { price: true },
      _max:   { price: true },
    });

    const byType: Record<string, {
      count:    number;
      avgPrice: number;
      minPrice: number;
      maxPrice: number;
    }> = {};

    for (const group of groupedStats) {
      byType[group.propertyType] = {
        count:    group._count.id       ?? 0,
        avgPrice: group._avg.price      ?? 0,
        minPrice: group._min.price      ?? 0,
        maxPrice: group._max.price      ?? 0,
      };
    }

  
    res.json({
      success: true,
      data: {
        total,
        priceRange: {
          min: minPrice,
          max: maxPrice,
        },
        byType,   
      },
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

// =============================================================================
// GET /api/properties/:id - Obtener una propiedad por ID
// =============================================================================

export async function getPropertyById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const property = await propertyRepository.findById(id);

    if (!property) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Propiedad no encontrada',
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error al obtener propiedad:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

// =============================================================================
// POST /api/properties - Crear una nueva propiedad
// =================================================================

export async function createProperty(req: Request, res: Response): Promise<void> {
  try {
    const validationResult = createPropertySchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Datos de entrada inválidos',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues,
        },
      });
      return;
    }

    const property = await propertyRepository.create(validationResult.data);

    res.status(201).json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error al crear propiedad:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}


export async function updateProperty(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const validationResult = updatePropertySchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Datos de entrada inválidos',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues,
        },
      });
      return;
    }

    const property = await propertyRepository.update(id, validationResult.data);

    if (!property) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Propiedad no encontrada',
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error al actualizar propiedad:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

// =============================================================================
// DELETE /api/properties/:id - Eliminar una propiedad
// =============================================================================

export async function deleteProperty(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const deleted = await propertyRepository.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Propiedad no encontrada',
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: { message: 'Propiedad eliminada correctamente' },
    });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}
