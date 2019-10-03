export const ParseSearch = () => {
    return window.parent.location.search.substr(1).split("&").map(p => p.split("=")).reduce((all, cur) => { all[cur[0]] = cur[1]; return all; }, {} as {[key: string]: string});
};