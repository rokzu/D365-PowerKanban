import { FlyOutForm } from "./FlyOutForm";

interface SecondaryEntity {
    logicalName: string;
    parentLookup: string;
    swimLaneSource: string;
    transitionCallback: () => Promise<any>;
    notificationLookup: string;
    subscriptionLookup: string;
}

export interface Context {
    showForm: (form: FlyOutForm) => Promise<any>;
}

export interface BoardViewConfig {
    entityName: string;
    notificationLookup: string;
    subscriptionLookup: string;
    defaultViewId: string;
    notificationCardFormId: string;
    showCreateButton: boolean;
    swimLaneSource: string;
    allowTransitions: boolean;
    showDeleteButton: boolean;
    showDeactivateButton: boolean;
    secondaryEntity: SecondaryEntity;
    customScriptUrl: string;
    transitionCallback: string;
}