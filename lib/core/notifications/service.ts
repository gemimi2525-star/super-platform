/**
 * Notification Service
 * 
 * Create and manage in-app notifications
 */

import {
    db,
    collection,
    doc,
    setDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    COLLECTION_NOTIFICATIONS,
} from '@/lib/firebase';
import type { Notification, NotificationCreate, NotificationType } from '@/lib/types';

/**
 * Create a notification
 */
export async function createNotification(
    data: NotificationCreate
): Promise<string> {
    const notifRef = doc(collection(db, COLLECTION_NOTIFICATIONS));

    const notification: Notification = {
        ...data,
        id: notifRef.id,
        isRead: false,
        readAt: null,
        createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(notifRef, notification);
    return notifRef.id;
}

/**
 * Create info notification
 */
export async function notifyInfo(
    organizationId: string,
    userId: string,
    title: string,
    message: string,
    actionUrl: string | null = null
): Promise<string> {
    return createNotification({
        organizationId,
        userId,
        type: 'info',
        title,
        message,
        actionUrl,
    });
}

/**
 * Create success notification
 */
export async function notifySuccess(
    organizationId: string,
    userId: string,
    title: string,
    message: string,
    actionUrl: string | null = null
): Promise<string> {
    return createNotification({
        organizationId,
        userId,
        type: 'success',
        title,
        message,
        actionUrl,
    });
}

/**
 * Create warning notification
 */
export async function notifyWarning(
    organizationId: string,
    userId: string,
    title: string,
    message: string,
    actionUrl: string | null = null
): Promise<string> {
    return createNotification({
        organizationId,
        userId,
        type: 'warning',
        title,
        message,
        actionUrl,
    });
}

/**
 * Create error notification
 */
export async function notifyError(
    organizationId: string,
    userId: string,
    title: string,
    message: string,
    actionUrl: string | null = null
): Promise<string> {
    return createNotification({
        organizationId,
        userId,
        type: 'error',
        title,
        message,
        actionUrl,
    });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    const notifRef = doc(db, COLLECTION_NOTIFICATIONS, notificationId);

    await updateDoc(notifRef, {
        isRead: true,
        readAt: serverTimestamp(),
    });
}

/**
 * Mark all user notifications as read
 */
export async function markAllAsRead(
    organizationId: string,
    userId: string
): Promise<void> {
    const q = query(
        collection(db, COLLECTION_NOTIFICATIONS),
        where('organizationId', '==', organizationId),
        where('userId', '==', userId),
        where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);

    const updates = snapshot.docs.map(docSnap =>
        updateDoc(docSnap.ref, {
            isRead: true,
            readAt: serverTimestamp(),
        })
    );

    await Promise.all(updates);
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(
    organizationId: string,
    userId: string
): Promise<Notification[]> {
    const q = query(
        collection(db, COLLECTION_NOTIFICATIONS),
        where('organizationId', '==', organizationId),
        where('userId', '==', userId),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Notification);
}

/**
 * Get all notifications for user
 */
export async function getUserNotifications(
    organizationId: string,
    userId: string,
    limitNum: number = 50
): Promise<Notification[]> {
    const q = query(
        collection(db, COLLECTION_NOTIFICATIONS),
        where('organizationId', '==', organizationId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitNum)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Notification);
}

/**
 * Get unread count
 */
export async function getUnreadCount(
    organizationId: string,
    userId: string
): Promise<number> {
    const notifications = await getUnreadNotifications(organizationId, userId);
    return notifications.length;
}
