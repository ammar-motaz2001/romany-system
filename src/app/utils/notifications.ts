// Notification System for Beauty Center

export class NotificationManager {
  private static permission: NotificationPermission = 'default';
  private static enabled: boolean = false;

  // Request permission for notifications
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      // Silently skip if not supported
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.enabled = permission === 'granted';
      return this.enabled;
    } catch (error) {
      // Silently handle errors
      return false;
    }
  }

  // Check if notifications are supported and enabled
  static isEnabled(): boolean {
    return 'Notification' in window && this.permission === 'granted';
  }

  // Send a notification
  static send(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isEnabled()) {
      // Silently skip if notifications are not enabled
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  // Shift Started Notification
  static notifyShiftStarted(cashierName: string, startingCash: number) {
    this.send('🌸 تم فتح الوردية بنجاح!', {
      body: `الكاشير: ${cashierName}\nالرصيد الافتتاحي: ${startingCash.toFixed(2)} ج.م`,
      tag: 'shift-started',
      requireInteraction: false,
    });
  }

  // New Appointment Notification
  static notifyNewAppointment(customerName: string, serviceName: string, time: string) {
    this.send('📅 موعد جديد اليوم!', {
      body: `العميل: ${customerName}\nالخدمة: ${serviceName}\nالوقت: ${time}`,
      tag: 'new-appointment',
      requireInteraction: false,
    });
  }

  // Upcoming Appointment Reminder
  static notifyUpcomingAppointment(customerName: string, serviceName: string, minutesUntil: number) {
    this.send('⏰ موعد قادم!', {
      body: `العميل: ${customerName}\nالخدمة: ${serviceName}\nخلال: ${minutesUntil} دقيقة`,
      tag: 'upcoming-appointment',
      requireInteraction: true,
    });
  }

  // Low Stock Notification
  static notifyLowStock(itemName: string, quantity: number) {
    this.send('⚠️ مخزون منخفض!', {
      body: `${itemName}\nالكمية المتبقية: ${quantity}`,
      tag: 'low-stock',
      requireInteraction: false,
    });
  }

  // New Sale Notification
  static notifyNewSale(total: number, customerName: string) {
    this.send('💰 عملية بيع جديدة!', {
      body: `العميل: ${customerName}\nالمبلغ الإجمالي: ${total.toFixed(2)} ج.م`,
      tag: 'new-sale',
      requireInteraction: false,
    });
  }

  // Shift Closing Reminder
  static notifyShiftClosingReminder(totalSales: number) {
    this.send('🔔 تذكير: أغلق الوردية!', {
      body: `إجمالي المبيعات: ${totalSales.toFixed(2)} ج.م\nلا تنسى إقفال الوردية`,
      tag: 'shift-closing-reminder',
      requireInteraction: true,
    });
  }

  // Check Today's Appointments and send notifications
  static checkTodayAppointments(appointments: any[]) {
    const now = new Date();
    const today = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

    appointments.forEach(appointment => {
      if (appointment.date !== today || appointment.status === 'مكتمل' || appointment.status === 'ملغي') {
        return;
      }

      // Parse appointment time
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const appointmentDate = new Date();
      appointmentDate.setHours(hours, minutes, 0, 0);

      const timeDiff = appointmentDate.getTime() - now.getTime();
      const minutesUntil = Math.floor(timeDiff / (1000 * 60));

      // Notify 15 minutes before appointment
      if (minutesUntil === 15) {
        this.notifyUpcomingAppointment(
          appointment.customer,
          appointment.service,
          15
        );
      }

      // Notify 5 minutes before appointment
      if (minutesUntil === 5) {
        this.notifyUpcomingAppointment(
          appointment.customer,
          appointment.service,
          5
        );
      }

      // Notify when appointment time arrives
      if (minutesUntil === 0) {
        this.notifyUpcomingAppointment(
          appointment.customer,
          appointment.service,
          0
        );
      }
    });
  }
}

// Auto-request permission when module loads
if (typeof window !== 'undefined') {
  NotificationManager.requestPermission();
}
