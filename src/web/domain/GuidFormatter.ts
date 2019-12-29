export const formatGuid = (guid: string) => {
    return guid?.replace("{", "").replace("}", "");
};