# D365 Power Kanban

This is a custom PCF control for displaying a Kanban inside D365 datasets.

Features so far:
- Supports option sets, status codes and boolean attributes as swimlane sources
- Color schemes are taken from option set color values
- Primary and Secondary entities can be configured, so that you can show accounts and their child cases in one kanban board (choose view Advanced)
- Swimlanes with Drag and Drop functionality (allowed transitions can be defined for statuscode attributes inside their respective state transitions, or via custom script hook)
- Card forms can be used for customizing the display
- Side-By-Side view for quick data view (resizable in lower right corner)
- Custom Buttons and Custom Forms on state transition (via custom script support)
- Search in data, highlighting and filtering
- Support for subscriptions and notifications to records, so that you can subscribe to record changes and see them
- Custom Dialogs, for allowing to also resolve cases, win opportunities etc from the board