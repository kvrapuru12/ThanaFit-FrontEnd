import { Expo } from 'expo-server-sdk';
import type { NotificationRepository } from './repository.js';
import type { ReminderCandidate } from './types.js';

const expo = new Expo();

export async function sendReminderCandidate(
  repository: NotificationRepository,
  candidate: ReminderCandidate
): Promise<void> {
  const devices = await repository.getActiveDevicesByUser(candidate.userId);
  if (!devices.length) {
    return;
  }

  for (const device of devices) {
    if (!Expo.isExpoPushToken(device.token)) {
      await repository.markFailed(
        `${candidate.dedupeKey}:${device.deviceId}`,
        'INVALID_TOKEN',
        'Token is not an Expo push token'
      );
      continue;
    }

    await repository.enqueueLog(candidate, device);

    try {
      const messages = [
        {
          to: device.token,
          sound: 'default' as const,
          title: candidate.title,
          body: candidate.body,
          data: {
            type: candidate.targetType,
            targetTab: candidate.targetTab,
          },
        },
      ];
      const tickets = await expo.sendPushNotificationsAsync(messages);
      const firstTicket = tickets[0];
      const dedupeWithDevice = `${candidate.dedupeKey}:${device.deviceId}`;

      if (firstTicket.status === 'ok' && firstTicket.id) {
        await repository.markSent(dedupeWithDevice, firstTicket.id);
      } else {
        const errorTicket = firstTicket as { details?: { error?: string }; message?: string };
        const errorCode = errorTicket.details?.error || 'UNKNOWN';
        await repository.markFailed(dedupeWithDevice, errorCode, errorTicket.message || 'Send failed');
        if (errorCode === 'DeviceNotRegistered') {
          await repository.deactivateByToken(device.token);
        }
      }
    } catch (error: any) {
      await repository.markFailed(
        `${candidate.dedupeKey}:${device.deviceId}`,
        'SEND_EXCEPTION',
        error?.message || 'Unexpected send exception'
      );
    }
  }
}

export async function processDeliveryReceipts(repository: NotificationRepository): Promise<void> {
  // In production, query unsynchronized receipt ids from notification_delivery_log.
  // This hook is intentionally kept simple for a drop-in worker template.
  const receiptMap = await expo.getPushNotificationReceiptsAsync([]);
  for (const [receiptId, rawReceipt] of Object.entries(receiptMap as Record<string, any>)) {
    const receipt = rawReceipt as { status?: string; details?: { error?: string } };
    if (receipt.status === 'ok') {
      await repository.markDeliveredByTicket(receiptId);
      continue;
    }
    if (receipt.details?.error === 'DeviceNotRegistered') {
      // Token will be deactivated by sender path on next send; this is a safeguard branch.
    }
  }
}
