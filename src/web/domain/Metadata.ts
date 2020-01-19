export interface LocalizedLabel {
    Label: string;
    LanguageCode: number;
    IsManaged: boolean;
    MetadataId: string;
    HasChanged?: any;
}

export interface LabelCollection {
    LocalizedLabels: LocalizedLabel[];
    UserLocalizedLabel: LocalizedLabel;
}

export interface BooleanManagedProperty {
    Value: boolean;
    CanBeChanged: boolean;
    ManagedPropertyLogicalName: string;
}

export interface StringManagedProperty {
    Value: string;
    CanBeChanged: boolean;
    ManagedPropertyLogicalName: string;
}

export interface Privilege {
    CanBeBasic: boolean;
    CanBeDeep: boolean;
    CanBeGlobal: boolean;
    CanBeLocal: boolean;
    CanBeEntityReference: boolean;
    CanBeParentEntityReference: boolean;
    Name: string;
    PrivilegeId: string;
    PrivilegeType: string;
}

export interface StringValue {
    Value: string;
}

export interface LocalizedLabel {
    Label: string;
    LanguageCode: number;
    IsManaged: boolean;
    MetadataId: string;
    HasChanged?: any;
}

export interface Option {
    Value: number;
    Color: string;
    IsManaged: boolean;
    ExternalValue?: any;
    ParentValues: any[];
    MetadataId?: any;
    HasChanged?: any;
    State: number;
    TransitionData?: string;
    _parsedTransitionData?: Array<{ source: number; to: number }>;
    Label: LabelCollection;
    Description: LabelCollection;
}

export interface Attribute {
    MetadataId: string;
    HasChanged?: any;
    AttributeOf: string;
    AttributeType: "String" | "Integer" | "Lookup" | "Uniqueidentifier" | "Boolean" | "Double" | "Virtual" | "EntityName" | "Picklist" | "Customer" | "DateTime" | "Decimal" | "BigInt" | "Owner" | "State" | "Memo" | "Status";
    ColumnNumber: number;
    DeprecatedVersion?: any;
    IntroducedVersion: string;
    EntityLogicalName: string;
    IsCustomAttribute: boolean;
    IsPrimaryId: boolean;
    IsValidODataAttribute: boolean;
    IsPrimaryName: boolean;
    IsValidForCreate: boolean;
    IsValidForRead: boolean;
    IsValidForUpdate: boolean;
    CanBeSecuredForRead: boolean;
    CanBeSecuredForCreate: boolean;
    CanBeSecuredForUpdate: boolean;
    IsSecured: boolean;
    IsRetrievable: boolean;
    IsFilterable: boolean;
    IsSearchable: boolean;
    IsManaged: boolean;
    LinkedAttributeId?: any;
    LogicalName: string;
    IsValidForForm: boolean;
    IsRequiredForForm: boolean;
    IsValidForGrid: boolean;
    SchemaName: string;
    ExternalName?: any;
    IsLogical: boolean;
    IsDataSourceSecret: boolean;
    InheritsFrom?: any;
    SourceType?: number;
    AutoNumberFormat?: any;
    Format: string;
    ImeMode: string;
    MaxLength: number;
    YomiOf?: any;
    IsLocalizable: boolean;
    DatabaseLength: number;
    FormulaDefinition: string;
    SourceTypeMask: number;
    AttributeTypeName: StringValue;
    Description: LabelCollection;
    DisplayName: LabelCollection;
    IsAuditEnabled: BooleanManagedProperty;
    IsGlobalFilterEnabled: BooleanManagedProperty;
    IsSortableEnabled: BooleanManagedProperty;
    IsCustomizable: BooleanManagedProperty;
    IsRenameable: BooleanManagedProperty;
    IsValidForAdvancedFind: BooleanManagedProperty;
    RequiredLevel: StringManagedProperty;
    CanModifyAdditionalSettings: BooleanManagedProperty;
    FormatName: StringValue;
    MaxValue?: number;
    MinValue?: number;
    Targets: string[];
    OptionSet: {
        Options: Array<Option>,
        TrueOption: Option,
        FalseOption: Option
    };
}

