export interface Incident {
    [key: string]: any;
    incidentid: string;
    title: string;
    description: string;
    order: number;
    priority: number;
    statecode: number;
    statuscode: number;
}
