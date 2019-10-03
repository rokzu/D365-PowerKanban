export interface LocalizedLabel {
    Label: string;
    LanguageCode: number;
    IsManaged: boolean;
    MetadataId: string;
    HasChanged?: any;
}

export interface UserLocalizedLabel {
    Label: string;
    LanguageCode: number;
    IsManaged: boolean;
    MetadataId: string;
    HasChanged?: any;
}

export interface Label {
    LocalizedLabels: LocalizedLabel[];
    UserLocalizedLabel: UserLocalizedLabel;
}

export interface Description {
    LocalizedLabels: any[];
    UserLocalizedLabel?: any;
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
    TransitionData?: any;
    Label: Label;
    Description: Description;
}