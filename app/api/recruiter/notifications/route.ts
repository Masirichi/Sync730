import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterSession } from '@/lib/recruiter/auth';
import {
  getLocalNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  getLocalNotificationSettings,
  saveLocalNotificationSettings,
} from '@/lib/recruiter/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const targetWsId = session?.workspaceId || 'ws-sync730-demo';

    const notifications = getLocalNotifications(targetWsId);
    const settings = getLocalNotificationSettings();
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      settings,
    });
  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const targetWsId = session?.workspaceId || 'ws-sync730-demo';
    const body = await req.json();
    const { action, notification_id, settings } = body;

    switch (action) {
      case 'mark_read': {
        if (!notification_id) {
          return NextResponse.json(
            { success: false, error: 'notification_id is required' },
            { status: 400 }
          );
        }
        markNotificationRead(notification_id);
        break;
      }

      case 'mark_all_read': {
        markAllNotificationsRead(targetWsId);
        break;
      }

      case 'clear_all': {
        clearAllNotifications(targetWsId);
        break;
      }

      case 'save_settings': {
        if (settings) {
          saveLocalNotificationSettings(settings);
        }
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    const updatedNotifications = getLocalNotifications(targetWsId);
    const updatedSettings = getLocalNotificationSettings();
    const unreadCount = updatedNotifications.filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      notifications: updatedNotifications,
      unreadCount,
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error('Notifications update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
