import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { isAuthenticated, isNotBanned, isAdmin, AuthRequest } from '../middleware/auth.js';
import { compileFilter, reloadFilters } from '../services/filterEngine.js';

const router = Router();

function getId(req: AuthRequest): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

const filterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  code: z.string().min(1),
  isGlobal: z.boolean().default(false),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
  valves: z.string().default('{}'),
});

// User-facing: list active global filters (read-only)
router.get('/', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const filters = await prisma.filter.findMany({
      where: { isActive: true, isGlobal: true },
      orderBy: { priority: 'asc' },
      select: { id: true, name: true, description: true, priority: true },
    });
    res.json(filters);
  } catch (e: any) {
    console.error('[Filters] User list error:', e);
    res.status(500).json({ error: 'Failed to load filters' });
  }
});

// Admin: list all filters
router.get('/admin', isAuthenticated, isNotBanned, isAdmin, async (req: AuthRequest, res) => {
  try {
    const filters = await prisma.filter.findMany({
      orderBy: { priority: 'asc' },
      include: { author: { select: { username: true } } },
    });
    res.json(filters);
  } catch (e: any) {
    console.error('[Filters] Admin list error:', e);
    res.status(500).json({ error: 'Failed to load filters' });
  }
});

// Admin: create filter
router.post('/admin', isAuthenticated, isNotBanned, isAdmin, async (req: AuthRequest, res) => {
  try {
    const data = filterSchema.parse(req.body);

    const compileResult = compileFilter(data.code);
    if (!compileResult.success) {
      return res.status(400).json({ error: 'Filter code error: ' + compileResult.error });
    }

    const filter = await prisma.filter.create({
      data: {
        name: data.name,
        description: data.description,
        code: data.code,
        authorId: req.userId!,
        isGlobal: data.isGlobal,
        isActive: data.isActive,
        priority: data.priority,
        valves: data.valves,
      },
      include: { author: { select: { username: true } } },
    });

    await reloadFilters();

    res.status(201).json(filter);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to create filter: ' + e.message });
  }
});

// Admin: update filter
router.put('/admin/:id', isAuthenticated, isNotBanned, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = getId(req);
    const data = filterSchema.partial().parse(req.body);

    if (data.code) {
      const compileResult = compileFilter(data.code);
      if (!compileResult.success) {
        return res.status(400).json({ error: 'Filter code error: ' + compileResult.error });
      }
    }

    const existing = await prisma.filter.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Filter not found' });

    const filter = await prisma.filter.update({
      where: { id },
      data,
      include: { author: { select: { username: true } } },
    });

    await reloadFilters();

    res.json(filter);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to update filter: ' + e.message });
  }
});

// Admin: delete filter
router.delete('/admin/:id', isAuthenticated, isNotBanned, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = getId(req);
    const existing = await prisma.filter.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Filter not found' });

    await prisma.filter.delete({ where: { id } });
    await reloadFilters();

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to delete filter: ' + e.message });
  }
});

// Admin: test compile filter code without saving
router.post('/admin/test', isAuthenticated, isNotBanned, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body);
    const result = compileFilter(code);
    res.json(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Test failed: ' + e.message });
  }
});

export default router;
