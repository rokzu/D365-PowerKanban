export interface FlyOutFormResult {
    canceled: boolean;
    values: any;
}

export interface FlyOutForm {
    title: string;
    fields: any;
    resolve: (result: FlyOutFormResult) => void;
    reject: (e: Error) => void;
}