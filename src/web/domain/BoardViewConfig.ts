import { FlyOutForm } from "./FlyOutForm";

interface SecondaryEntity {
    logicalName: string;
    parentLookup: string;
    swimLaneSource: string;
    transitionCallback: () => Promise<any>;
}

export interface Context {
    showForm: (form: FlyOutForm) => Promise<any>;
}

export interface BoardViewConfig {
    entityName: string;
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