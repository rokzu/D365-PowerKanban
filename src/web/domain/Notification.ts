export interface Notification {
    oss_name: string;
    oss_notificationid: string;
    oss_event: number;
    oss_data: string;
    oss_text: string;
    parsed: { updatedFields: Array<string>; eventRecordReference: { Id: string; LogicalName: string } };
    [key: string]: any;
}