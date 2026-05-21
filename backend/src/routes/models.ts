import { Router } from 'express';
import { getConfig } from '../config.js';

const router = Router();

router.get('/', (req, res) => {
  const { models, defaultModelId } = getConfig();
  res.json({ models, defaultModelId });
});

export default router;
