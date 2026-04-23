import crypto from 'node:crypto';
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { NotificationRepository } from './repository.js';
import type { NotificationPreferences, RegisterDeviceRequest } from './types.js';

interface AuthRequestLike extends Request {
  user?: {
    id: number;
  };
}

function getAuthenticatedUserId(req: AuthRequestLike): number {
  // Replace with your auth middleware populated user.
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('Unauthenticated');
  }
  return userId;
}

export function createNotificationRouter(repository: NotificationRepository): Router {
  const router = Router();

  router.post('/devices/register', async (req: Request, res: Response) => {
    try {
      const payload = req.body as RegisterDeviceRequest;
      if (!payload.userId || !payload.token || !payload.platform || !payload.timezone) {
        res.status(400).json({ message: 'Invalid payload' });
        return;
      }
      const userId = getAuthenticatedUserId(req as AuthRequestLike);
      if (userId !== payload.userId) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      const deviceId = crypto
        .createHash('sha256')
        .update(`${payload.userId}:${payload.token}:${payload.platform}`)
        .digest('hex');

      await repository.upsertDevice(payload, deviceId);
      res.status(200).json({ message: 'Device registered', deviceId });
    } catch (error) {
      if ((error as Error).message === 'Unauthenticated') {
        res.status(401).json({ message: 'Unauthenticated' });
        return;
      }
      console.error('Device registration failed:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  router.delete('/devices/:deviceId', async (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req as AuthRequestLike);
      const deviceId = req.params.deviceId;
      await repository.deactivateDevice(userId, deviceId);
      res.status(200).json({ message: 'Device deactivated' });
    } catch (error) {
      if ((error as Error).message === 'Unauthenticated') {
        res.status(401).json({ message: 'Unauthenticated' });
        return;
      }
      console.error('Device delete failed:', error);
      res.status(500).json({ message: 'Delete failed' });
    }
  });

  router.get('/preferences', async (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req as AuthRequestLike);
      const preferences = await repository.getPreferences(userId);
      res.status(200).json(preferences);
    } catch (error) {
      if ((error as Error).message === 'Unauthenticated') {
        res.status(401).json({ message: 'Unauthenticated' });
        return;
      }
      console.error('Get preferences failed:', error);
      res.status(500).json({ message: 'Could not fetch preferences' });
    }
  });

  router.patch('/preferences', async (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req as AuthRequestLike);
      const payload = req.body as NotificationPreferences;
      const saved = await repository.upsertPreferences(userId, payload);
      res.status(200).json(saved);
    } catch (error) {
      if ((error as Error).message === 'Unauthenticated') {
        res.status(401).json({ message: 'Unauthenticated' });
        return;
      }
      console.error('Update preferences failed:', error);
      res.status(500).json({ message: 'Could not update preferences' });
    }
  });

  router.post('/test', async (req: Request, res: Response) => {
    // Keep test endpoint lightweight. Real implementation should enqueue through worker.
    try {
      getAuthenticatedUserId(req as AuthRequestLike);
      res.status(202).json({ message: 'Accepted test notification' });
    } catch (error) {
      if ((error as Error).message === 'Unauthenticated') {
        res.status(401).json({ message: 'Unauthenticated' });
        return;
      }
      res.status(500).json({ message: 'Could not enqueue test notification' });
    }
  });

  return router;
}
