export const RegexEscape = (text: string) => {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
};