interface SecondaryEntity {
    logicalName: string;
    parentLookup: string;
}

export interface BoardViewConfig {
    entityName: string;
    defaultViewId: string;
    showCreateButton: boolean;
    swimLaneSource: string;
    allowTransitions: boolean;
    showDeleteButton: boolean;
    showDeactivateButton: boolean;
    secondaryEntities: Array<SecondaryEntity>;
}