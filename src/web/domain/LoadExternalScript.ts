export const loadExternalScript = (url: string) => {
    return new Promise((resolve, reject) => {
        const scriptTag = document.createElement("script");

        scriptTag.src = url;
        scriptTag.async = true;
        scriptTag.onload = resolve;

        document.body.append(scriptTag);
    });
};