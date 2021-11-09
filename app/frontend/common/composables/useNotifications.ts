import { v4 as uuid } from 'uuid'
import { ref } from 'vue'

interface NewNotificationInterface {
  id?: string
  message: string
  messagePlaceholder?: string[]
  type: string // TODO type for different types or enum?
  duration?: number
}

interface NotificationInterface extends NewNotificationInterface {
  id: string
}

const notifications = ref<NotificationInterface[]>([])
const defaultNotificationDuration = 5000

function removeNotification(id: string) {
  notifications.value = notifications.value.filter(
    (notification: NotificationInterface) => notification.id !== id,
  )
}

export default function useNotifications() {
  function notify(notification: NewNotificationInterface): string {
    // TODO: Check different solution for the optional id in the interface, but required field in the removeNotification function.
    let { id } = notification
    if (!id) {
      id = uuid()
    }

    const newNotification: NotificationInterface = { id, ...notification }

    notifications.value.push(newNotification)

    setTimeout(() => {
      removeNotification(newNotification.id)
    }, newNotification.duration || defaultNotificationDuration)

    return newNotification.id
  }

  return {
    notify,
    notifications,
  }
}