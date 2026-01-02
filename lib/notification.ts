"use client";

/**
 * Request permission for browser notifications
 */
export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notifications.");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
};

/**
 * Show a desktop notification
 */
export const showDesktopNotification = (title: string, options?: NotificationOptions) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
    }

    // Modern browsers require a user interaction context for some audio or just showing notifications, 
    // but the Notification API themselves canUsually be triggered if permission is granted.
    try {
        const notification = new Notification(title, {
            icon: "/logo.png", // Ensure this path is correct or dynamic
            ...options
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Close after 5 seconds
        setTimeout(() => notification.close(), 5000);
    } catch (error) {
        console.error("Error showing notification:", error);
    }
};
