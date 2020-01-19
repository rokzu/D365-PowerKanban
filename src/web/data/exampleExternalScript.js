window.boardViewExtender = {};

window.boardViewExtender.onStateTransition = function(context) {
    if (context.target.Value !== 5) {
        return;
    }
    
    return context.showForm({ title: "Test" })
};