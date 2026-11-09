import { Request, Response } from 'express';
import { UserAlert } from '../models/UserAlert';
import { isDbConnected } from '../config/database';
import { logger } from '../utils/logger';

let inMemoryAlerts: any[] = [];

export async function getAlerts(req: Request, res: Response): Promise<void> {
  try {
    if (!isDbConnected) {
      res.json({ success: true, data: inMemoryAlerts.filter((a) => a.isActive) });
      return;
    }
    const alerts = await UserAlert.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('getAlerts error:', error);
    res.json({ success: true, data: inMemoryAlerts.filter((a) => a.isActive) });
  }
}

export async function createAlert(req: Request, res: Response): Promise<void> {
  try {
    const { locationId, stationName, aqiThreshold, condition, pollutant, notificationTypes } = req.body;

    if (!locationId || !stationName || aqiThreshold === undefined) {
      res.status(400).json({ success: false, error: 'locationId, stationName, and aqiThreshold are required' });
      return;
    }

    if (!isDbConnected) {
      const newAlert = {
        _id: 'mock-alert-' + Date.now(),
        locationId,
        stationName,
        aqiThreshold,
        condition: condition ?? 'above',
        pollutant: pollutant ?? 'aqi',
        notificationTypes: notificationTypes ?? ['in-app'],
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      inMemoryAlerts.unshift(newAlert);
      res.status(201).json({ success: true, data: newAlert });
      return;
    }

    const alert = await UserAlert.create({
      locationId,
      stationName,
      aqiThreshold,
      condition: condition ?? 'above',
      pollutant: pollutant ?? 'aqi',
      notificationTypes: notificationTypes ?? ['in-app'],
      isActive: true,
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    logger.error('createAlert error:', error);
    res.status(500).json({ success: false, error: 'Failed to create alert' });
  }
}

export async function updateAlert(req: Request, res: Response): Promise<void> {
  try {
    if (!isDbConnected) {
      const idx = inMemoryAlerts.findIndex((a) => a._id === req.params['id']);
      if (idx === -1) {
        res.status(404).json({ success: false, error: 'Alert not found' });
        return;
      }
      inMemoryAlerts[idx] = { ...inMemoryAlerts[idx], ...req.body };
      res.json({ success: true, data: inMemoryAlerts[idx] });
      return;
    }

    const alert = await UserAlert.findByIdAndUpdate(
      req.params['id'],
      { $set: req.body },
      { new: true }
    );
    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }
    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('updateAlert error:', error);
    res.status(500).json({ success: false, error: 'Failed to update alert' });
  }
}

export async function deleteAlert(req: Request, res: Response): Promise<void> {
  try {
    if (!isDbConnected) {
      inMemoryAlerts = inMemoryAlerts.filter((a) => a._id !== req.params['id']);
      res.json({ success: true, message: 'Alert deleted' });
      return;
    }

    const alert = await UserAlert.findByIdAndDelete(req.params['id']);
    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    logger.error('deleteAlert error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete alert' });
  }
}

