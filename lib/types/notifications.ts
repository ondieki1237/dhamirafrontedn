export type Notification = {
    _id: string
    title: string
    body: string
    type?: string
    read: boolean
    metadata?: any
    createdBy?: string
    createdAt: string
    updatedAt: string
}

export type LogEntry = {
    timestamp: string
    level: string
    message: string
    raw: string
}

export type LogsResponse = {
    count: number
    entries: LogEntry[]
}

export type NotificationsResponse = {
    count: number
    items: Notification[]
}