export interface Metadata {
    Attributes: Array<Attribute>;
    ActivityTypeMask: number;
    AutoRouteToOwnerQueue: boolean;
    CanTriggerWorkflow: boolean;
    EntityHelpUrlEnabled: boolean;
    EntityHelpUrl?: any;
    IsDocumentManagementEnabled: boolean;
    IsOneNoteIntegrationEnabled: boolean;
    IsInteractionCentricEnabled: boolean;
    IsKnowledgeManagementEnabled: boolean;
    IsSLAEnabled: boolean;
    IsBPFEntity: boolean;
    IsDocumentRecommendationsEnabled: boolean;
    IsMSTeamsIntegrationEnabled: boolean;
    DataProviderId?: any;
    DataSourceId?: any;
    AutoCreateAccessTeams: boolean;
    IsActivity: boolean;
    IsActivityParty: boolean;
    IsAvailableOffline: boolean;
    IsChildEntity: boolean;
    IsAIRUpdated: boolean;
    IconLargeName?: any;
    IconMediumName?: any;
    IconSmallName?: any;
    IconVectorName?: any;
    IsCustomEntity: boolean;
    IsBusinessProcessEnabled: boolean;
    SyncToExternalSearchIndex: boolean;
    IsOptimisticConcurrencyEnabled: boolean;
    ChangeTrackingEnabled: boolean;
    IsImportable: boolean;
    IsIntersect: boolean;
    IsManaged: boolean;
    IsEnabledForCharts: boolean;
    IsEnabledForTrace: boolean;
    IsValidForAdvancedFind: boolean;
    DaysSinceRecordLastModified: number;
    MobileOfflineFilters: string;
    IsReadingPaneEnabled: boolean;
    IsQuickCreateEnabled: boolean;
    LogicalName: string;
    ObjectTypeCode: number;
    OwnershipType: string;
    PrimaryNameAttribute: string;
    PrimaryImageAttribute?: any;
    PrimaryIdAttribute: string;
    RecurrenceBaseEntityLogicalName?: any;
    ReportViewName: string;
    SchemaName: string;
    IntroducedVersion: string;
    IsStateModelAware: boolean;
    EnforceStateTransitions: boolean;
    ExternalName?: any;
    EntityColor: string;
    LogicalCollectionName: string;
    ExternalCollectionName?: any;
    CollectionSchemaName: string;
    EntitySetName: string;
    IsEnabledForExternalChannels: boolean;
    IsPrivate: boolean;
    UsesBusinessDataLabelTable: boolean;
    IsLogicalEntity: boolean;
    HasNotes: boolean;
    HasActivities: boolean;
    HasFeedback: boolean;
    IsSolutionAware: boolean;
    MetadataId: string;
    HasChanged?: any;
    Description: LabelCollection;
    DisplayCollectionName: LabelCollection;
    DisplayName: LabelCollection;
    IsAuditEnabled: BooleanManagedProperty;
    IsValidForQueue: BooleanManagedProperty;
    IsConnectionsEnabled: BooleanManagedProperty;
    IsCustomizable: BooleanManagedProperty;
    IsRenameable: BooleanManagedProperty;
    IsMappable: BooleanManagedProperty;
    IsDuplicateDetectionEnabled: BooleanManagedProperty;
    CanCreateAttributes: BooleanManagedProperty;
    CanCreateForms: BooleanManagedProperty;
    CanCreateViews: BooleanManagedProperty;
    CanCreateCharts: BooleanManagedProperty;
    CanBeRelatedEntityInRelationship: BooleanManagedProperty;
    CanBePrimaryEntityInRelationship: BooleanManagedProperty;
    CanBeInManyToMany: BooleanManagedProperty;
    CanBeInCustomEntityAssociation: BooleanManagedProperty;
    CanEnableSyncToExternalSearchIndex: BooleanManagedProperty;
    CanModifyAdditionalSettings: BooleanManagedProperty;
    CanChangeHierarchicalRelationship: BooleanManagedProperty;
    CanChangeTrackingBeEnabled: BooleanManagedProperty;
    IsMailMergeEnabled: BooleanManagedProperty;
    IsVisibleInMobile: BooleanManagedProperty;
    IsVisibleInMobileClient: BooleanManagedProperty;
    IsReadOnlyInMobileClient: BooleanManagedProperty;
    IsOfflineInMobileClient: BooleanManagedProperty;
    Privileges: Privilege[];
}